import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth, requireRole } from '../middlewares/auth/authorization.js';
import { ProductKeyController } from '../controllers/ProductKeyController.js';
import {
  AssignProductKeySchema,
  CreateProductKeySchema,
  ImportProductKeySchema,
  ProductKeySearchSchema,
  UpdateProductKeySchema,
} from '../validators/productKey.js';
import { validateBody, validateQuery } from '../middlewares/validateRequest.js';
import { prisma } from '../common/database/prisma.js';
import { JWTService } from '../services/auth/JWTService.js';

const router = Router();
const jwtService = new JWTService();
const productKeyController = new ProductKeyController(prisma);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get(
  '/product-keys',
  validateQuery(ProductKeySearchSchema),
  productKeyController.searchProductKeys,
);
router.get(
  '/product-keys/product/:productId/available-count',
  productKeyController.getAvailableCount,
);
router.get('/product-keys/:id', productKeyController.getProductKeyById);

router.get(
  '/admin/keys',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const keys = await prisma.productkey.findMany({
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      });
      const formatted = keys.map((k) => ({
        id: k.id,
        productId: k.productId,
        productName: k.product?.name || 'Sản phẩm',
        key: k.encryptedKey,
        status: k.status,
        createdAt: k.createdAt,
      }));
      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/admin/keys',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const { productId, key, status } = req.body;
      const created = await prisma.productkey.create({
        data: {
          id: `pk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          productId: String(productId),
          encryptedKey: String(key).trim(),
          keyHash: String(key).trim().slice(0, 64),
          iv: 'legacy_v1',
          status: status || 'AVAILABLE',
          updatedAt: new Date(),
        },
      });
      res.json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/admin/keys/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { productId, key, status } = req.body;
      const dataToUpdate: any = { updatedAt: new Date() };
      if (productId) dataToUpdate.productId = String(productId);
      if (key) {
        dataToUpdate.encryptedKey = String(key).trim();
        dataToUpdate.keyHash = String(key).trim().slice(0, 64);
      }
      if (status) dataToUpdate.status = status;
      const updated = await prisma.productkey.update({
        where: { id },
        data: dataToUpdate,
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/admin/keys/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await prisma.productkey.delete({ where: { id } });
      res.json({ success: true, message: 'Product key deleted' });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/admin/product-keys',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  validateBody(CreateProductKeySchema),
  productKeyController.createProductKey,
);
router.put(
  '/admin/product-keys/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  validateBody(UpdateProductKeySchema),
  productKeyController.updateProductKey,
);
router.delete(
  '/admin/product-keys/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  productKeyController.deleteProductKey,
);
router.post(
  '/admin/product-keys/import/txt',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  upload.single('file'),
  validateBody(ImportProductKeySchema),
  productKeyController.importTxt,
);
router.post(
  '/admin/product-keys/import/csv',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  upload.single('file'),
  validateBody(ImportProductKeySchema),
  productKeyController.importCsv,
);
router.post(
  '/admin/product-keys/:id/reserve',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  productKeyController.reserveProductKey,
);
router.post(
  '/admin/product-keys/:id/release',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  productKeyController.releaseProductKey,
);
router.post(
  '/admin/product-keys/:id/assign',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  validateBody(AssignProductKeySchema),
  productKeyController.assignProductKey,
);

export default router;
