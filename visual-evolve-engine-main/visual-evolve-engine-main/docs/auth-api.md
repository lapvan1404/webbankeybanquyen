# Authentication API

## Endpoints

### POST /api/auth/register
Registers a new customer account.

- Validates email format and password policy.
- Checks for duplicate emails.
- Hashes the password with Argon2id.
- Assigns the customer role.
- Sets `emailVerified` to `false`.
- Never creates an admin account.

### POST /api/auth/login
Authenticates a user and issues a session.

- Validates credentials.
- Checks account status and lock state.
- Increments failed login count on failure.
- Resets failed login count on success.
- Updates `lastLoginAt`.
- Creates a session and a hashed refresh token.
- Issues an access token and sets an HttpOnly refresh cookie.
- Uses rate limiting for brute-force protection.

### POST /api/auth/logout
Invalidates the current refresh token and session.

- Revokes the current refresh token.
- Revokes the current session.
- Clears the refresh cookie.

### POST /api/auth/refresh
Refreshes the access token.

- Reads the refresh token from the HttpOnly cookie.
- Validates the hashed refresh token.
- Validates session state.
- Rotates the refresh token and replaces the cookie.
- Issues a new access token.

### GET /api/auth/me
Returns the current authenticated user profile.

- Returns: `id`, `email`, `fullName`, `avatar`, `role`, `emailVerified`
- Never exposes password hash or refresh token hash.
