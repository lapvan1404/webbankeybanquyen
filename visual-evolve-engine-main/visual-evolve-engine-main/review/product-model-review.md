# Product Model Review

## Fields Added / Hardened
- `sku`
- `slug`
- `name`
- `shortDescription`
- `description`
- `thumbnailUrl`
- `price`
- `salePrice`
- `costPrice`
- `stock`
- `soldCount`
- `viewCount`
- `status`
- `isFeatured`
- `isDigital`
- `seoTitle`
- `seoDescription`
- `seoKeywords`
- `publishedAt`
- `createdAt`
- `updatedAt`
- `deletedAt`

## ProductImage Fields Added
- `sortOrder`
- `altText`
- `isPrimary`

## ProductKey Fields Added / Hardened
- `keyCode`
- `status`
- `activatedAt`
- `soldAt`
- `expiresAt`
- `orderItemId`
- `createdAt`

## Brand Fields Added
- `slug`
- `logoUrl`
- `website`
- `description`
- `isActive`
- `seoTitle`
- `seoDescription`
- `seoKeywords`

## Category Fields Added
- `slug`
- `description`
- `imageUrl`
- `sortOrder`
- `isActive`
- `seoTitle`
- `seoDescription`
- `seoKeywords`

## Indexes Added
- Product: `status`, `price`, `publishedAt`, `isFeatured`
- Product: existing `brandId`, `categoryId`
- Brand: `slug`
- Category: `slug`
- ProductKey: `productId`, `orderItemId`

## Unique Constraints
- Product: `sku`
- Product: `slug`
- Brand: `name`
- Brand: `slug`
- Category: `name`
- Category: `slug`
- ProductKey: `keyCode`

## Security Review
- `ProductKey.keyCode` is stored server-side and not exposed in any public model fields.
- Product keys remain separated from Product and are not part of the public-facing `Product` model.
- No frontend or unrelated model changes were made.

## SEO Review
- Category and Brand now include SEO metadata fields: `seoTitle`, `seoDescription`, `seoKeywords`.
- Product includes SEO fields and publication metadata for better marketing and indexing control.

## Performance Review
- Added product-level indexes for search and filtering on `slug`, `sku`, `status`, `categoryId`, `brandId`, `price`, `publishedAt`, and `isFeatured`.
- These indexes support fast product listing, category/brand filtering, and promotional queries.

## Migration Result
- `prisma validate` succeeded.
- `npm run build` succeeded.
- `npm run lint` succeeded.
- `npm run typecheck` succeeded.
- `prisma migrate dev --name add_product_hardening` failed because MySQL is not reachable at `127.0.0.1:3306`.

## Potential Risks
- Migration cannot be applied until the local MySQL server is running and accessible on `127.0.0.1:3306`.
- Existing database schema may need manual reconciliation if the local schema and generated migration drift.
- ProductKey `keyCode` uniqueness requires careful seeding and rotation to avoid collisions.
