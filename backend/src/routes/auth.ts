import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { currentUserMiddleware } from '../middlewares/auth/currentUserMiddleware.js';
import { JWTService } from '../services/auth/JWTService.js';
import { prisma } from '../common/database/prisma.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const jwtService = new JWTService();
const authController = new AuthController(prisma);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.',
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authMiddleware(jwtService), authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authMiddleware(jwtService), currentUserMiddleware(jwtService), authController.me);

// Admin auth & dashboard aliases
router.post('/admin/login', loginLimiter, authController.adminLogin);
router.post('/admin/logout', authMiddleware(jwtService), authController.logout);
router.get(
  '/admin/session',
  authMiddleware(jwtService),
  currentUserMiddleware(jwtService),
  authController.me,
);
router.get('/admin/dashboard', authMiddleware(jwtService), async (req, res, next) => {
  try {
    const orderCount = await prisma.order.count();
    const productCount = await prisma.product.count({ where: { deletedAt: null } });
    const categoryCount = await prisma.category.count({ where: { deletedAt: null } });
    const brandCount = await prisma.brand.count({ where: { deletedAt: null } });
    const keyCount = await prisma.productkey.count();
    const availableKeyCount = await prisma.productkey.count({ where: { status: 'AVAILABLE' } });
    const notificationCount = await prisma.notification.count({ where: { read: false } });

    const couponSetting = await prisma.systemsetting.findUnique({ where: { key: 'coupons_list' } });
    const couponsList = couponSetting ? JSON.parse(couponSetting.value) : [];
    const couponCount = couponsList.length;

    const paidOrders = await prisma.order.findMany({
      where: {
        OR: [{ status: 'PAID' }, { paymentStatus: 'PAID' }],
      },
      select: { totalAmount: true },
    });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        orderCount,
        productCount,
        categoryCount,
        brandCount,
        couponCount,
        keyCount,
        availableKeyCount,
        notificationCount,
        totalRevenue,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/store/coupons', async (req, res, next) => {
  try {
    const setting = await prisma.systemsetting.findUnique({ where: { key: 'coupons_list' } });
    const list = setting
      ? JSON.parse(setting.value)
      : [
          { id: 'cp1', code: 'GIAM10', discountPercent: 10, active: true },
          { id: 'cp2', code: 'NAMNGUYEN20', discountPercent: 20, active: true },
        ];
    const activeCoupons = list.filter((c: any) => Boolean(c.active));
    res.json({ success: true, data: activeCoupons });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/coupons', authMiddleware(jwtService), async (req, res, next) => {
  try {
    const setting = await prisma.systemsetting.findUnique({ where: { key: 'coupons_list' } });
    const list = setting
      ? JSON.parse(setting.value)
      : [
          { id: 'cp1', code: 'GIAM10', discountPercent: 10, active: true },
          { id: 'cp2', code: 'NAMNGUYEN20', discountPercent: 20, active: true },
        ];
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/coupons', authMiddleware(jwtService), async (req, res, next) => {
  try {
    const { code, discountPercent, active } = req.body;
    const setting = await prisma.systemsetting.findUnique({ where: { key: 'coupons_list' } });
    const currentList = setting ? JSON.parse(setting.value) : [];
    const newCoupon = {
      id: `cp_${Date.now()}`,
      code: String(code || '')
        .toUpperCase()
        .trim(),
      discountPercent: Number(discountPercent || 0),
      active: Boolean(active ?? true),
    };
    const newList = [newCoupon, ...currentList];
    await prisma.systemsetting.upsert({
      where: { key: 'coupons_list' },
      update: { value: JSON.stringify(newList), updatedAt: new Date() },
      create: {
        id: `st_${Date.now()}`,
        key: 'coupons_list',
        value: JSON.stringify(newList),
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, data: newCoupon });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/coupons/:id', authMiddleware(jwtService), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { code, discountPercent, active } = req.body;
    const setting = await prisma.systemsetting.findUnique({ where: { key: 'coupons_list' } });
    let currentList = setting ? JSON.parse(setting.value) : [];
    currentList = currentList.map((c: any) =>
      c.id === id
        ? {
            ...c,
            code: code !== undefined ? String(code).toUpperCase().trim() : c.code,
            discountPercent:
              discountPercent !== undefined ? Number(discountPercent) : c.discountPercent,
            active: active !== undefined ? Boolean(active) : c.active,
          }
        : c,
    );
    await prisma.systemsetting.upsert({
      where: { key: 'coupons_list' },
      update: { value: JSON.stringify(currentList), updatedAt: new Date() },
      create: {
        id: `st_${Date.now()}`,
        key: 'coupons_list',
        value: JSON.stringify(currentList),
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, message: 'Coupon updated' });
  } catch (err) {
    next(err);
  }
});

router.delete('/admin/coupons/:id', authMiddleware(jwtService), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const setting = await prisma.systemsetting.findUnique({ where: { key: 'coupons_list' } });
    let currentList = setting ? JSON.parse(setting.value) : [];
    currentList = currentList.filter((c: any) => c.id !== id);
    await prisma.systemsetting.upsert({
      where: { key: 'coupons_list' },
      update: { value: JSON.stringify(currentList), updatedAt: new Date() },
      create: {
        id: `st_${Date.now()}`,
        key: 'coupons_list',
        value: JSON.stringify(currentList),
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
