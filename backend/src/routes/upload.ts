import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/uploadController.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth, requireRole } from '../middlewares/auth/authorization.js';
import { JWTService } from '../services/auth/JWTService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const jwtService = new JWTService();
const uploadController = new UploadController();

router.post(
  '/image',
  authMiddleware(jwtService),
  upload.single('file'),
  uploadController.uploadImage,
);
router.get('/object', uploadController.getPublicObject);
router.delete(
  '/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  uploadController.deleteImage,
);
router.get('/:id/url', authMiddleware(jwtService), requireAuth(), uploadController.getSignedUrl);

export default router;
