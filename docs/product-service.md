# Product Service

## Overview

The Product Service implements business logic for product operations using existing repository and transaction patterns.

## Location

- `backend/src/services/product/ProductService.ts`

## Responsibilities

- Create product with SKU/slug uniqueness validation.
- Validate category and brand existence.
- Enforce pricing, stock, license, and status business rules.
- Update products while preserving soft delete semantics.
- Soft delete products and prevent deletion when active order items exist.
- Search products via repository filters.
- Provide featured, newest, and related product retrieval.
- Increase product view and sold counts.

## Business Rules

- SKU must be unique.
- Slug must be unique.
- Category must exist.
- Brand must exist.
- Price must be >= 0.
- SalePrice must be <= Price.
- Stock must be >= 0.
- LicenseDuration must be > 0 when provided.
- DeviceLimit must be > 0 when provided.
- Default product status is `ACTIVE`.
- Only soft delete is supported.
- Service throws only typed `HttpError`.
