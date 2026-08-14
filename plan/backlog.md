# Backlog

## Priority 1

- Standardize folder layout, API layer, state management, and environment variables.
- Keep the current React/TanStack/Vite architecture unchanged.
- Add a safe project configuration layer for runtime settings.
- Add a clearer server-side route and API organization.

## Priority 2

- Harden authentication and authorization on the current backend.
- Add JWT/HttpOnly cookie support without replacing the frontend framework.
- Implement refresh token handling and role-based authorization.
- Protect both public and admin routes with backend checks.

## Priority 3

- Add Cloudflare R2 upload service only after auth and backend stabilization.
- Add file validation, secure file naming, and deletion of old images.
- Keep upload handling decoupled and optional until safe.

## Priority 4

- Prepare for PostgreSQL or stronger persistence without rewriting the app.
- Add migration and schema planning for future DB enablement.
- Use repository/unit-of-work patterns only if required by the current backend.

## Priority 5

- Improve admin CRUD while preserving existing UI.
- Ensure product, banner, flash sale, order, customer, and license key flows remain intact.

## Priority 6

- Reserve payment/MoMo implementation until auth, order, and persistence are secure.
- Add payment callback verification only after core systems are stabilized.

## Priority 7

- Improve performance, SEO, accessibility, responsive behavior, skeleton loading, and lazy loading.

## Priority 8

- Refactor and clean code incrementally.
- Add documentation and tests after the core critical path is secure.
