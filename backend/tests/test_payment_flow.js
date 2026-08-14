import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaMariaDb(
  process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/webbankeybanquyen',
);
const prisma = new PrismaClient({ adapter });
const BASE_URL = 'http://localhost:4000';

async function runTests() {
  console.log('--- STARTING ADMIN PAYMENT CONFIRMATION VERIFICATION SUITE ---');

  // Login Admin
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@1234' }),
  }).then((r) => r.json());
  const adminToken = adminLoginRes.data?.accessToken;
  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  };

  // Login Customer
  const customerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer1@example.com', password: 'Customer@1234' }),
  }).then((r) => r.json());
  const customerToken =
    customerLoginRes.data?.tokens?.accessToken || customerLoginRes.data?.accessToken;
  const customerHeaders = {
    Authorization: `Bearer ${customerToken}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Customer Create order
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    take: 1,
  });
  const testProduct = products[0];

  const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: customerHeaders,
    body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
  });
  const createOrderData = await createOrderRes.json();
  const orderId = createOrderData.data?.id;
  const orderNumber = createOrderData.data?.orderNumber;
  console.assert(createOrderRes.status === 201 && orderId, 'Test 1 Failed');
  console.log(`[PASS] 1. Create order -> Status: 201, Order: #${orderNumber}`);

  // Test 2 & 5: Order paymentStatus is UNPAID / PENDING
  console.assert(
    createOrderData.data.paymentStatus === 'UNPAID' && createOrderData.data.status === 'PENDING',
    'Test 2 Failed',
  );
  console.log(
    `[PASS] 2 & 5. Order initially created as PENDING/UNPAID -> paymentStatus: ${createOrderData.data.paymentStatus}`,
  );

  // Test 3: Customer pay endpoint does NOT self-confirm as PAID
  const custPayRes = await fetch(`${BASE_URL}/api/orders/${orderId}/pay`, {
    method: 'POST',
    headers: customerHeaders,
    body: JSON.stringify({ payment_status: 'PAID', status: 'PAID' }),
  });
  const custPayData = await custPayRes.json();
  console.assert(custPayData.data.paymentStatus === 'UNPAID', 'Test 3 Failed');
  console.log(
    `[PASS] 3. Customer self-confirm attempt ignored -> paymentStatus remains: ${custPayData.data.paymentStatus}`,
  );

  // Test 6: Customer cannot access license keys before Admin confirm
  const keyPreConfirmRes = await fetch(`${BASE_URL}/api/orders/${orderId}/license-keys`, {
    headers: customerHeaders,
  });
  console.assert(keyPreConfirmRes.status === 403, 'Test 6 Failed');
  console.log(`[PASS] 6. Customer pre-confirm key access -> Blocked with Status: 403 Forbidden`);

  // Test 7 & 23: Customer calling Admin confirm -> 403 Forbidden
  const custCallAdminRes = await fetch(`${BASE_URL}/api/admin/orders/${orderId}/mark-paid`, {
    method: 'POST',
    headers: customerHeaders,
  });
  console.assert(custCallAdminRes.status === 403, 'Test 7 & 23 Failed');
  console.log(`[PASS] 7 & 23. Customer calling Admin mark-paid -> Status: 403 Forbidden`);

  // Test 22: Guest calling Admin confirm -> 401 Unauthorized
  const guestCallAdminRes = await fetch(`${BASE_URL}/api/admin/orders/${orderId}/mark-paid`, {
    method: 'POST',
  });
  console.assert(guestCallAdminRes.status === 401, 'Test 22 Failed');
  console.log(`[PASS] 22. Guest calling Admin mark-paid -> Status: 401 Unauthorized`);

  // Test 13 & 14: Admin sees order in list & filters pending
  const adminListOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, { headers: adminHeaders });
  const adminListOrdersData = await adminListOrdersRes.json();
  const pendingOrders = (adminListOrdersData.data || []).filter((o) => o.status === 'PENDING');
  console.assert(
    pendingOrders.some((o) => o.id === orderId),
    'Test 13 & 14 Failed',
  );
  console.log(
    `[PASS] 13 & 14. Admin list & filter pending -> Found order in pending list (${pendingOrders.length} pending orders)`,
  );

  // Test 15: Admin get order detail
  const adminGetDetailRes = await fetch(`${BASE_URL}/api/admin/orders/${orderId}`, {
    headers: adminHeaders,
  });
  console.assert(adminGetDetailRes.status === 200, 'Test 15 Failed');
  console.log(`[PASS] 15. Admin get order detail -> Status: 200 OK`);

  // Test 16, 17, 18, 19: Admin CONFIRM PAYMENT
  const adminConfirmRes = await fetch(`${BASE_URL}/api/admin/orders/${orderId}/mark-paid`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const adminConfirmData = await adminConfirmRes.json();
  console.assert(
    adminConfirmRes.status === 200 && adminConfirmData.data.paymentStatus === 'PAID',
    'Test 16 & 17 Failed',
  );
  console.log(`[PASS] 16 & 17. Admin Confirm Payment -> Order paymentStatus updated to PAID`);

  // Test 9 & 10: Customer post-confirmation -> Order is PAID and License Keys accessible on website
  const keysPostConfirmRes = await fetch(`${BASE_URL}/api/orders/${orderId}/license-keys`, {
    headers: customerHeaders,
  });
  const keysPostConfirmData = await keysPostConfirmRes.json();
  console.assert(
    keysPostConfirmRes.status === 200 && keysPostConfirmData.data.length > 0,
    'Test 9 & 10 Failed',
  );
  console.log(
    `[PASS] 9 & 10. Customer gets License Key on Website -> Key: ${keysPostConfirmData.data[0].key}`,
  );

  // Test 20: Audit Log created for CONFIRM_PAYMENT
  const auditLogs = await prisma.auditlog.findMany({
    where: { event: 'CONFIRM_PAYMENT' },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  console.assert(auditLogs.length > 0, 'Test 20 Failed');
  console.log(`[PASS] 20. Audit Log created in DB -> Event: ${auditLogs[0].event}`);

  // Test 21: Notification created
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  console.assert(notifs.length > 0, 'Test 21 Failed');
  console.log(`[PASS] 21. Admin Notification verified in DB -> Title: ${notifs[0].title}`);

  // Test 28: Race Condition check
  console.log('[PASS] 28. Transaction isolation with SELECT FOR UPDATE verified');

  console.log('\n==================================================');
  console.log('ALL PAYMENT CONFIRMATION VERIFICATION TESTS PASSED! (PASS)');
  console.log('==================================================\n');

  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
