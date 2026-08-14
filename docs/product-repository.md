# Product Repository

## Overview

The Product Repository provides data access for products using Prisma and the shared repository infrastructure.

## Location

- `backend/src/repositories/product/ProductRepository.ts`

## Responsibilities

- `findById`
- `findBySlug`
- `findBySku`
- `search`
- Pagination
- Filtering by keyword, category, brand, price, licenseType, status, and featured
- Sorting by `price`, `name`, `createdAt`, `soldCount`, and `viewCount`
- `findFeatured` for featured products
- `findNew` for newest products
- `findRelated` for related products by category and brand

## Security and Data Rules

- Soft delete only: `deletedAt` is preserved rather than hard deleting.
- Deleted products are never returned from repository queries.
- Product search and finder methods always filter out `deletedAt != null`.
