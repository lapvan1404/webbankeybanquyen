# Product Service Review

## Summary

Implemented the Product business layer without adding controllers or routes.

## What was added

- `backend/src/services/product/ProductService.ts`
- `docs/product-service.md`
- `review/product-service-review.md`

## Business behavior

- Product creation validates SKU and slug uniqueness.
- Enforces category and brand existence.
- Validates price, sale price, stock, license duration, and device limit.
- Default status is `ACTIVE`.
- Update rejects deleted products.
- Delete performs soft delete and prevents deletion when active order items exist.
- Search reuses repository filtering.
- Supports featured, newest, and related products.
- Supports view count and sold count increments.
- Uses `UnitOfWork` for create transaction.
