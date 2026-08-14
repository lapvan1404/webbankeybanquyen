# Security Threat Model

## Purpose

This document defines the main security threats for the application and the mitigation strategies to use during Sprint 2 authentication implementation.

## System Components

- Frontend: React + TanStack Router application running in the browser.
- Backend: Vite/TanStack Start SSR server handling API routes in `src/server`.
- Data store: local JSON file store via `data/db.json` and `src/server/admin-store.ts`.
- Admin dashboard: protected admin UI under `/admin`.
- Auth layer: future JWT access tokens, refresh tokens, HttpOnly cookies, and role validation.

## Assets

- User credentials and admin passwords
- Auth tokens and refresh tokens
- Admin session state and role claims
- Orders, coupons, keys, and product metadata
- Application source and runtime configuration

## Threats

### T1: Cross-Site Scripting (XSS)

- Attack: Malicious script in the browser steals access or refresh tokens.
- Current risk: access token stored in frontend state or localStorage increases exposure.
- Mitigation: use HttpOnly Secure SameSite cookies for refresh tokens, avoid localStorage for auth, and sanitize any dynamic HTML.

### T2: Cross-Site Request Forgery (CSRF)

- Attack: attacker causes browser to submit authenticated requests via the refresh cookie.
- Current risk: any cookie-based auth flow is vulnerable without anti-CSRF controls.
- Mitigation: use SameSite=Strict/Strictest cookies and verify origin/referer on auth-changing endpoints. Prefer double-submit or anti-CSRF token when required.

### T3: Token theft and replay

- Attack: stolen refresh token reused to mint new access tokens.
- Current risk: long-lived refresh tokens in cookies can be stolen if not rotated or invalidated.
- Mitigation: use refresh token rotation and server-side state/blacklist to invalidate old tokens after each refresh.

### T4: Unauthorized admin access

- Attack: unauthenticated or unauthorized user calls admin APIs.
- Current risk: admin APIs currently have weak or missing auth checks.
- Mitigation: enforce auth middleware on all `/api/admin` routes and validate role claims before returning sensitive data.

### T5: Broken access control

- Attack: authenticated users access admin-only resources or APIs.
- Current risk: public auth and admin routes are not separated by strict role checks.
- Mitigation: add role authorization in server guards and route protection in the frontend.

### T6: Credential abuse and weak credential storage

- Attack: plain text credentials or reused weak passwords are compromised.
- Current risk: current auth may use insecure session storage without hashing.
- Mitigation: store credentials hashed on the server for Sprint 2 design and authenticate via secure password verification.

### T7: Denial of service and brute force

- Attack: repeated login attempts or API hits exhaust resources.
- Current risk: no rate limiting or request throttling.
- Mitigation: add rate limiting to auth endpoints and monitor suspicious requests; use account lockout for repeated failures.

## Assumptions

- The browser environment can be compromised by XSS if the app serves unsafe scripts.
- The current JSON store is not hardened and should remain a temporary persistence layer for Sprint 2.
- Public routes can remain unauthenticated; only admin APIs and routes are in scope for auth hardening.

## Security Goals

- Keep auth state out of localStorage and sessionStorage whenever possible.
- Protect refresh tokens with HttpOnly, Secure, SameSite cookies.
- Rotate refresh tokens to prevent replay of stolen cookies.
- Enforce role-based access control on admin APIs.
- Preserve existing UI and route behavior while hardening the auth layer incrementally.

## Acceptable Residual Risks

- No complete CSRF token system in Sprint 2 if we maintain SameSite cookies, but future work should add tokens for state-changing endpoints.
- JSON-backed session state is acceptable for this sprint; long-term persistence migration is out of scope.
- Some security review items remain for later sprints such as CSP, rate limiting, and full API schema validation.
