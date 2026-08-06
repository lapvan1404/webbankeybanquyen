# User Model Review

## New Fields
- `phone` (String? with unique constraint)
- `avatarUrl` (String?)
- `status` (`UserStatus` enum)
- `emailVerified` (Boolean)
- `lastLoginAt` (DateTime?)
- `failedLoginCount` (Int)
- `lockedUntil` (DateTime?)
- `deletedAt` (DateTime?)

## New Indexes
- `@@index([phone])`
- `@@index([status])`
- `@@index([deletedAt])`
- Existing `email` remains unique

## Security Improvements
- `passwordHash` remains the only password field on `User`
- No plaintext password field added
- `refreshTokens` are maintained in a separate `RefreshToken` model, not stored directly on `User`

## Migration Result
- `npx prisma validate` succeeded
- `npx prisma generate` succeeded
- `npx prisma migrate dev --name harden_user_model` succeeded
- Migration folder created: `prisma/migrations/20260721175503_harden_user_model/`

## Backward Compatibility
- No existing model names were renamed
- No relations removed or altered except as required by `User` model changes
- `User` still relates to `Role`, `RefreshToken`, `UserSession`, `PasswordResetToken`, `LoginAttempt`, `AuditLog`, `Cart`, `Order`, `Address`, `Favorite`, `Review`, `UploadedFile`, and `Notification`

## Potential Risks
- The new unique `phone` index may fail if duplicate phone values already exist in the database.
- Downstream code that assumes `status` is a string literal will need to work with the `UserStatus` enum values.

## Remaining Improvements
- No additional User hardening is required in Priority 2 scope.
- Future work could add stricter validation for `phone` format and `avatarUrl` URL integrity.
