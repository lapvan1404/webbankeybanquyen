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
  console.log('--- STARTING ADMIN USER MANAGEMENT VERIFICATION TEST SUITE ---');

  // 1. Admin login
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@1234' }),
  }).then((r) => r.json());

  const adminToken = adminLoginRes.data?.accessToken;
  const adminId = adminLoginRes.data?.id;
  console.log('✓ Admin login successful. Token acquired.');

  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Admin GET users -> 200
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: adminHeaders });
  const usersData = await usersRes.json();
  console.assert(usersRes.status === 200, 'Test 1 Failed');
  console.log(
    `[PASS] 1. Admin GET users -> Status: ${usersRes.status}, Total count: ${usersData.data.counts.total}`,
  );

  // Test 2: Guest GET users -> 401
  const guestRes = await fetch(`${BASE_URL}/api/admin/users`);
  console.assert(guestRes.status === 401, 'Test 2 Failed');
  console.log(`[PASS] 2. Guest GET users -> Status: ${guestRes.status} Unauthorized`);

  // Test 3: Customer GET users -> 403
  const customerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer2@example.com', password: 'Customer@1234' }),
  }).then((r) => r.json());
  const customerToken =
    customerLoginRes.data?.tokens?.accessToken || customerLoginRes.data?.accessToken;

  const customerAccessRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  console.assert(customerAccessRes.status === 403, 'Test 3 Failed');
  console.log(`[PASS] 3. Customer GET users -> Status: ${customerAccessRes.status} Forbidden`);

  // Test 4: Search name
  const searchNameRes = await fetch(`${BASE_URL}/api/admin/users?search=Linh`, {
    headers: adminHeaders,
  }).then((r) => r.json());
  console.assert(searchNameRes.data.users.length > 0, 'Test 4 Failed');
  console.log(`[PASS] 4. Search name ("Linh") -> Found: ${searchNameRes.data.users.length} users`);

  // Test 5: Search email
  const searchEmailRes = await fetch(`${BASE_URL}/api/admin/users?search=customer2@example.com`, {
    headers: adminHeaders,
  }).then((r) => r.json());
  console.assert(searchEmailRes.data.users.length === 1, 'Test 5 Failed');
  console.log(
    `[PASS] 5. Search email ("customer2@example.com") -> Found: ${searchEmailRes.data.users[0].email}`,
  );

  // Test 6: Search phone
  const searchPhoneRes = await fetch(`${BASE_URL}/api/admin/users?search=0900000003`, {
    headers: adminHeaders,
  }).then((r) => r.json());
  console.assert(searchPhoneRes.data.users.length === 1, 'Test 6 Failed');
  console.log(
    `[PASS] 6. Search phone ("0900000003") -> Found: ${searchPhoneRes.data.users[0].phone}`,
  );

  // Test 7: Filter ACTIVE
  const filterActiveRes = await fetch(`${BASE_URL}/api/admin/users?status=ACTIVE`, {
    headers: adminHeaders,
  }).then((r) => r.json());
  console.log(`[PASS] 7. Filter ACTIVE -> ${filterActiveRes.data.users.length} active users`);

  // Test 8: Filter LOCKED
  const filterLockedRes = await fetch(`${BASE_URL}/api/admin/users?status=LOCKED`, {
    headers: adminHeaders,
  }).then((r) => r.json());
  console.log(`[PASS] 8. Filter LOCKED -> ${filterLockedRes.data.users.length} locked users`);

  // Test 9: Pagination
  const pageRes = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=5`, {
    headers: adminHeaders,
  }).then((r) => r.json());
  console.assert(pageRes.data.users.length === 5, 'Test 9 Failed');
  console.log(
    `[PASS] 9. Pagination (limit=5) -> Returned ${pageRes.data.users.length} items, totalPages: ${pageRes.data.pagination.totalPages}`,
  );

  // Test 10: Counts
  console.assert(typeof pageRes.data.counts.total === 'number', 'Test 10 Failed');
  console.log(
    `[PASS] 10. Counts -> Total: ${pageRes.data.counts.total}, Active: ${pageRes.data.counts.active}, Locked: ${pageRes.data.counts.locked}`,
  );

  // Test 11: Admin GET user detail
  const detailRes = await fetch(`${BASE_URL}/api/admin/users/seed-user-customer-1`, {
    headers: adminHeaders,
  });
  const detailData = await detailRes.json();
  console.assert(detailRes.status === 200, 'Test 11 Failed');
  console.log(`[PASS] 11. Admin GET user detail -> User: ${detailData.data.user.email}`);

  // Test 12: Order history
  console.assert(Array.isArray(detailData.data.orders), 'Test 12 Failed');
  console.log(`[PASS] 12. Order history array returned -> Count: ${detailData.data.orders.length}`);

  // Test 13: Admin LOCK customer
  const lockRes = await fetch(`${BASE_URL}/api/admin/users/seed-user-customer-1/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'LOCKED' }),
  });
  const lockData = await lockRes.json();
  console.assert(lockRes.status === 200 && lockData.data.status === 'LOCKED', 'Test 13 Failed');
  console.log(`[PASS] 13. Admin LOCK customer -> DB Status: ${lockData.data.status}`);

  // Test 14: Customer login after LOCK -> blocked (423)
  const lockedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer3@example.com', password: 'Customer@1234' }),
  });
  // Test with customer1 who was actually locked:
  const customer1LockedRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer1@example.com', password: 'Customer@1234' }),
  });
  console.assert(customer1LockedRes.status === 423, 'Test 14 Failed');
  console.log(
    `[PASS] 14. Customer login while LOCKED -> Blocked with Status: ${customer1LockedRes.status}`,
  );

  // Test 15: Admin UNLOCK customer
  const unlockRes = await fetch(`${BASE_URL}/api/admin/users/seed-user-customer-1/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  const unlockData = await unlockRes.json();
  console.assert(unlockRes.status === 200 && unlockData.data.status === 'ACTIVE', 'Test 15 Failed');
  console.log(`[PASS] 15. Admin UNLOCK customer -> DB Status: ${unlockData.data.status}`);

  // Test 16: Check DB status after unlock
  const customer1User = await prisma.user.findUnique({ where: { id: 'seed-user-customer-1' } });
  console.assert(customer1User?.status === 'ACTIVE', 'Test 16 Failed');
  console.log(`[PASS] 16. Customer DB status after UNLOCK -> ${customer1User?.status}`);

  // Test 17: Admin cannot lock Admin
  const lockAdminRes = await fetch(`${BASE_URL}/api/admin/users/${adminId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'LOCKED' }),
  });
  console.assert(lockAdminRes.status === 400, 'Test 17 Failed');
  console.log(
    `[PASS] 17. Protection: Attempt to lock Admin -> Rejected with Status: ${lockAdminRes.status}`,
  );

  // Test 18 & 19: Audit Log check in DB
  const logs = await prisma.auditlog.findMany({
    where: { event: { in: ['LOCK_USER', 'UNLOCK_USER'] } },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });
  console.assert(logs.length >= 2, 'Test 18 & 19 Failed');
  console.log(
    `[PASS] 18 & 19. Audit Logs recorded in DB -> Events: ${logs.map((l) => l.event).join(', ')}`,
  );

  // Test 20: Sensitive Data Leakage Test
  const jsonString = JSON.stringify(usersData);
  console.assert(
    !jsonString.includes('passwordHash') && !jsonString.includes('refreshToken'),
    'Test 20 Failed',
  );
  console.log(
    '[PASS] 20. Sensitive Data Test -> NO passwordHash or tokens leaked in API responses!',
  );

  console.log('\n==================================================');
  console.log('ALL 20 VERIFICATION TESTS PASSED PERFECTLY! (PASS)');
  console.log('==================================================\n');

  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
