# Upload Module Security Review

## Scope

Review of the Cloudflare R2 upload module, including:

- `backend/src/services/storage/R2Client.ts`
- `backend/src/services/storage/UploadService.ts`
- `backend/src/services/storage/DeleteService.ts`
- `backend/src/routes/upload.ts`
- `backend/src/controllers/uploadController.ts`
- `backend/src/middlewares/auth/authorization.ts`
- `backend/src/config/env.ts`

## Summary

The upload module implements a reusable Cloudflare R2-backed image upload flow with authenticated upload, admin-only delete, and signed URL generation. The overall design is sound, but there are a few security and configuration gaps to address before production rollout.

## Verification

- `POST /api/upload/image`: authenticated upload accepted via `requireAuth()`.
- `DELETE /api/upload/:id`: protected by `requireRole('ADMIN')`.
- `GET /api/upload/:id/url`: authenticated, but currently not ownership-restricted.
- Secrets are loaded through `dotenv.config()` and read from environment variables in `backend/src/config/env.ts`.
- `uploadedfile` metadata persists only identifiers and metadata; no binary payload is stored in MySQL.
- `R2Client` uses explicit credentials from environment and does not hardcode secrets.

## Findings

### Critical

- `GET /api/upload/:id/url` does not validate file ownership or admin rights. Any authenticated user who knows or guesses a valid upload ID can obtain a signed URL for that object.

### High

- `backend/src/config/env.ts` uses fallback defaults for `R2_BUCKET` and `R2_ENDPOINT`. This can mask misconfiguration in production and may cause uploads to route to the wrong storage target.
- Error handling forwards exception messages to API responses via the shared error handler, which may expose implementation details if an upload error is thrown.

### Medium

- `backend/src/routes/upload.ts` hardcodes the multer file size limit to 5MB while the service also enforces `env.maxUploadSizeBytes`. The mismatch should be aligned to avoid inconsistent behavior.
- `validateImageBuffer` checks SVG content only by searching for `<svg`, which is a weak sanitization measure. Additional SVG sanitization or content stripping should be considered for production.
- Executable protection covers MZ, ELF, and shell shebang signatures but does not explicitly cover all possible executable or archive signatures.
- The signed URL generation is authenticated but not scoped to the requesting user, which may become a vector for indirect data disclosure.
- `R2Client` and upload service do not enforce bucket prefix policy beyond the internal `uploads/images/` prefix.

### Low

- The `url` field stored in `uploadedfile` is the object path rather than a full URL. That is acceptable for metadata, but documentation should clarify that it is not a public link.
- The module uses in-memory multipart upload buffering via multer memory storage, which is generally acceptable for small files but should be monitored for file size and memory usage.
- `validateImageBuffer` defaults to `.jpg` when no extension is supplied, which may hide ambiguous content handling.

## OWASP File Upload Checklist

- [x] Restrict allowed MIME types and extensions to a whitelist.
- [x] Reject executable file signatures.
- [x] Use a maximum upload size.
- [x] Generate server-side unique filenames.
- [x] Prevent path traversal by not using user-controlled path fragments.
- [x] Persist only metadata in the database, no binary blobs.
- [x] Require authentication for upload operations.
- [ ] Require authorization for signed URL retrieval/ownership.
- [ ] Avoid exposing internal error messages in API responses.
- [x] Use signed URLs with expiration for object access.
- [ ] Ensure storage configuration is explicit and not silently defaulted.

## Production Readiness Score

- Build: pass
- Typecheck: pass
- Lint: fail due to Prettier/CRLF formatting issues across backend files (not specific to upload logic)

### Score: 7 / 10

## Recommendations

1. Enforce ownership or admin authorization on `GET /api/upload/:id/url`.
2. Remove fallback defaults for critical R2 configuration values in `env.ts` and require explicit production settings.
3. Standardize upload size limits between multer and service configuration.
4. Harden SVG handling with a stricter sanitizer or remove SVG support unless fully vetted.
5. Consider a more comprehensive executable signature blacklist beyond MZ/ELF/`#!`.
6. Use generic error responses for production and keep internal errors out of API payloads.
7. Add explicit bucket prefix validation or isolation for multi-tenant scenarios.
8. Document that `uploadedfile.url` is stored as an object path and not a direct public link.

## Conclusion

The Cloudflare R2 upload module is functionally sound and follows many best practices, but the signed URL retrieval and configuration defaults require remediation before production use. A small set of hardening changes will raise the module to production security quality.
