# Authentication Flow

## Overview

This document describes the planned authentication flow for Sprint 2, using JWT access tokens, refresh tokens, HttpOnly cookies, and secure session validation.

## Actors

- Browser client
- Backend API server
- Admin user
- Auth middleware and token service

## Flow Steps

### 1. Login

1. User submits credentials to `/api/admin/login`.
2. Server validates credentials against stored admin accounts.
3. Server issues:
   - JWT access token with short expiration (~15 minutes)
   - Refresh token with longer expiration (~7 days)
4. Server returns:
   - Access token in response body if frontend needs to attach it to requests
   - Refresh token via `Set-Cookie` with `HttpOnly; Secure; SameSite=Strict`
5. Browser stores auth state in memory only; no auth tokens in localStorage.

### 2. Protected API Request

1. Browser sends a protected request to `/api/admin/*`.
2. The request includes either:
   - `Authorization: Bearer <access token>` header from in-memory state
   - or relies on the refresh cookie when the server performs cookie-based session validation.
3. Backend auth middleware verifies the token or session.
4. If valid, request proceeds; otherwise returns `401 Unauthorized`.

### 3. Token Refresh

1. When the access token expires, the browser calls `/api/admin/refresh`.
2. The browser sends the refresh cookie automatically.
3. Server validates the refresh token and issues:
   - new access token
   - new refresh token in a rotated `Set-Cookie`
4. Server invalidates the old refresh token to prevent reuse.

### 4. Logout

1. Browser calls `/api/admin/logout`.
2. Server invalidates the current refresh token and removes session state.
3. Server clears the refresh cookie by setting it with an expired date.
4. Browser state is reset and user is redirected to `/admin/login`.

### 5. Session Validation

- `/api/admin/session` verifies the current auth state or refresh token cookie.
- It returns `200 OK` for valid sessions and `401` for missing/invalid auth.
- The admin page uses this route to gate access and redirect unauthorized users.

## Token Handling

- Access token: short-lived JWT used by frontend to authorize API calls.
- Refresh token: HttpOnly cookie used to obtain new access tokens without exposing tokens to JavaScript.
- Role claims: encoded in JWT claims or server session metadata for role validation.

## Error Handling

- `401 Unauthorized`: invalid or missing access token, invalid refresh token, or expired session.
- `403 Forbidden`: valid auth but insufficient role permissions.
- `400 Bad Request`: malformed login or refresh requests.

## Security Considerations

- Keep refresh token cookies restricted to same-site requests.
- Do not expose refresh tokens in JavaScript.
- Refresh endpoint should rotate and invalidate old tokens.
- Protect `/api/admin/login`, `/api/admin/refresh`, and `/api/admin/logout` with origin/referer checks if needed.
