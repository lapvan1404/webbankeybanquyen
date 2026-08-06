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
      const { title, subtitle, imageUrl, linkUrl, isActive } = req.body;
      if (!title || !imageUrl) {
        res.status(400).json(createResponse(null, 'Title and imageUrl are required.', null));
        return;
      }
      const banner = await prisma.banner.create({
        data: {
          id: randomUUID(),
          title,
          subtitle: subtitle ?? null,
          imageUrl,
          linkUrl: linkUrl ?? null,
          isActive: isActive !== false,
          updatedAt: new Date(),
        },
      });
      res.status(201).json(createResponse(banner, 'Banner created successfully.', null));
    } catch (error) {
      next(error);
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
      const { title, subtitle, imageUrl, linkUrl, isActive } = req.body;
      const banner = await prisma.banner.update({
        where: { id },
        data: {
          title: title ?? existing.title,
          subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
          imageUrl: imageUrl ?? existing.imageUrl,
          linkUrl: linkUrl !== undefined ? linkUrl : existing.linkUrl,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          updatedAt: new Date(),
        },
      });
      res.status(200).json(createResponse(banner, 'Banner updated successfully.', null));
    } catch (error) {
      next(error);
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
