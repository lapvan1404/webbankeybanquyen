# Session Lifecycle

## Objective

Define the lifecycle of authenticated admin sessions for the Sprint 2 implementation, from login through expiration and logout.

## Session States

### Unauthenticated

- The user has not logged in or has an invalid session.
- Admin routes redirect to `/admin/login`.
- Protected API requests return `401 Unauthorized`.

### Authenticated

- User has successfully logged in and holds a valid access token.
- Browser may keep auth state in memory and uses the refresh cookie for backend session validation.
- Protected admin APIs are accessible based on role validation.

### Expired

- Access token expires after its short TTL.
- Browser requests to protected APIs receive `401 Unauthorized`.
- The client may call `/api/admin/refresh` to renew the session.

### Refresh Pending

- Browser sends the refresh request using the HttpOnly cookie.
- Server validates current refresh token state and, if valid, issues a new access token and a rotated refresh token.
- Old refresh token state is invalidated.

### Logged out

- The user explicitly logs out.
- Server invalidates the refresh token and any related session state.
- Refresh cookie is cleared from the browser.
- User is redirected to `/admin/login`.

## Lifecycle Events

### Login Event

- Triggered by POST `/api/admin/login`.
- Server creates auth claims and stores refresh token state if stateful rotation is used.
- Response includes cookie header for refresh token and the access token as needed.

### Session Check Event

- Triggered by GET `/api/admin/session`.
- Server confirms the current session or cookie-based auth state.
- Successful response indicates the admin page can render.

### Refresh Event

- Triggered by POST `/api/admin/refresh`.
- Server validates the refresh token cookie.
- If valid, server issues a new access token and rotated refresh cookie.
- If invalid or reused, server returns `401 Unauthorized`.

### Access Event

- Triggered by protected API requests to `/api/admin/*`.
- Server validates the access token or session and checks the admin role.
- Authorization failure returns `403 Forbidden` if the user lacks role privileges.

### Logout Event

- Triggered by POST `/api/admin/logout`.
- Server invalidates associated refresh token state.
- Server removes the refresh cookie via expired cookie headers.

## Session Storage Model

### Stateless access token

- Access tokens are JWTs with embedded claims.
- The server validates signature and expiration for each request.

### Stateful refresh token

- Refresh tokens are stored or tracked server-side in a session map.
- Each refresh rotates the token and invalidates the previous one.
- This prevents replay attacks and supports reliable logout.

## Expiration Rules

- Access token expiry: short duration (e.g. 15 minutes).
- Refresh token expiry: longer duration (e.g. 7 days), with rotation on each refresh.
- Session termination: on logout, refresh token invalidation, or refresh token expiry.

## Failure Modes

- Expired access token: browser refreshes tokens or redirects to login after repeated failures.
- Invalid refresh token: session ends and user is redirected to login.
- Reused refresh token: server denies the refresh and requires login.

## Future Enhancements

- Add CSRF token protection for state-changing admin requests.
- Store refresh tokens in a persistent database for horizontal scaling.
- Add session revocation list and admin session management UI.
