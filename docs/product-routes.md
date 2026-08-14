# Product Routes

File: `backend/src/routes/product.ts`

Public routes:

- GET `/api/products` — list/search products
- GET `/api/products/featured` — featured products
- GET `/api/products/:slug/related` — related products for a product
- GET `/api/products/:slug` — get product by slug

Admin routes (require `authMiddleware`, `requireAuth()`, and `requireRole('ADMIN')`):

- POST `/api/admin/products` — create product (validated by `CreateProductSchema` in controller)
- PUT `/api/admin/products/:id` — update product (validated by `UpdateProductSchema`)
- PATCH `/api/admin/products/:id/status` — update status (validated by `ProductStatusSchema`)
- DELETE `/api/admin/products/:id` — delete product

Notes:

- Controllers perform payload validation; routes apply auth/authorization middleware for admin routes.
- Do not call `ProductService` without passing validated inputs (controllers enforce this).
