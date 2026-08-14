import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth } from '../middlewares/auth/authorization.js';
import { JWTService } from '../services/auth/JWTService.js';
import { CartController } from '../controllers/CartController.js';
import { validateBody } from '../middlewares/validateRequest.js';
import { AddCartItemSchema, UpdateCartItemSchema } from '../validators/cart.js';

const router = Router();
const jwtService = new JWTService();
const cartController = new CartController();

router.get('/cart', authMiddleware(jwtService), requireAuth(), cartController.getCart);
router.get('/cart/summary', authMiddleware(jwtService), requireAuth(), cartController.getSummary);
router.post(
  '/cart/items',
  authMiddleware(jwtService),
  requireAuth(),
  validateBody(AddCartItemSchema),
  cartController.addItem,
);
router.patch(
  '/cart/items/:itemId',
  authMiddleware(jwtService),
  requireAuth(),
  validateBody(UpdateCartItemSchema),
  cartController.updateItem,
);
router.delete(
  '/cart/items/:itemId',
  authMiddleware(jwtService),
  requireAuth(),
  cartController.removeItem,
);
router.delete('/cart', authMiddleware(jwtService), requireAuth(), cartController.clearCart);

export default router;
