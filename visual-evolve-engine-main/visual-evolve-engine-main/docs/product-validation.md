# Product Validation

This document describes validation schemas for the Product module.

Files:
- `backend/src/validators/product.ts`

Schemas:
- `CreateProductSchema` — validation for product creation payloads.
- `UpdateProductSchema` — partial of `CreateProductSchema` for updates.
- `ProductSearchSchema` — validation for search/query parameters.
- `ProductStatusSchema` — validation for status updates.

Business rules enforced:
- `price >= 0`.
- `salePrice <= price`.
- `stock >= 0`.
- `licenseDuration > 0` when provided.
- `deviceLimit > 0` when provided.
- `SKU` length between 3 and 64.
- `slug` follows lowercase alphanumeric and hyphen format.
- `name` and `description` maximum lengths enforced.

Error handling:
- Schemas return typed zod validation errors. Do not expose internal details in responses.
