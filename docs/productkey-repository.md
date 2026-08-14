# ProductKey Repository

## Purpose
The `ProductKeyRepository` provides data access for the `productkey` table using Prisma and shared repository patterns.

## Supported operations
- `findById(id)`
- `findAvailableByProduct(productId)`
- `findReservedByProduct(productId)`
- `findSoldByProduct(productId)`
- `findDisabledByProduct(productId)`
- `findByHash(productId, keyHash)`
- `countAvailable(productId)`
- `reserveKey(id)`
- `releaseKey(id)`
- `assignKey(id, orderItemId)`
- `disableKey(id)`
- `paginate(options)`

## Notes
- This repository is intentionally data-layer only. Business rules remain in service layer and are not implemented here.
- Pagination, filtering, and sorting are implemented in `paginate()`.
- All methods use the `productkey` Prisma delegate.
