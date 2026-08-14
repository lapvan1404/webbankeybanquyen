import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { PrismaClient, user_status } from '@prisma/client';
import { createResponse } from '../utils/response.js';

export class AdminUserController {
  constructor(private readonly prisma: PrismaClient) {}

  public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = (req.query.search as string | undefined)?.trim() || '';
      const statusParam = (req.query.status as string | undefined)?.trim().toUpperCase() || 'ALL';
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '10', 10)));

      // Thống kê đếm số lượng tài khoản theo trạng thái thực tế trong DB
      const [totalCount, activeCount, lockedCount] = await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: null, status: user_status.ACTIVE } }),
        this.prisma.user.count({ where: { deletedAt: null, status: user_status.LOCKED } }),
      ]);

      const whereClause: any = {
        deletedAt: null,
      };

      if (statusParam === 'ACTIVE') {
        whereClause.status = user_status.ACTIVE;
      } else if (statusParam === 'LOCKED') {
        whereClause.status = user_status.LOCKED;
      }

      if (search) {
        whereClause.OR = [
          { email: { contains: search } },
          { phone: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ];
      }

      const totalFiltered = await this.prisma.user.count({ where: whereClause });
      const totalPages = Math.ceil(totalFiltered / limit) || 1;

      const users = await this.prisma.user.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
          _count: { select: { order: true } },
          order: {
            select: {
              totalAmount: true,
              status: true,
              paymentStatus: true,
            },
          },
        },
      });

      const formattedUsers = users.map((u) => {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
        const paidOrders = u.order.filter(
          (o) => o.status === 'PAID' || o.paymentStatus === 'PAID',
        );
        const totalSpending = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

        return {
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          fullName,
          phone: u.phone || 'Chưa cập nhật',
          avatarUrl: u.avatarUrl,
          status: u.status,
          role: u.role?.name || 'customer',
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          orderCount: u._count.order,
          totalSpending,
        };
      });

      // Audit log cho xem danh sách user
      if (req.user?.sub) {
        await this.prisma.auditlog.create({
          data: {
            id: randomUUID(),
            userId: req.user.sub,
            event: 'ADMIN_VIEW_USER_LIST',
            metadata: JSON.stringify({ search, status: statusParam, page, limit, ip: req.ip }),
            createdAt: new Date(),
          },
        }).catch(() => null);
      }

      res.status(200).json(
        createResponse(
          {
            users: formattedUsers,
            pagination: {
              page,
              limit,
              total: totalFiltered,
              totalPages,
            },
            counts: {
              total: totalCount,
              active: activeCount,
              locked: lockedCount,
            },
          },
          'Lấy danh sách tài khoản thành công',
          null,
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
          order: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
              paymentStatus: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json(createResponse(null, 'Không tìm thấy tài khoản', null));
        return;
      }

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
      const paidOrders = user.order.filter(
        (o) => o.status === 'PAID' || o.paymentStatus === 'PAID',
      );
      const totalSpending = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      const orderHistory = user.order.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber || o.id.slice(0, 8).toUpperCase(),
        totalAmount: Number(o.totalAmount || 0),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      }));

      // Audit log cho xem chi tiết user
      if (req.user?.sub) {
        await this.prisma.auditlog.create({
          data: {
            id: randomUUID(),
            userId: req.user.sub,
            event: 'ADMIN_VIEW_USER_DETAIL',
            metadata: JSON.stringify({ targetUserId: user.id, targetEmail: user.email, ip: req.ip }),
            createdAt: new Date(),
          },
        }).catch(() => null);
      }

      res.status(200).json(
        createResponse(
          {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              fullName,
              phone: user.phone || 'Chưa cập nhật',
              avatarUrl: user.avatarUrl,
              status: user.status,
              role: user.role?.name || 'customer',
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              totalOrders: user.order.length,
              totalSpending,
            },
            orders: orderHistory,
          },
          'Lấy chi tiết tài khoản thành công',
          null,
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  public updateUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, action } = req.body || {};

      let targetStatus: user_status | undefined;
      if (status === 'LOCKED' || action === 'lock') {
        targetStatus = user_status.LOCKED;
      } else if (status === 'ACTIVE' || action === 'unlock') {
        targetStatus = user_status.ACTIVE;
      }

      if (!targetStatus) {
        res.status(400).json(createResponse(null, 'Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc LOCKED.', null));
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { role: true },
      });

      if (!user) {
        res.status(404).json(createResponse(null, 'Không tìm thấy tài khoản', null));
        return;
      }

      // BẢO VỆ TÀI KHOẢN ADMIN: SERVER-SIDE PROTECTION
      const roleName = (user.role?.name || '').toLowerCase();
      if (roleName === 'admin' || user.email === 'admin@example.com' || user.email === 'admin@namnguyen.vn') {
        res
          .status(400)
          .json(createResponse(null, 'Không thể khóa hoặc thao tác trạng thái trên tài khoản Quản trị viên (Admin).', null));
        return;
      }

      const previousStatus = user.status;
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          status: targetStatus,
          lockedUntil: targetStatus === user_status.LOCKED ? new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000) : null,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          status: true,
          updatedAt: true,
        },
      });

      // Audit Log chuyên sâu cho LOCK / UNLOCK
      const auditEvent = targetStatus === user_status.LOCKED ? 'LOCK_USER' : 'UNLOCK_USER';
      if (req.user?.sub) {
        await this.prisma.auditlog.create({
          data: {
            id: randomUUID(),
            userId: req.user.sub,
            event: auditEvent,
            metadata: JSON.stringify({
              adminId: req.user.sub,
              targetUserId: user.id,
              targetEmail: user.email,
              previousStatus,
              newStatus: targetStatus,
              ip: req.ip,
              timestamp: new Date().toISOString(),
            }),
            createdAt: new Date(),
          },
        }).catch(() => null);
      }

      const actionText = targetStatus === user_status.LOCKED ? 'Khóa' : 'Mở khóa';
      res.status(200).json(
        createResponse(
          updatedUser,
          `Đã ${actionText.toLowerCase()} tài khoản ${user.email} thành công`,
          null,
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
