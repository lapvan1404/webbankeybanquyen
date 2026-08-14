# Product Authorization Review

## Permission Matrix

- product.read — read/list products (assigned to ADMIN in role permissions)
- product.create — create products
- product.update — update products and update status
- product.delete — delete products

## Protected Routes

- POST `/api/admin/products` — requires `requireAuth()` and `requirePermission('product.create')` (and role ADMIN)
- PUT `/api/admin/products/:id` — requires `requireAuth()` and `requirePermission('product.update')` (and role ADMIN)
- PATCH `/api/admin/products/:id/status` — requires `requireAuth()` and `requirePermission('product.update')` (and role ADMIN)
- DELETE `/api/admin/products/:id` — requires `requireAuth()` and `requirePermission('product.delete')` (and role ADMIN)

Public routes remain open: GET `/api/products`, `/api/products/featured`, `/api/products/:slug`, `/api/products/:slug/related`.

## Security Notes

- Admin routes now require both authentication and explicit permission checks. Role checks remain as an additional safeguard, but authorization does not rely solely on role membership.
- `requirePermission` builds an authorization context which normalizes role and permissions; it responds with 401 for unauthenticated requests and 403 for unauthorized ones without leaking internal details.
- Error responses use the global response helper to avoid exposing internal errors or stack traces.

## Production Readiness Score

- Authentication: 5/5 (enforced via middleware)
- Authorization granularity: 5/5 (permission-level checks added)
- Error handling / leakage: 5/5 (errors forwarded to central handler)
- Testing: 3/5 (recommend automated integration tests for RBAC scenarios)

Recommended next steps:

- Add automated tests verifying guest/customer/admin-without-permission/admin-with-permission scenarios.
- Consider logging authorization failures for monitoring and alerting.
- Optionally add `requirePermission` checks to other admin routes across the app for consistency.
