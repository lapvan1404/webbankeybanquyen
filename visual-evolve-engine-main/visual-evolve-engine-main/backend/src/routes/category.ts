import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth, requireRole } from '../middlewares/auth/authorization.js';
import { JWTService } from '../services/auth/JWTService.js';

const router = Router();
const jwtService = new JWTService();
const categoryController = new CategoryController();

router.get('/categories', categoryController.list);
router.get('/categories/:slug', categoryController.getBySlug);

router.get('/admin/categories', categoryController.list);
router.post(
  '/admin/categories',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  categoryController.create,
);
router.put(
  '/admin/categories/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  categoryController.update,
);
router.delete(
  '/admin/categories/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  categoryController.delete,
);
router.patch(
  '/admin/categories/:id/status',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  categoryController.updateStatus,
);

export default router;
