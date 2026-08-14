import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../common/database/prisma.js';
import { createResponse } from '../utils/response.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';
import { requireAuth, requireRole } from '../middlewares/auth/authorization.js';
import { JWTService } from '../services/auth/JWTService.js';

const router = Router();
const jwtService = new JWTService();

// Public: list active banners
router.get('/banners', async (_req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(createResponse(banners, 'Banners loaded successfully.', null));
  } catch (error) {
    next(error);
  }
});

// Admin: list all banners (including inactive)
router.get(
  '/admin/banners',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  async (_req, res, next) => {
    try {
      const banners = await prisma.banner.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(createResponse(banners, 'Banners loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  },
);

// Admin: create banner
router.post(
  '/admin/banners',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const { title, name, subtitle, imageUrl, linkUrl, link, isActive, position } = req.body;
      const finalTitle = (title || name || 'Banner Promo').slice(0, 190);
      const rawImageUrl = imageUrl || '';

      if (!rawImageUrl) {
        res.status(400).json(createResponse(null, 'imageUrl is required.', null));
        return;
      }

      const safeImageUrl = rawImageUrl.slice(0, 1000);
      const rawLink = linkUrl || link || null;
      const safeLink = rawLink ? rawLink.slice(0, 500) : null;
      const posTag = position ? `pos:${position}` : null;
      const finalSubtitle = subtitle ? subtitle.slice(0, 190) : posTag;

      // Nếu có position (promo_windows / promo_antivirus) -> kiểm tra nếu đã tồn tại thì UPDATE
      if (posTag) {
        const existingPos = await prisma.banner.findFirst({
          where: { subtitle: posTag, deletedAt: null },
        });
        if (existingPos) {
          const updated = await prisma.banner.update({
            where: { id: existingPos.id },
            data: {
              title: finalTitle,
              imageUrl: safeImageUrl,
              linkUrl: safeLink,
              isActive: isActive !== false,
              updatedAt: new Date(),
            },
          });
          res.status(200).json(createResponse(updated, 'Banner updated successfully.', null));
          return;
        }
      }

      const banner = await prisma.banner.create({
        data: {
          id: randomUUID(),
          title: finalTitle,
          subtitle: finalSubtitle,
          imageUrl: safeImageUrl,
          linkUrl: safeLink,
          isActive: isActive !== false,
          updatedAt: new Date(),
        },
      });
      res.status(201).json(createResponse(banner, 'Banner created successfully.', null));
    } catch (error) {
      console.error('Create Banner Error:', error);
      res.status(500).json(createResponse(null, 'Lỗi khi tạo banner trên hệ thống.', null));
    }
  },
);

// Admin: update banner
router.put(
  '/admin/banners/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const existing = await prisma.banner.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        res.status(404).json(createResponse(null, 'Banner not found.', null));
        return;
      }

      const { title, name, subtitle, imageUrl, linkUrl, link, isActive, position } = req.body;
      const rawLink = linkUrl !== undefined ? linkUrl : link !== undefined ? link : existing.linkUrl;
      const safeLink = rawLink ? String(rawLink).slice(0, 500) : null;
      const posTag = position ? `pos:${position}` : null;
      const finalSubtitle = subtitle !== undefined ? String(subtitle).slice(0, 190) : posTag ?? existing.subtitle;
      const safeImageUrl = imageUrl ? String(imageUrl).slice(0, 1000) : existing.imageUrl;
      const finalTitle = (title || name || existing.title).slice(0, 190);

      const banner = await prisma.banner.update({
        where: { id },
        data: {
          title: finalTitle,
          subtitle: finalSubtitle,
          imageUrl: safeImageUrl,
          linkUrl: safeLink,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          updatedAt: new Date(),
        },
      });
      res.status(200).json(createResponse(banner, 'Banner updated successfully.', null));
    } catch (error) {
      console.error('Update Banner Error:', error);
      res.status(500).json(createResponse(null, 'Lỗi khi cập nhật banner trên hệ thống.', null));
    }
  },
);

// Admin: delete banner (soft)
router.delete(
  '/admin/banners/:id',
  authMiddleware(jwtService),
  requireAuth(),
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const existing = await prisma.banner.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        res.status(404).json(createResponse(null, 'Banner not found.', null));
        return;
      }
      await prisma.banner.update({
        where: { id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });
      res.status(200).json(createResponse(null, 'Banner deleted successfully.', null));
    } catch (error) {
      next(error);
    }
  },
);

export default router;
