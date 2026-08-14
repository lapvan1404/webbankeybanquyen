import { Router } from 'express';
import { ProductController } from '../controllers/ProductController.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth, requireRole, requirePermission } from '../middlewares/auth/authorization.js';
import { JWTService } from '../services/auth/JWTService.js';

const router = Router();
const jwtService = new JWTService();
const productController = new ProductController();

// Public
router.get('/products', productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/id/:id', productController.getProductById);
router.get('/products/:slug/related', productController.getRelatedProducts);
router.get('/products/:slug', productController.getProductBySlug);

// Admin
router.get('/admin/products', productController.getProducts);
router.post(
  '/admin/products',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  requirePermission('product.create'),
  productController.createProduct,
);
router.put(
  '/admin/products/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  requirePermission('product.update'),
  productController.updateProduct,
);
router.patch(
  '/admin/products/:id/status',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  requirePermission('product.update'),
  productController.updateProductStatus,
);
router.delete(
  '/admin/products/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  requirePermission('product.delete'),
  productController.deleteProduct,
);

export default router;
