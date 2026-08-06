import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth, requireRole } from '../middlewares/auth/authorization.js';
import { OrderController } from '../controllers/OrderController.js';
import {
  CreateOrderSchema,
  MockPaymentSchema,
  UpdateOrderStatusSchema,
} from '../validators/order.js';
import { validateBody } from '../middlewares/validateRequest.js';
import { prisma } from '../common/database/prisma.js';
import { JWTService } from '../services/auth/JWTService.js';

const router = Router();
const jwtService = new JWTService();
const orderController = new OrderController(prisma);

router.post(
  '/orders',
  authMiddleware(jwtService),
  requireAuth(),
  validateBody(CreateOrderSchema),
  orderController.createOrder,
);
router.get('/orders', authMiddleware(jwtService), orderController.listOrders);
router.get('/orders/:id', authMiddleware(jwtService), orderController.getOrderById);
router.post(
  '/orders/:id/pay',
  authMiddleware(jwtService),
  validateBody(MockPaymentSchema),
  orderController.payOrder,
);
router.get(
  '/orders/:id/license-keys',
  authMiddleware(jwtService),
  orderController.getOrderLicenseKeys,
);

router.get(
  '/admin/orders',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  orderController.listAdminOrders,
);
router.get(
  '/admin/orders/:id/license-keys',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  orderController.getAdminOrderLicenseKeys,
);

router.get(
  '/admin/orders/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  orderController.getAdminOrderById,
);
router.patch(
  '/admin/orders/:id/status',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  validateBody(UpdateOrderStatusSchema),
  orderController.updateOrderStatus,
);
router.post(
  '/admin/orders/:id/mark-paid',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  validateBody(MockPaymentSchema),
  orderController.markOrderPaidAdmin,
);
router.post(
  '/admin/orders/:id/cancel',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  validateBody(MockPaymentSchema),
  orderController.cancelOrderAdmin,
);

router.get(
  '/admin/notifications',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  orderController.getNotifications,
);

router.post(
  '/admin/notifications/read-all',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  orderController.markAllNotificationsRead,
);

router.post(
  '/admin/notifications/:id/read',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  orderController.markNotificationRead,
);

router.delete(
  '/admin/notifications',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  orderController.clearNotifications,
);

router.post('/webhooks/payment', orderController.handleBankWebhook);

export default router;
