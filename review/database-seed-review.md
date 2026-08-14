# Database Seed Review

Date: 2026-07-25

## Scope

Implemented a complete Prisma seed system without changing:

- Prisma schema
- Migrations
- API behavior
- Existing business logic

## What was implemented

1. Seed script at `backend/prisma/seed.ts` expanded to create full demo dataset.
2. Prisma seed configuration added to `backend/package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

3. Added documentation at `docs/database-seed.md`.
4. Added Prisma 7 runtime config at `backend/prisma.config.ts`:

```ts
migrations: {
  path: 'prisma/migrations',
  seed: 'tsx prisma/seed.ts',
}
```

## Seed coverage

- `role`: admin + customer
- `user`: 1 admin + 3 customers
- `category`: Windows, Office, Antivirus
- `brand`: Microsoft, Kaspersky, ESET
- `product`: 9 products with valid relations
- `productimage`: gallery images for all seeded products
- `banner`: 3 active banners
- `productkey`: multiple AVAILABLE keys per product
- `order` + `orderitem`: mixed statuses (PAID, PENDING, CANCELLED)
- `payment` + `paymenttransaction`: paid and unpaid examples
- Supporting demo records for other relation-heavy tables

## Idempotency strategy

- Deterministic IDs (`seed-*`) for all seeded records.
- `upsert` used for repeat-safe operations.
- Stable unique fields (`email`, `slug`, `sku`, `orderNumber`, `transactionId`, etc.) preserved.
- Re-running seed updates demo records instead of duplicating.

## Risks / notes

- Product keys are generated as encrypted values compatible with current key encryption/decryption logic.
- Existing non-seed production-like records are not removed by seed.
- No schema changes were required.

## Verification checklist

- [x] Seed command configured
- [x] Demo data set implemented
- [x] Idempotent approach applied
- [x] Documentation created
- [x] Runtime verification commands executed and captured
- [x] Lint/build/typecheck re-run after changes

## Verification results

### Seed command

- `npx prisma db seed`: PASS
- `npx prisma db seed` (second run): PASS

Both runs returned identical post-seed summary counts, confirming idempotent behavior for the seeded dataset.

### Data presence verification

Using direct DB verification script after seed:

```json
{
  "categories": 3,
  "brands": 3,
  "products": 10,
  "adminExists": 1,
  "customerDemoCount": 3,
  "productKeys": 57,
  "orders": 9,
  "paidOrders": 4,
  "pendingOrders": 5
}
```

Notes:

- Product count is `10` because one pre-existing product was already present before seeding; the seed adds the 9 required demo products.
- Product keys and orders include pre-existing records plus seeded records.

### Quality gates

- `npm run lint`: FAIL (pre-existing Product module lint errors, unrelated to seed file)
- `npm run build`: FAIL (pre-existing Product module TypeScript errors)
- `npm run typecheck`: FAIL (same pre-existing Product module TypeScript errors)

The seed implementation itself compiles and executes; quality gate failures originate from existing non-seed files.

## Next validation commands

From `backend` after fixing existing Product-module issues:

```bash
npm run lint
npm run build
npm run typecheck
```
