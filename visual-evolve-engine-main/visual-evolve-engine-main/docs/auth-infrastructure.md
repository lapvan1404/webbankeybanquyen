# Authentication Infrastructure

## Overview
The authentication foundation introduces reusable services and middleware for password hashing, JWT issuance/verification, cookie handling, sessions, refresh-token hashing, and request-user resolution.

## Components
- `PasswordService`: hashes and verifies passwords with Argon2id.
- `JWTService`: signs and verifies access and refresh tokens.
- `CookieService`: prepares HttpOnly, secure, and same-site cookie values.
- `SessionService`: builds a minimal session context structure.
- `RefreshTokenService`: hashes and rotates refresh tokens.
- `AuthMiddleware` and `CurrentUserMiddleware`: attach request user state from bearer tokens.

## Security Notes
- Password hashes are never exposed.
- Refresh tokens are stored as hashes only.
- Token rotation is supported by the refresh token service contract.

## Configuration
- JWT secrets, refresh secrets, and cookie secret are read from environment variables.

## Future Extension
- Authentication endpoints can be added on top of this infrastructure.
- Repositories can later persist refresh tokens and sessions without changing the service interfaces.
