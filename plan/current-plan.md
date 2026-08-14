# Current Plan

## Roadmap

- Sprint 1 ✅ Foundation Frontend
- Sprint 2 ✅ Architecture & API Contracts
- Sprint 3 🔄 Backend Foundation
- Sprint 4 Authentication & Authorization
- Sprint 5 Cloudflare R2
- Sprint 6 Product + Category + Banner
- Sprint 7 Cart + Checkout + Orders
- Sprint 8 MoMo Payment + License Delivery
- Sprint 9 Admin Dashboard
- Sprint 10 Production Hardening + Deployment

## Goal

Incrementally improve the existing React/TanStack Vite application to production quality while preserving its current architecture and business logic.

## Project constraints

- Never change the frontend framework.
- Never migrate to Nuxt or replace React.
- Never rewrite the project from scratch.
- Preserve compatibility and minimize breaking changes.
- Implement security improvements without changing core architecture.

## Priority list

1. Architecture, API layer, state management, folder structure, environment variables.
2. Authentication, authorization, JWT, HttpOnly cookie, refresh token, role validation, route protection.
3. Cloudflare R2, upload service, file validation, image compression, UUID file names, delete old images.
4. PostgreSQL readiness, migrations, foreign keys, transactions, repository abstraction, unit of work.
5. Admin CRUD for product, banner, flash sale, orders, customer, license keys.
6. Payment (MoMo), callback verification, transaction safety, key delivery.
7. Performance, SEO, accessibility, responsiveness, skeletons, lazy loading.
8. Refactor, clean code, documentation, unit tests, integration tests.

## Tasks

### Priority 1

- [ ] Normalize folder structure and project layout without framework changes.
- [ ] Standardize API layer and server route handling.
- [ ] Standardize state management patterns in frontend.
- [ ] Standardize environment variable usage and configuration.
- [ ] Document the project architecture in place.

### Priority 2

- [ ] Harden authentication and switch away from localStorage-based auth.
- [ ] Protect admin APIs with secure server-side authorization.
- [ ] Introduce JWT and HttpOnly cookie support where safe.
- [ ] Add refresh token flow and role validation.
- [ ] Protect routes via server-side checks and backend guard logic.

### Priority 3

- [ ] Implement Cloudflare R2 integration incrementally if required.
- [ ] Add upload service with backend validation and UUID naming.
- [ ] Add image handling and deletion of old images.
- [ ] Keep upload capability optional until core auth and backend are stable.

### Priority 4

- [ ] Prepare PostgreSQL migration plan without replacing current architecture.
- [ ] Add support for database migrations and constraints if moving beyond JSON store.
- [ ] Design foreign key relationships and transactional order flows.
- [ ] Introduce repository and unit-of-work abstractions if needed.

### Priority 5

- [ ] Improve admin CRUD operations for existing business entities.
- [ ] Keep current UI patterns and backend APIs consistent.

### Priority 6

- [ ] Plan payment integration only after auth, order, and database are secure.
- [ ] Add MoMo verification and transaction-safe key delivery later.

### Priority 7

- [ ] Improve performance, SEO, accessibility, responsive design, skeleton screens, and lazy loading.

### Priority 8

- [ ] Refactor code incrementally, not by rewriting.
- [ ] Complete documentation, unit tests, and integration tests.

## Next immediate task

- [x] Implement Sprint 4.2 authentication API endpoints for register, login, logout, refresh, and current user.
- [x] Reuse the existing password, JWT, refresh-token, cookie, session, Prisma, and unit-of-work infrastructure.
- [x] Add documentation for the new auth endpoints and review notes.
- [x] Implement Sprint 4.3 RBAC middleware and permission matrix for server-side authorization.
- [x] Implement Sprint 5.1 Cloudflare R2 upload module with authenticated upload, admin-only delete, signed URLs, and metadata persistence.
- [x] Prepare Cloudflare R2 asset directory structure with documentation (assets/ folder, README.md per subfolder, naming conventions, image specs).
- [ ] Continue with any follow-up hardening tasks after the initial upload infrastructure is validated.
- [ ] Sprint 1.1: ProductKey Repository - schema + repository only

## Sprint 5 Integration Tasks


## MVP Mode (New Direction)

The project is now in MVP mode. Priorities are narrowed to shipping a working end-to-end MVP quickly. The following rules apply:

- Freeze modules (do not refactor unless critical bug): `Authentication`, `Authorization`, `Upload (Cloudflare R2)`, `Category`, `Brand`, `Product Foundation`.
- Pause non-MVP features: CI/CD, GitHub Actions, Automated Integration Tests, Swagger/OpenAPI, Advanced RBAC, Audit Log, Analytics, SEO, Related/Featured/Recommendation, View counters, Advanced search/filters, Performance/caching, Emails, Notifications, Multi-language, Reporting.
- Simplify `Product` model for MVP: keep only `sku`, `name`, `slug`, `description`, `price`, `salePrice`, `thumbnailUrl`, `categoryId`, `brandId`, `status`. Move other fields to Phase 2 unless required.

Immediate development priority (Sprint list):

1. Sprint 1 — `ProductKey` (CRUD, import TXT/CSV, encryption, status, automatic assignment)
2. Sprint 2 — Cart
3. Sprint 3 — Order
4. Sprint 4 — Mock Payment
5. Sprint 5 — Admin Panel

Definition of Done (MVP):

- Customer: register, login, browse/search products, add to cart, checkout, mock payment, receive product key, view order history, access license key.
- Admin: manage users, products, product keys (import), orders, banners, and upload images.

Rules:

- Keep current architecture; do not rewrite or refactor frozen modules.
- Do not modify Prisma schema without approval; document proposals in `review/schema-change-proposal.md`.
- After each sprint run `npm run lint`, `npm run build`, `npm run typecheck`, create `review/<module>-review.md`, update `plan/current-plan.md` and `review/project-review.md`, then wait for approval.

Next step: prepare ProductKey design and API spec (Sprint 1). Awaiting your approval to start implementation.

## Database Seed Update (2026-07-25)

- [x] Implemented complete Prisma seed system at `backend/prisma/seed.ts` with idempotent upsert-based demo data.
- [x] Added Prisma seed configuration in `backend/package.json` using `tsx prisma/seed.ts`.
- [x] Added Prisma 7 seed configuration in `backend/prisma.config.ts` under `migrations.seed`.
- [x] Added seed documentation at `docs/database-seed.md`.
- [x] Added review report at `review/database-seed-review.md`.
- [x] Run verification commands and capture results.
- [x] Resolve existing non-seed Product-module lint/type errors so quality gates pass project-wide.

## Product Quality Gate Fix (2026-07-25)

- [x] Fixed Product module compile/lint/type errors in scoped files only.
- [x] Created review report at `review/product-quality-fix-review.md`.
- [x] Verified quality gates in backend:
	- `npm run lint`
	- `npm run build`
	- `npm run typecheck`

## Image Manager Update (2026-07-25)

- [x] Implemented Admin Image Manager for Product, Category, Brand, Banner using existing upload module.
- [x] Added upload progress UI and save-lock during upload for all supported admin forms.
- [x] Added replace/remove/reorder image management support in reusable uploader component.
- [x] Added docs at `docs/image-manager.md`.
- [x] Added review at `review/image-manager-review.md`.
- [x] Ran project quality gates from root:
	- `npm run lint` (pass; warnings only)
	- `npm run build` (pass)
	- `npm run typecheck` (pass)
