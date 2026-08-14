# Security Review

## Authentication

- Current public auth uses client-side localStorage and no server-side credential store.
- Admin auth uses an in-memory session map in `src/server/admin-api.ts` with a hard-coded admin password.
- No JWT authentication or refresh token flow.
- No password hashing or secure credentials storage.

## Authorization

- Admin endpoints are protected only by a simple session cookie check; there is no role-based enforcement beyond the admin guard.
- Public UI stores login state in client memory/localStorage and exposes user-only pages without server-side validation.
- Admin UI uses hidden session management state but no backend-enforced roles beyond a static session check.

## JWT

- Not present anywhere in the project.
- No token issuance, verification, refresh, or revocation.

## Refresh Token

- Not implemented.
- No HttpOnly cookie refresh token mechanism.

## HttpOnly Cookie

- Admin login sets a cookie with HttpOnly but lacks `Secure` and `SameSite=Strict` controls in production contexts.
- Public auth does not use cookies at all.

## Role validation

- Admin route access controlled by frontend path checks and simple session cookie.
- No backend `Admin` role validation for each admin API.

## Admin privilege escalation

- No rate limiting or lockout for admin login.
- Hardcoded admin credentials are easily discovered from source review.

## IDOR

- APIs like `/api/admin/orders/{id}` and `/api/admin/products/{id}` use direct IDs without authorization beyond the admin session.
- No checks for record ownership or scope, although admin-only endpoints are not user-scoped.

## SQL Injection

- No SQL database usage currently, so SQL injection is not applicable yet.
- Future PostgreSQL integration must use parameterized queries or ORM.

## XSS

- User input is rendered without explicit sanitization in comments, search queries, and product review fields.
- HTML injection risk exists in React if content is later set via `dangerouslySetInnerHTML` or unescaped templates.

## CSRF

- No CSRF protection on API endpoints.
- Admin session and public actions could be forged by third-party sites.

## File Upload

- Not implemented; image uploads are absent.
- Current site uses local static assets and external placeholder URLs.

## Path Traversal

- No upload handling currently.
- `data/db.json` path handling is static, so path traversal is not present now.

## Command Injection

- No command execution or shell operations are present.

## Secrets

- Hard-coded admin password in `src/server/admin-api.ts`.
- No environment variable usage for secrets.
- Some asset metadata indicates possible R2 integration, but no credentials are present.

## Hardcoded keys

- Admin credentials are hardcoded.
- Discount code `NAMNGUYEN10` is hardcoded in frontend cart logic.

## Environment variables

- Not used; the project contains no `.env`, no config management.
- Vite config and backend use static values.

## Rate Limiting

- Not implemented.
- Login and API endpoints are unthrottled.

## CORS

- Not configured; default behavior is likely permissive in dev.
- No production CORS policy enforcement.

## Input validation

- Minimal validation on public APIs.
- Checkout POST only checks for required fields and does not validate types or sanitized values.

## Output encoding

- Project relies on React escapes, but some dynamic values are used without sanitization.
- No explicit output encoding for API responses.

## Sensitive API exposure

- Public APIs expose store structure and product data directly.
- Admin APIs are accessible with a valid session cookie.

## Client-side authorization

- Frontend shows/hides admin links based on client state.
- No backend enforcement on public-facing or admin-only routes.

## Business Logic Exposure

- Pricing, coupon validation, and checkout logic are implemented on client side.
- Discount code logic is fully exposed in `src/routes/cart.tsx`.
- Product stock and total calculations are not secured server-side.

## Findings

- Severity: Critical
- Risk: High
- Attack scenario: Attacker can register fake users, forge orders, use frontend coupon logic, and access admin APIs if admin session cookie is stolen.
- Recommended fix: Replace localStorage auth with backend auth, implement secure sessions/JWT and refresh tokens, validate every admin request server-side, add CSRF, rate limiting, and input validation.
