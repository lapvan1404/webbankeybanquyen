import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth } from '../middlewares/auth/authorization.js';
import { JWTService } from '../services/auth/JWTService.js';

const router = Router();
const jwtService = new JWTService();
const reviewController = new ReviewController();

// Public: Lấy danh sách bình luận theo sản phẩm
router.get('/products/:productId/reviews', reviewController.getReviews);

// Private: Gửi bình luận (yêu cầu đăng nhập)
router.post(
  '/products/:productId/reviews',
  authMiddleware(jwtService),
  requireAuth(),
  reviewController.createReview,
);

// Private: Xóa bình luận của chính mình
router.delete(
  '/reviews/:id',
  authMiddleware(jwtService),
  requireAuth(),
  reviewController.deleteReview,
);

export default router;
