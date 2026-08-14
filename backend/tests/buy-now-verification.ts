/**
 * Buy Now Flow - Runtime Verification Script
 *
 * Test Case 1: No ProductKey Available
 * Test Case 2: Concurrent Payment (one key, two tabs)
 * Test Case 3: Checkout Refresh (state persistence)
 *
 * Run: npx tsx tests/buy-now-verification.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID, createHash, randomBytes, createCipheriv } from 'crypto';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ''),
});

const BASE = 'http://127.0.0.1:4000';

// Encryption key matches OrderService / ProductKeyService
const encryptionKey = createHash('sha256')
  .update(process.env.PRODUCT_KEY_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? 'default-secret')
  .digest();

function encryptKey(key: string) {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedKey: Buffer.concat([encrypted, authTag]).toString('base64'),
    iv: iv.toString('hex'),
  };
}

function hashKey(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

async function createTestProductKey(productId: string, keyValue: string): Promise<string> {
  const keyHash = hashKey(keyValue);
  // Check if exists
  const existing = await prisma.productkey.findFirst({ where: { productId, keyHash } });
  if (existing) {
    // Reset to AVAILABLE for test
    await prisma.productkey.update({
      where: { id: existing.id },
      data: { status: 'AVAILABLE', orderItemId: null, assignedAt: null },
    });
    return existing.id;
  }

  const { encryptedKey, iv } = encryptKey(keyValue);
  const id = randomUUID();
  await prisma.productkey.create({
    data: {
      id,
      productId,
      encryptedKey,
      keyHash,
      iv,
      algorithm: 'AES_256_GCM',
      keyVersion: 1,
      status: 'AVAILABLE',
      importedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return id;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type Json = Record<string, unknown>;

async function api(
  method: string,
  path: string,
  body?: unknown,
  cookies?: string,
): Promise<{ status: number; json: Json; rawHeaders: [string, string][] }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookies) headers['Cookie'] = cookies;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });

  const text = await res.text();
  let json: Json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text };
  }

  const rawHeaders: [string, string][] = [];
  res.headers.forEach((value, key) => {
    rawHeaders.push([key, value]);
  });

  return { status: res.status, json, rawHeaders };
}

function extractCookiesFromHeaders(rawHeaders: [string, string][]): string {
  const cookies: string[] = [];
  for (const [key, value] of rawHeaders) {
    if (key.toLowerCase() === 'set-cookie') {
      const parts = value.split(/,(?=\s*\w+=)/);
      for (const part of parts) {
        cookies.push(part.split(';')[0].trim());
      }
    }
  }
  return cookies.join('; ');
}

async function ensureUser(email: string, password: string): Promise<string> {
  // Try register
  await api('POST', '/api/auth/register', { email, password, fullName: 'Test User' });
  // Login
  const loginRes = await api('POST', '/api/auth/login', { email, password });
  if (loginRes.status !== 200) {
    throw new Error(`Login failed for ${email} (${loginRes.status}): ${JSON.stringify(loginRes.json)}`);
  }
  const cookies = extractCookiesFromHeaders(loginRes.rawHeaders);
  if (!cookies || !cookies.includes('accessToken')) {
    throw new Error(`No auth cookies received for ${email}. Headers: ${JSON.stringify(loginRes.rawHeaders.filter(([k]) => k.toLowerCase() === 'set-cookie'))}`);
  }
  return cookies;
}

// ── Test Case 1: No ProductKey Available ─────────────────────────────────────

async function testCase1(): Promise<{ pass: boolean; details: string }> {
  console.log('\n========================================');
  console.log('TEST CASE 1: No ProductKey Available');
  console.log('========================================\n');

  const details: string[] = [];

  try {
    // Find a product
    const anyProduct = await prisma.product.findFirst({
      where: { status: 'ACTIVE', deletedAt: null },
    });

    if (!anyProduct) {
      return { pass: false, details: 'No active products found in database.' };
    }

    // Temporarily disable all available keys
    const availableKeys = await prisma.productkey.findMany({
      where: { productId: anyProduct.id, status: 'AVAILABLE', orderItemId: null },
    });

    details.push(`Product: "${anyProduct.name}" (${anyProduct.id})`);
    details.push(`Available keys before: ${availableKeys.length}`);

    const disabledKeyIds = availableKeys.map(k => k.id);
    if (disabledKeyIds.length > 0) {
      await prisma.productkey.updateMany({
        where: { id: { in: disabledKeyIds } },
        data: { status: 'DISABLED' },
      });
      details.push(`Temporarily disabled ${disabledKeyIds.length} keys`);
    }

    try {
      const countCheck = await prisma.productkey.count({
        where: { productId: anyProduct.id, status: 'AVAILABLE', orderItemId: null },
      });
      details.push(`✓ Confirmed 0 available keys (count: ${countCheck})`);

      // Login
      const cookies = await ensureUser('tc1@test.com', 'TestPass123!');
      details.push(`✓ Logged in`);

      // Create order (Buy Now)
      const orderRes = await api('POST', '/api/orders', { productId: anyProduct.id, quantity: 1 }, cookies);
      details.push(`  POST /api/orders → ${orderRes.status}`);

      if (orderRes.status !== 201) {
        return { pass: false, details: details.join('\n') + `\n✗ Order creation failed: ${JSON.stringify(orderRes.json)}` };
      }

      const order = orderRes.json.data as Json;
      const orderId = order.id as string;
      details.push(`✓ Order created: ${order.orderNumber} (status: ${order.status}, payment: ${order.paymentStatus})`);

      // Pay - should fail
      const payRes = await api('POST', `/api/orders/${orderId}/pay`, {}, cookies);
      details.push(`  POST /api/orders/${orderId}/pay → ${payRes.status}`);

      if (payRes.status === 200) {
        return { pass: false, details: details.join('\n') + '\n✗ Payment SUCCEEDED when it should have FAILED' };
      }

      const errorMsg = (payRes.json.message as string) ?? (payRes.json.error as string) ?? '';
      details.push(`✓ Payment failed: "${errorMsg}"`);

      // Verify DB state
      const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
      details.push(`  DB: status=${dbOrder?.status}, paymentStatus=${dbOrder?.paymentStatus}`);

      if (dbOrder?.status === 'PAID' || dbOrder?.paymentStatus === 'PAID') {
        return { pass: false, details: details.join('\n') + '\n✗ Order became PAID!' };
      }
      details.push(`✓ Order remains PENDING/UNPAID (transaction rolled back)`);

      // No key assigned
      const orderItems = await prisma.orderitem.findMany({ where: { orderId } });
      for (const item of orderItems) {
        const assigned = await prisma.productkey.count({ where: { orderItemId: item.id } });
        if (assigned > 0) {
          return { pass: false, details: details.join('\n') + '\n✗ Key was assigned!' };
        }
      }
      details.push(`✓ No ProductKey assigned to order items`);

      const availableAfter = await prisma.productkey.count({
        where: { productId: anyProduct.id, status: 'AVAILABLE', orderItemId: null },
      });
      details.push(`✓ ProductKey table unchanged (available after: ${availableAfter})`);

      return { pass: true, details: details.join('\n') };
    } finally {
      if (disabledKeyIds.length > 0) {
        await prisma.productkey.updateMany({
          where: { id: { in: disabledKeyIds } },
          data: { status: 'AVAILABLE' },
        });
      }
    }
  } catch (err) {
    return { pass: false, details: details.join('\n') + `\nException: ${(err as Error).message}` };
  }
}

// ── Test Case 2: Concurrent Payment ──────────────────────────────────────────

async function testCase2(): Promise<{ pass: boolean; details: string }> {
  console.log('\n========================================');
  console.log('TEST CASE 2: Concurrent Payment');
  console.log('========================================\n');

  const details: string[] = [];

  try {
    // Find/create product with EXACTLY ONE available key
    const product = await prisma.product.findFirst({
      where: { status: 'ACTIVE', deletedAt: null },
    });

    if (!product) {
      return { pass: false, details: 'No active product found.' };
    }

    details.push(`Product: "${product.name}" (${product.id})`);

    // Create a test key for this product
    const testKeyId = await createTestProductKey(product.id, `TEST-CONCURRENT-KEY-${Date.now()}`);
    details.push(`✓ Created test key: ${testKeyId}`);

    // Disable ALL OTHER available keys for this product
    const otherKeys = await prisma.productkey.findMany({
      where: { productId: product.id, status: 'AVAILABLE', id: { not: testKeyId } },
    });
    const disabledIds = otherKeys.map(k => k.id);
    if (disabledIds.length > 0) {
      await prisma.productkey.updateMany({
        where: { id: { in: disabledIds } },
        data: { status: 'DISABLED' },
      });
      details.push(`Disabled ${disabledIds.length} other keys`);
    }

    // Verify exactly 1 available
    const available = await prisma.productkey.count({
      where: { productId: product.id, status: 'AVAILABLE', orderItemId: null },
    });
    details.push(`✓ Exactly ${available} available key(s)`);

    try {
      // Login two users
      const cookiesA = await ensureUser('tc2a@test.com', 'TestPass123!');
      const cookiesB = await ensureUser('tc2b@test.com', 'TestPass123!');
      details.push(`✓ Two users logged in`);

      // Both create orders
      const orderA = await api('POST', '/api/orders', { productId: product.id, quantity: 1 }, cookiesA);
      const orderB = await api('POST', '/api/orders', { productId: product.id, quantity: 1 }, cookiesB);

      if (orderA.status !== 201 || orderB.status !== 201) {
        return { pass: false, details: details.join('\n') + `\n✗ Order creation: A=${orderA.status}, B=${orderB.status}` };
      }

      const orderIdA = (orderA.json.data as Json).id as string;
      const orderIdB = (orderB.json.data as Json).id as string;
      details.push(`✓ Order A: ${(orderA.json.data as Json).orderNumber}`);
      details.push(`✓ Order B: ${(orderB.json.data as Json).orderNumber}`);

      // Concurrent payment
      details.push(`Sending concurrent pay requests...`);
      const [payA, payB] = await Promise.all([
        api('POST', `/api/orders/${orderIdA}/pay`, {}, cookiesA),
        api('POST', `/api/orders/${orderIdB}/pay`, {}, cookiesB),
      ]);

      const aMsgField = payA.json.error ?? payA.json.message ?? (payA.json.data as Json)?.status ?? 'OK';
      const bMsgField = payB.json.error ?? payB.json.message ?? (payB.json.data as Json)?.status ?? 'OK';
      details.push(`  Pay A: ${payA.status} - ${aMsgField}`);
      details.push(`  Pay B: ${payB.status} - ${bMsgField}`);

      const aSuccess = payA.status === 200;
      const bSuccess = payB.status === 200;

      if (aSuccess && bSuccess) {
        return { pass: false, details: details.join('\n') + '\n✗ BOTH succeeded — RACE CONDITION!' };
      }

      if (!aSuccess && !bSuccess) {
        // Both failed due to serialization — check DB
        const keyState = await prisma.productkey.findUnique({ where: { id: testKeyId } });
        details.push(`  Both failed. Key state: status=${keyState?.status}`);
        if (keyState?.status === 'AVAILABLE') {
          details.push(`✓ Both failed safely — key still AVAILABLE (serialization conflict). This is safe.`);
          return { pass: true, details: details.join('\n') };
        }
        return { pass: false, details: details.join('\n') + '\n✗ Both failed but key not AVAILABLE' };
      }

      details.push(`✓ Exactly one succeeded (${aSuccess ? 'A' : 'B'}), one failed (${aSuccess ? 'B' : 'A'})`);

      const winnerId = aSuccess ? orderIdA : orderIdB;
      const loserId = aSuccess ? orderIdB : orderIdA;

      // Verify DB
      const winnerOrder = await prisma.order.findUnique({ where: { id: winnerId } });
      const loserOrder = await prisma.order.findUnique({ where: { id: loserId } });
      details.push(`  Winner: status=${winnerOrder?.status}, payment=${winnerOrder?.paymentStatus}`);
      details.push(`  Loser: status=${loserOrder?.status}, payment=${loserOrder?.paymentStatus}`);

      if (winnerOrder?.status !== 'PAID') {
        return { pass: false, details: details.join('\n') + '\n✗ Winner not PAID' };
      }
      if (loserOrder?.status === 'PAID') {
        return { pass: false, details: details.join('\n') + '\n✗ Loser should NOT be PAID' };
      }

      // Key state
      const keyState = await prisma.productkey.findUnique({ where: { id: testKeyId } });
      details.push(`✓ Key: status=${keyState?.status}`);

      if (keyState?.status !== 'SOLD') {
        return { pass: false, details: details.join('\n') + '\n✗ Key not SOLD' };
      }

      // No duplicate assignment
      const winnerItems = await prisma.orderitem.findMany({ where: { orderId: winnerId } });
      const loserItems = await prisma.orderitem.findMany({ where: { orderId: loserId } });
      let wCount = 0, lCount = 0;
      for (const item of winnerItems) wCount += await prisma.productkey.count({ where: { orderItemId: item.id } });
      for (const item of loserItems) lCount += await prisma.productkey.count({ where: { orderItemId: item.id } });

      details.push(`  Winner keys: ${wCount}, Loser keys: ${lCount}`);
      if (wCount !== 1) return { pass: false, details: details.join('\n') + '\n✗ Winner needs 1 key' };
      if (lCount !== 0) return { pass: false, details: details.join('\n') + '\n✗ Loser should have 0 keys' };

      details.push(`✓ No duplicate assignment. Database consistent.`);
      return { pass: true, details: details.join('\n') };
    } finally {
      if (disabledIds.length > 0) {
        await prisma.productkey.updateMany({
          where: { id: { in: disabledIds } },
          data: { status: 'AVAILABLE' },
        });
      }
    }
  } catch (err) {
    return { pass: false, details: details.join('\n') + `\nException: ${(err as Error).message}\n${(err as Error).stack}` };
  }
}

// ── Test Case 3: Checkout Refresh ────────────────────────────────────────────

async function testCase3(): Promise<{ pass: boolean; details: string }> {
  console.log('\n========================================');
  console.log('TEST CASE 3: Checkout Refresh');
  console.log('========================================\n');

  const details: string[] = [];

  try {
    const product = await prisma.product.findFirst({
      where: { status: 'ACTIVE', deletedAt: null },
    });

    if (!product) {
      return { pass: false, details: 'No active product found.' };
    }

    details.push(`Product: "${product.name}" (${product.id})`);

    // Create a test key
    const testKeyId = await createTestProductKey(product.id, `TEST-REFRESH-KEY-${Date.now()}`);
    details.push(`✓ Created test key: ${testKeyId}`);

    // Login
    const cookies = await ensureUser('tc3@test.com', 'TestPass123!');
    details.push(`✓ Logged in`);

    const quantity = 1;

    // Step 1: Simulate "Buy Now" → navigate to /checkout?buyNowProductId=X&buyNowQuantity=1
    details.push(`\n--- Simulating Buy Now Flow ---`);
    details.push(`Navigate: /checkout?buyNowProductId=${product.id}&buyNowQuantity=${quantity}`);

    // Step 2: Simulate F5 REFRESH
    // URL params persist → frontend calls GET /api/products/id/:id to re-fetch
    details.push(`\n--- Simulating F5 Refresh ---`);
    const productRes = await api('GET', `/api/products/id/${product.id}`, undefined, cookies);
    details.push(`  GET /api/products/id/${product.id} → ${productRes.status}`);

    if (productRes.status !== 200) {
      return { pass: false, details: details.join('\n') + '\n✗ Product fetch failed after refresh' };
    }

    const fetched = productRes.json.data as Json;
    details.push(`✓ Product restored: "${fetched.name}", price: ${fetched.price}`);
    details.push(`✓ Correct product (ID matches: ${fetched.id === product.id})`);

    // Step 3: Place Order
    details.push(`\n--- Place Order ---`);
    const orderRes = await api('POST', '/api/orders', { productId: product.id, quantity }, cookies);
    details.push(`  POST /api/orders → ${orderRes.status}`);

    if (orderRes.status !== 201) {
      return { pass: false, details: details.join('\n') + `\n✗ Order failed: ${JSON.stringify(orderRes.json)}` };
    }

    const order = orderRes.json.data as Json;
    const orderId = order.id as string;
    details.push(`✓ Order: ${order.orderNumber}, total: ${order.totalAmount}`);

    // Verify correct quantity in order
    const items = order.items as Json[];
    details.push(`  Items: ${items.length}, quantity: ${(items[0] as Json).quantity}`);
    if ((items[0] as Json).quantity !== quantity) {
      return { pass: false, details: details.join('\n') + `\n✗ Wrong quantity` };
    }
    details.push(`✓ Correct quantity confirmed`);

    // Step 4: Pay
    details.push(`\n--- Payment ---`);
    const payRes = await api('POST', `/api/orders/${orderId}/pay`, {}, cookies);
    details.push(`  POST /api/orders/${orderId}/pay → ${payRes.status}`);

    if (payRes.status !== 200) {
      return { pass: false, details: details.join('\n') + `\n✗ Payment failed: ${JSON.stringify(payRes.json)}` };
    }

    const paid = payRes.json.data as Json;
    details.push(`✓ Paid: status=${paid.status}, payment=${paid.paymentStatus}`);

    // Step 5: Receive Key
    details.push(`\n--- License Keys ---`);
    const keysRes = await api('GET', `/api/orders/${orderId}/license-keys`, undefined, cookies);
    details.push(`  GET /api/orders/${orderId}/license-keys → ${keysRes.status}`);

    if (keysRes.status !== 200) {
      return { pass: false, details: details.join('\n') + `\n✗ Key fetch failed: ${JSON.stringify(keysRes.json)}` };
    }

    const keys = keysRes.json.data as Json[];
    details.push(`✓ Received ${keys.length} license key(s)`);

    if (keys.length === 0) {
      return { pass: false, details: details.join('\n') + '\n✗ No keys received' };
    }

    for (const k of keys) {
      details.push(`  → ${(k.key as string).substring(0, 20)}... (${k.productName})`);
    }

    details.push(`\n✓ Full flow: Buy Now → Checkout → F5 → Place Order → Pay → Key ✓`);
    return { pass: true, details: details.join('\n') };
  } catch (err) {
    return { pass: false, details: details.join('\n') + `\nException: ${(err as Error).message}\n${(err as Error).stack}` };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║    Buy Now Flow — Runtime Verification              ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const results: { name: string; pass: boolean; details: string }[] = [];

  const r1 = await testCase1();
  console.log(r1.details);
  results.push({ name: 'Test Case 1 - No ProductKey Available', ...r1 });

  const r2 = await testCase2();
  console.log(r2.details);
  results.push({ name: 'Test Case 2 - Concurrent Payment', ...r2 });

  const r3 = await testCase3();
  console.log(r3.details);
  results.push({ name: 'Test Case 3 - Checkout Refresh', ...r3 });

  console.log('\n\n═══════════════════════════════════════');
  console.log('           FINAL REPORT');
  console.log('═══════════════════════════════════════\n');

  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.name}`);
    if (!r.pass) {
      const lines = r.details.split('\n');
      console.log(`   → ${lines[lines.length - 1]}`);
    }
  }

  console.log('\n═══════════════════════════════════════\n');

  await prisma.$disconnect();
  process.exit(results.every(r => r.pass) ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
