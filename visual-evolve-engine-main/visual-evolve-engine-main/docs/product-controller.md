# Product Controller

Location: `backend/src/controllers/ProductController.ts`

Public endpoints:
- `getProducts` — list/search products using `ProductSearchSchema`.
- `getProductBySlug` — fetch product by slug.
- `getFeaturedProducts` — fetch featured products with optional `limit` query.
- `getRelatedProducts` — fetch related products for a product id.

Admin endpoints:
- `createProduct` — validate with `CreateProductSchema` and call `ProductService.create`.
- `updateProduct` — validate with `UpdateProductSchema` and call `ProductService.update`.
- `deleteProduct` — call `ProductService.delete`.
- `updateProductStatus` — validate with `ProductStatusSchema` and call `ProductService.update` to change `status`.

Controller responsibilities:
- Validate request payloads and query parameters.
- Call `ProductService` for business logic.
- Return standardized responses using the existing `createResponse` helper.
- Only handle `HttpError` through existing error middleware; do not expose internals.

Note: Controllers do not implement route registration; routes should apply authentication/authorization middleware as needed.
