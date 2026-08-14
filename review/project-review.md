# Project Review

## Project completion estimate

- Completion: 8%
- Status: Authentication API foundation is now implemented, but the project is still not production-ready

## Completed features

- React + TypeScript front-end with TanStack Router and Tailwind CSS
- Product list, category pages, product detail pages
- Shopping cart with local state and checkout form
- Simple public auth/register/profile using localStorage
- Admin backend endpoints with session cookie-based login
- Admin dashboard UI with orders, notifications, products, categories, coupons, keys, banners
- Data persistence via local JSON file (`data/db.json`)
- Authentication API foundation with register, login, logout, refresh, and current-user endpoints
- Server-side RBAC middleware with role and permission enforcement primitives
- Cloudflare R2 upload module with authenticated upload, admin-only delete, signed URLs, and metadata persistence

## Missing features

- Nuxt 3 frontend does not exist
- ASP.NET Core Web API backend does not exist
- PostgreSQL database integration missing
- Cloudflare R2 image upload/storage infrastructure now added, but production credentials and bucket policy still need real deployment configuration
- MoMo payment integration missing
- Server-side order/payment validation missing
- CSRF protection and more advanced hardening still need follow-up work
- Role-based authorization enforcement beyond the initial RBAC middleware still needs expansion
- Additional production hardening around JWT claims and refresh-token lifecycle remains pending
- No backend clean architecture, DI, service/repository layers

## Broken/unsafe features

- User auth stored in `localStorage`; insecure and invalid for production
- Admin session auth is only in-memory session map and not persistent
- All data is persisted to JSON file, not PostgreSQL
- Product data duplicated in both JSON store and hard-coded frontend `src/lib/products.ts`
- Checkout and coupons validated purely on client-side
- `/api/orders` accepts raw input without schema validation
- Admin APIs lack robust authorization and logging
- No password hashing or secure account management
- No security headers / CSP / XSS mitigation / rate limiting

## Dead code / unused files

- Many UI components exist but project is not using Nuxt or ASP.NET backend
- `src/lib/error-capture.ts` / `lovable-error-reporting.ts` are incomplete for production
- `data/db.json` contains demo orders and keys but is used as flat JSON store only
- Placeholder images and some admin features are not fully implemented

## Architecture issues

- Current app is a monolithic Vite React app, not the requested Nuxt+ASP.NET architecture
- Backend is file-based Node SSR, not ASP.NET Core Web API
- Frontend and backend are tightly coupled to the same repo but not structured for clean separation
- Data layer is ad-hoc JSON file instead of relational DB with referential integrity
- No API contract or DTO layer enforced

## Performance issues

- Client loads full product data from hard-coded arrays and JSON, not paginated API
- No SSR caching or backend optimization besides basic React Start setup
- Large static images are imported directly and may inflate bundle size
- `useEffect` calls in header and admin dashboard could cause unnecessary fetch churn

## Security issues

- LocalStorage auth and unvalidated public inputs remain concerns in the broader app
- Admin session cookie handling is still broader than the new backend auth API
- Public APIs remain insufficiently validated in some areas
- Rate limiting is now present for login, but broader auth hardening still needs follow-up

## Database issues

- No PostgreSQL schema, migrations, or referential integrity
- Data model is flat JSON with no normalized relations for orders, keys, categories
- No transaction boundaries for order or payment operations

## Frontend issues

- Page-level auth and user experience are basic and not production-grade
- Search and filtering rely on client-side data only
- No real mobile menu or responsive admin interface improvements
- Hidden admin routes exist without backend validation
- No PWA or optimization for large traffic

## Backend issues

- Current backend is minimal Node/React Start and file store, not ASP.NET Core
- Authentication/authorization and API security are insufficient for ecommerce
- No payment gateway integration or callback verification
- No upload handling or Cloudflare R2 storage

## Technical debt

- Hard-coded product/order data in both source and JSON store
- No config/env separation for secrets or runtime settings
- Unsafe client-side logic for pricing and discount validation
- No tests or CI tooling

## Priority

### Critical

- Freeze Sprint 1 foundation work; do not modify completed core features unless fixing critical bugs
- Define frontend API contracts for auth, product, banner, order, payment, and upload
- Prepare the frontend to consume contract-based APIs only
- Keep backend implementation deferred to future Sprint 2 work

### High

- Document DTO contract definitions for user, login, product, banner, order, payment, and upload
- Maintain current React/TanStack Vite app and do not rewrite frontend framework
- Validate API contract surface and frontend integration points before implementing backend
- Preserve current admin and public UI behavior while introducing contract-based patterns

