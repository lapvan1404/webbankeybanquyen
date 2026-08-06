import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { prisma } from '../common/database/prisma.js';
import { createResponse } from '../utils/response.js';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  body: z
    .string()
    .min(5, 'Bình luận phải có ít nhất 5 ký tự')
    .max(1000, 'Bình luận không được quá 1000 ký tự'),
  rating: z.number().int().min(1).max(5).default(5),
});

export class ReviewController {
  /**
   * GET /api/products/:productId/reviews
   * Public — lấy danh sách bình luận theo sản phẩm
   */
  public getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;

      const product = await prisma.product.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }], deletedAt: null },
        select: { id: true },
      });

      if (!product) {
        res.status(404).json(createResponse(null, 'Sản phẩm không tồn tại.', null));
        return;
      }

      const reviews = await prisma.review.findMany({
        where: { productId: product.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      const formatted = reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body ?? '',
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          name:
            [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') ||
            r.user.email.split('@')[0],
          avatar: r.user.avatarUrl,
        },
      }));

      res.status(200).json(createResponse(formatted, 'Reviews loaded.', null));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/products/:productId/reviews
   * Private — tạo bình luận mới (yêu cầu đăng nhập)
   */
  public createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json(createResponse(null, 'Vui lòng đăng nhập để bình luận.', null));
        return;
      }

      const { productId } = req.params;

      // Kiểm tra product tồn tại (tìm theo id hoặc slug)
      const product = await prisma.product.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }], deletedAt: null },
        select: { id: true },
      });

      if (!product) {
        res.status(404).json(createResponse(null, 'Sản phẩm không tồn tại.', null));
        return;
      }

      // Kiểm tra user tồn tại
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      });

      if (!user) {
        res.status(404).json(createResponse(null, 'Người dùng không tồn tại.', null));
        return;
      }

      // Kiểm tra đã bình luận chưa
      const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
      });

      if (existing && !existing.deletedAt) {
        res.status(409).json(createResponse(null, 'Bạn đã bình luận cho sản phẩm này rồi.', null));
        return;
      }

      // Validate body
      const parsed = CreateReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ.';
        res.status(422).json(createResponse(null, msg, null));
        return;
      }

      const now = new Date();

      // Nếu đã từng bình luận nhưng đã xóa → khôi phục và cập nhật
      if (existing && existing.deletedAt) {
        const restored = await prisma.review.update({
          where: { id: existing.id },
          data: {
            body: parsed.data.body,
            rating: parsed.data.rating,
            deletedAt: null,
            updatedAt: now,
          },
        });

        res.status(201).json(
          createResponse(
            {
              id: restored.id,
              rating: restored.rating,
              body: restored.body ?? '',
              createdAt: restored.createdAt,
              user: {
                id: user.id,
                name:
                  [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                  user.email.split('@')[0],
                avatar: user.avatarUrl,
              },
            },
            'Bình luận đã được gửi.',
            null,
          ),
        );
        return;
      }

      // Tạo bình luận mới
      const review = await prisma.review.create({
        data: {
          id: randomUUID(),
          userId,
          productId: product.id,
          rating: parsed.data.rating,
          body: parsed.data.body,
          updatedAt: now,
        },
      });

      res.status(201).json(
        createResponse(
          {
            id: review.id,
            rating: review.rating,
            body: review.body ?? '',
            createdAt: review.createdAt,
            user: {
              id: user.id,
              name:
                [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                user.email.split('@')[0],
              avatar: user.avatarUrl,
            },
          },
          'Bình luận đã được gửi.',
          null,
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/reviews/:id
   * Private — xóa mềm bình luận của chính mình
   */
  public deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review || review.deletedAt) {
        res.status(404).json(createResponse(null, 'Bình luận không tồn tại.', null));
        return;
      }

      if (review.userId !== userId) {
        res.status(403).json(createResponse(null, 'Bạn không có quyền xóa bình luận này.', null));
        return;
      }

      await prisma.review.update({
        where: { id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });

      res.status(200).json(createResponse(null, 'Bình luận đã được xóa.', null));
    } catch (error) {
      next(error);
    }
  };
}
