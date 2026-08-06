# Authentication Design for Sprint 2

## Goal

Design a secure authentication and authorization architecture for the existing React + TanStack application without changing the current UI or business logic in Sprint 1.

## Constraints

- Preserve current frontend framework and routing.
- No Sprint 2 auth implementation until Sprint 1 quality gates are fully validated.
- Do not introduce payment, database, or cloud changes in Sprint 1.
- Keep current admin APIs and frontend flows stable.

## Proposed Authentication Architecture

### 1. Server-side session validation

- Protect admin APIs with a server-side guard in `src/server/admin-api.ts`.
- Add an authentication middleware or helper to verify requests before returning admin data.
- Use an auth session token in an HttpOnly, Secure, SameSite cookie for browser requests.

### 2. JWT / refresh token strategy

- Use an access token with a short expiration (e.g. 15 minutes) and a refresh token with a longer expiration (e.g. 7 days).
- Store the refresh token in an HttpOnly cookie and use it to obtain new access tokens on the server.
- Keep access tokens out of localStorage/sessionStorage to reduce XSS risk.

### 3. Auth request flow

- Client authenticates via `/api/admin/login`.
- Server verifies credentials and returns:
  - access token in response body if needed by frontend state
  - refresh token in a secure HttpOnly cookie
- Protected endpoints require the access token in an `Authorization: Bearer ...` header or derive identity from the refresh cookie/session.

### 4. Route protection and role validation

- Protect admin page route access on the server by requiring a valid auth session.
- In the React app, use existing `src/routes/admin/index.tsx` and `src/lib/apiClient.ts` to handle auth failures gracefully.
- Add a lightweight auth state provider if needed, but avoid localStorage-based auth until Sprint 2.
- Validate admin role/permissions on the backend before returning sensitive admin data.

### 5. Token rotation and replay resistance

- Implement refresh token rotation so each refresh issues a new refresh token and invalidates the old one.
- Keep refresh tokens stateful on the server or use a signed token blacklist if the current in-memory store is retained.
- Ensure a stolen refresh token cannot be reused after rotation.

### 6. Keep current data store unchanged for Sprint 2

- Continue using `src/server/admin-store.ts` and the current JSON-backed admin flow.
- Do not migrate to PostgreSQL, Cloudflare R2, or other persistence layers during Sprint 2 design.

## Sprint 2 Implementation Plan

### Step 1: Design only

- Document the auth and session strategy.
- Confirm server-side auth guard boundaries.
- Review existing admin API routes for insertion points.

### Step 2: Add auth helper abstractions

- Create a server auth helper and request validation middleware.
- Keep API request wrappers in `src/lib/apiClient.ts` unchanged until auth behavior is proven.

### Step 3: Protect existing admin endpoints

- Secure `/api/admin/session`, `/api/admin/dashboard`, `/api/admin/orders`, `/api/admin/products`, etc.
- Ensure admin page load handling still falls back to `/admin/login` when unauthorized.

### Step 4: Non-breaking rollout

- Begin with login route and session validation only.
- Verify that existing admin and public flows continue to work.
- Keep all changes incremental and test with current build/lint/typecheck gates.

## Validation Criteria

- `npm run build` still succeeds.
- `npm run lint` has no errors.
- `npm run typecheck` passes.
- No changes to public UI/route behavior aside from auth gating.
- Admin routes return `401/403` only for unauthorized access.

## Notes

- Current Sprint 1 state is stable and ready for auth design: build passes, lint shows 8 dev-only Fast Refresh warnings, and typecheck passes.
- Authentication implementation should be introduced only after this Sprint 2 design is reviewed and approved.
