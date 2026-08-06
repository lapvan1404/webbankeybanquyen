# MVP Mode Review

## Summary

Project direction has switched to MVP Mode to prioritize shipping a complete end-to-end product quickly. The emphasis is on core customer and admin flows; non-essential enterprise features are postponed.

## Frozen modules

- Authentication
- Authorization
- Upload (Cloudflare R2)
- Category
- Brand
- Product Foundation

These modules should not be refactored unless a critical bug is found.

## Paused features (Phase 2)

- CI/CD, Automated Integration Tests, GitHub Actions, Swagger/OpenAPI
- Advanced RBAC permission system, Audit Log, Analytics, Charts
- SEO, Related/Featured/Recommendation, View counters
- Advanced search, filters, caching, performance optimizations
- Email templates, notifications, multi-language, reporting

## Product simplification

Keep only for MVP: `sku`, `name`, `slug`, `description`, `price`, `salePrice`, `thumbnailUrl`, `categoryId`, `brandId`, `status`.
Move other product fields to Phase 2 unless required by a blocker.

## Next steps

- Prepare `ProductKey` design and API spec for Sprint 1.
- Await approval to begin Sprint 1 implementation.

## Governance

- Any Prisma schema changes must be proposed in `review/schema-change-proposal.md` and wait for approval before applying migrations.
- After every sprint run `npm run lint`, `npm run build`, `npm run typecheck` and produce `review/<module>-review.md` and update `plan/current-plan.md` and `review/project-review.md`.

Approved by: (awaiting your confirmation)
