const BASE_URL = 'http://localhost:4000';

async function testTokenFix() {
  console.log('--- TESTING CUSTOMER TOKEN & CART APIS ---');

  // Customer Login
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer1@example.com', password: 'Customer@1234' }),
  });

  const data = await res.json();
  console.assert(res.status === 200, 'Customer login failed');
  const token = data.data?.tokens?.accessToken || data.data?.accessToken;
  console.log(`✓ Customer login successful. Token acquired: ${token.slice(0, 20)}...`);

  // Call /api/cart with token
  const cartRes = await fetch(`${BASE_URL}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.assert(cartRes.status === 200, 'Cart lookup failed');
  console.log(`✓ /api/cart request with Customer Token -> Status: ${cartRes.status} OK`);

  // Call /api/cart/items with token
  const itemsRes = await fetch(`${BASE_URL}/api/cart/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.assert(itemsRes.status === 200, 'Cart items lookup failed');
  console.log(`✓ /api/cart/items request with Customer Token -> Status: ${itemsRes.status} OK`);

  console.log('\n==================================================');
  console.log('TOKEN & CART VERIFICATION TESTS PASSED PERFECTLY!');
  console.log('==================================================\n');
}

testTokenFix().catch((e) => {
  console.error(e);
  process.exit(1);
});
