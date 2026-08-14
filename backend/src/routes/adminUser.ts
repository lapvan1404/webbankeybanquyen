import { Router } from 'express';
import { prisma } from '../common/database/prisma.js';
import { JWTService } from '../services/auth/JWTService.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth, requireRole } from '../middlewares/auth/authorization.js';
import { AdminUserController } from '../controllers/adminUserController.js';

const router = Router();
const jwtService = new JWTService();
const adminUserController = new AdminUserController(prisma);

const adminGuard = [authMiddleware(jwtService), requireAuth(), requireRole('admin')];

router.get('/users', ...adminGuard, adminUserController.getUsers);
router.get('/users/:id', ...adminGuard, adminUserController.getUserById);
router.patch('/users/:id/status', ...adminGuard, adminUserController.updateUserStatus);
router.put('/users/:id/status', ...adminGuard, adminUserController.updateUserStatus);

export default router;
