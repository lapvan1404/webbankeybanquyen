import { Router } from 'express';
import { BrandController } from '../controllers/BrandController.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth, requireRole } from '../middlewares/auth/authorization.js';
import { JWTService } from '../services/auth/JWTService.js';

const router = Router();
const jwtService = new JWTService();
const brandController = new BrandController();

router.get('/brands', brandController.list);
router.get('/brands/:slug', brandController.getBySlug);

router.get('/admin/brands', brandController.list);
router.post(
  '/admin/brands',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  brandController.create,
);
router.put(
  '/admin/brands/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  brandController.update,
);
router.delete(
  '/admin/brands/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  brandController.delete,
);
router.patch(
  '/admin/brands/:id/status',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  brandController.updateStatus,
);

export default router;