### Medium

- Improve UX/responsive design and accessibility
- Remove duplicate product data and use a single API source
- Harden all API input validation and output encoding
- Add unit/integration tests and linting

### Low

- Document architecture, database, deployment
- Clean up unused files and placeholder code
- Add admin product/banner management UI polish

## Recent Integration Testing (Product Module)

- Product module controllers, validators, routes, and authorization were implemented and statically validated.
- Quality gates (`lint`, `build`, `typecheck`) passed after the Product work.
- An integration test plan and review were created in `review/product-integration-review.md` with recommended CI test steps. Full automated end-to-end HTTP tests require a test DB and CI setup and are recommended before freeze.
 - A GitHub Actions CI workflow was added at `.github/workflows/backend-ci.yml` to run lint/build/typecheck and integration tests against a disposable MySQL service.
- Backend repository abstraction was extended with a ProductKey repository and Prisma schema migration to support encrypted key management.

## MVP Mode

- The project has switched to MVP Mode to prioritize shipping core customer and admin flows quickly. Non-essential enterprise features are postponed to Phase 2. See `review/mvp-mode-review.md` for details.

## Cloudflare R2 Asset Structure (2026-07-25)

- Created `assets/` directory with 10 subfolders and 11 README.md files documenting naming conventions, image specs, and R2 bucket mapping.
- Covers products (windows/office/antivirus), brands, categories, banners (home/promotion), and placeholders.
- No images created, no uploads performed, no code modified.
- See `review/assets-structure-review.md` for detailed review.

## Buy Now Navigation Bug Fix (2026-07-25)

- Fixed critical bug: clicking "Mua ngay" (Buy Now) redirected to cart instead of checkout.
- Root cause: TanStack Router `navigate({ search })` expects an object, but code passed a string via `params.toString()`. Query params were lost, checkout detected empty cart, redirected to `/cart`.
- Fixed in 3 files: `product.$slug.tsx`, `login.tsx`, `checkout.tsx` (5 navigate calls total).
- All quality gates passed: lint (0 errors), typecheck (clean), build (successful).

## Database Seed System (2026-07-25)

- Implemented complete, idempotent Prisma seed at `backend/prisma/seed.ts`.
- Seed now creates demo data for key commerce entities and related tables: roles, users, categories, brands, products, product images, banners, product keys, carts, orders, payments, and auxiliary records.
- Added Prisma seed configuration in `backend/package.json`:
	- `"prisma": { "seed": "tsx prisma/seed.ts" }`
- Added documentation: `docs/database-seed.md`.
- Added dedicated review: `review/database-seed-review.md`.
- No schema changes, no migrations, no API contract changes, and no business logic changes were introduced.
- Runtime verification complete:
	- `npx prisma db seed` passed twice (idempotent run confirmed).
	- Verified required demo entities exist (admin, 3 customers, categories, brands, products, product keys, orders).
- Quality gate status after seed work:
	- Product-module blockers have now been fixed; backend quality gates are passing again.

## Product Quality Gate Fix (2026-07-25)

- Resolved existing lint/build/type errors in Product module scoped files only:
	- `backend/src/controllers/ProductController.ts`
	- `backend/src/repositories/product/ProductRepository.ts`
	- `backend/src/services/product/ProductService.ts`
	- `backend/src/validators/product.ts`
- No business logic changes, no API behavior changes, no Prisma schema changes, and no migrations.
- Verification status in `backend`:
	- `npm run lint`: PASS
	- `npm run build`: PASS
	- `npm run typecheck`: PASS
- Detailed notes: `review/product-quality-fix-review.md`.

## Image Manager (Admin) (2026-07-25)

- Implemented Image Manager for `Product`, `Category`, `Brand`, `Banner` by reusing existing upload API flow.
- No new upload service introduced; no auth architecture change.
- Added in admin UI:
	- Upload preview
	- Replace image
	- Remove image
	- Reorder images (move left/right) for product gallery
	- Upload progress indicator
	- Save-button lock while uploads are running
- Product image behavior:
	- Max 4 images
	- First image treated as thumbnail/default image
	- URL-only payload persisted (`thumbnailUrl`, ordered `images` list)
- Category/Brand/Banner behavior:
	- Single image flow with upload/replace/remove and preview
- Validation behavior:
	- Allowed: jpg/jpeg/png/webp
	- SVG not accepted
- Quality gates from project root:
	- `npm run lint`: PASS (warnings only)
	- `npm run build`: PASS
	- `npm run typecheck`: PASS
- Documentation:
	- `docs/image-manager.md`
	- `review/image-manager-review.md`
