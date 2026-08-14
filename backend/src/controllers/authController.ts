import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { PrismaClient, user_status } from '@prisma/client';
import { createResponse } from '../utils/response.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import { PasswordService } from '../services/auth/PasswordService.js';
import { JWTService } from '../services/auth/JWTService.js';
import { RefreshTokenService } from '../services/auth/RefreshTokenService.js';
import { CookieService } from '../services/auth/CookieService.js';
import { SessionService } from '../services/auth/SessionService.js';
import { UnitOfWork } from '../common/database/unitOfWork.js';
import { env } from '../config/env.js';

export class AuthController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly passwordService = new PasswordService(),
    private readonly jwtService = new JWTService(),
    private readonly refreshTokenService = new RefreshTokenService(),
    private readonly cookieService = new CookieService(),
    private readonly sessionService = new SessionService(),
  ) {}

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerSchema.parse(req.body);
      const existing = await this.prisma.user.findUnique({ where: { email: parsed.email } });
      if (existing) {
        res.status(409).json(createResponse(null, 'Email already registered', null));
        return;
      }

      const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordPolicyRegex.test(parsed.password)) {
        res
          .status(400)
          .json(
            createResponse(
              null,
              'Password must include uppercase, lowercase, number, and special character',
              null,
            ),
          );
        return;
      }

      const customerRole = await this.prisma.role.findUnique({ where: { name: 'customer' } });
      if (!customerRole) {
        res.status(500).json(createResponse(null, 'Customer role not configured', null));
        return;
      }

      const hashedPassword = await this.passwordService.hash(parsed.password);
      const createdUser = await this.prisma.user.create({
        data: {
          id: randomUUID(),
          email: parsed.email,
          passwordHash: hashedPassword,
          firstName: parsed.fullName?.split(' ')[0] ?? null,
          lastName: parsed.fullName?.split(' ').slice(1).join(' ') ?? null,
          roleId: customerRole.id,
          emailVerified: false,
          status: user_status.ACTIVE,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: { select: { name: true } },
          emailVerified: true,
        },
      });

      res.status(201).json(createResponse(createdUser, 'Registration successful', null));
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.parse(req.body);
      const user = await this.prisma.user.findUnique({
        where: { email: parsed.email },
        include: { role: true },
      });

      if (!user) {
        await this.handleFailedLogin(parsed.email, req);
        res.status(401).json(createResponse(null, 'Invalid credentials', null));
        return;
      }

      if (
        user.status === user_status.LOCKED ||
        (user.lockedUntil && user.lockedUntil > new Date())
      ) {
        res.status(423).json(createResponse(null, 'Account is locked', null));
        return;
      }

      const isPasswordValid = await this.passwordService.verify(parsed.password, user.passwordHash);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user.email, req);
        res.status(401).json(createResponse(null, 'Invalid credentials', null));
        return;
      }

      // CHẶN TÀI KHOẢN ADMIN ĐĂNG NHẬP Ở PHÍA KHÁCH HÀNG / DEV
      const userRole = (user.role?.name || '').toLowerCase();
      const isAdminAccount = userRole === 'admin' || user.email === 'admin@namnguyen.vn';

      if (isAdminAccount) {
        res
          .status(403)
          .json(
            createResponse(
              null,
              'Tài khoản Admin không thể đăng nhập tại đây. Vui lòng truy cập trang Quản trị /admin để đăng nhập.',
              null,
            ),
          );
        return;
      }

      const maxFailedAttempts = Number(env.maxFailedLoginAttempts ?? 5);
      if (user.failedLoginCount >= maxFailedAttempts) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: user_status.LOCKED, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
        });
        res.status(423).json(createResponse(null, 'Account is locked', null));
        return;
      }

      const uow = new UnitOfWork(this.prisma);
      await uow.execute(async (tx) => {
        const txClient = tx.getClient();
        const session = await txClient.usersession.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') ?? null,
            updatedAt: new Date(),
          },
        });

        const refreshToken = this.jwtService.signRefreshToken({
          sub: user.id,
          role: user.role?.name ?? user.roleId,
        });
        const hashedRefreshToken = this.refreshTokenService.hashToken(refreshToken);
        await txClient.refreshtoken.create({
          data: {
            id: randomUUID(),
            tokenHash: hashedRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        });

        const accessToken = this.jwtService.signAccessToken({
          sub: user.id,
          role: user.role?.name ?? user.roleId,
        });
        const cookieOptions = this.cookieService.createCookieOptions();
        res.cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        res.cookie('accessToken', accessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
          expires: new Date(Date.now() + 15 * 60 * 1000),
        });

        await txClient.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lastLoginAt: new Date(),
          },
        });

        const responsePayload = {
          id: user.id,
          email: user.email,
          fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          avatar: user.avatarUrl,
          role: user.roleId,
          emailVerified: user.emailVerified,
          sessionId: session.id,
          accessToken,
        };

        res.status(200).json(createResponse(responsePayload, 'Login successful', null));
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.signedCookies?.refreshToken ?? req.cookies?.refreshToken;
      const cookieOptions = this.cookieService.createCookieOptions();
      if (!token) {
        res.clearCookie('refreshToken', cookieOptions);
        res.clearCookie('accessToken', cookieOptions);
        res.status(200).json(createResponse(null, 'Logged out', null));
        return;
      }

      const hashedToken = this.refreshTokenService.hashToken(token);
      const refreshTokenRecord = await this.prisma.refreshtoken.findFirst({
        where: { tokenHash: hashedToken, revoked: false },
      });

      if (refreshTokenRecord) {
        await this.prisma.refreshtoken.updateMany({
          where: { id: refreshTokenRecord.id },
          data: { revoked: true },
        });
      }

      await this.prisma.usersession.updateMany({
        where: { userId: req.user?.sub ?? '' },
        data: { revoked: true },
      });

      res.clearCookie('refreshToken', cookieOptions);
      res.clearCookie('accessToken', cookieOptions);
      res.status(200).json(createResponse(null, 'Logged out', null));
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.signedCookies?.refreshToken ?? req.cookies?.refreshToken;
      if (!token) {
        res.status(401).json(createResponse(null, 'Refresh token missing', null));
        return;
      }

      const hashedToken = this.refreshTokenService.hashToken(token);
      const refreshTokenRecord = await this.prisma.refreshtoken.findFirst({
        where: { tokenHash: hashedToken, revoked: false },
      });
      if (!refreshTokenRecord) {
        res.status(401).json(createResponse(null, 'Invalid refresh token', null));
        return;
      }

      const payload = this.jwtService.verifyRefreshToken(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });
      if (
        !user ||
        user.status === user_status.LOCKED ||
        user.status === user_status.INACTIVE ||
        user.status === user_status.DELETED
      ) {
        res.status(401).json(createResponse(null, 'Invalid refresh token', null));
        return;
      }

      const uow = new UnitOfWork(this.prisma);
      await uow.execute(async (tx) => {
        const txClient = tx.getClient();
        await txClient.refreshtoken.updateMany({
          where: { tokenHash: hashedToken, revoked: false },
          data: { revoked: true },
        });

        const newRefreshToken = this.jwtService.signRefreshToken({
          sub: user.id,
          role: user.roleId,
        });
        const newHashedRefreshToken = this.refreshTokenService.hashToken(newRefreshToken);
        await txClient.refreshtoken.create({
          data: {
            id: randomUUID(),
            tokenHash: newHashedRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        });

        const accessToken = this.jwtService.signAccessToken({
          sub: user.id,
          role: user.role?.name ?? user.roleId,
        });
        const cookieOptions = this.cookieService.createCookieOptions();
        res.cookie('refreshToken', newRefreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        res.cookie('accessToken', accessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
          expires: new Date(Date.now() + 15 * 60 * 1000),
        });

        res.status(200).json(createResponse({ accessToken }, 'Token refreshed', null));
      });
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.sub) {
        res.status(401).json(createResponse(null, 'Unauthorized', null));
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: req.user.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: { select: { name: true } },
          emailVerified: true,
        },
      });

      if (!user) {
        res.status(404).json(createResponse(null, 'User not found', null));
        return;
      }

      res.status(200).json(
        createResponse(
          {
            id: user.id,
            email: user.email,
            fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
            avatar: user.avatarUrl,
            role: user.role?.name,
            emailVerified: user.emailVerified,
          },
          'User profile loaded',
          null,
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  public adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.parse(req.body);
      const user = await this.prisma.user.findUnique({
        where: { email: parsed.email },
        include: { role: true },
      });

      if (!user) {
        await this.handleFailedLogin(parsed.email, req);
        res.status(401).json(createResponse(null, 'Invalid credentials', null));
        return;
      }

      const userRole = (user.role?.name || '').toLowerCase();
      const isAdminAccount = userRole === 'admin' || user.email === 'admin@namnguyen.vn';

      if (!isAdminAccount) {
        res
          .status(403)
          .json(
            createResponse(null, 'Tài khoản này không có quyền truy cập Quản trị Admin.', null),
          );
        return;
      }

      const isPasswordValid = await this.passwordService.verify(parsed.password, user.passwordHash);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user.email, req);
        res.status(401).json(createResponse(null, 'Invalid credentials', null));
        return;
      }

      const uow = new UnitOfWork(this.prisma);
      await uow.execute(async (tx) => {
        const txClient = tx.getClient();
        await txClient.usersession.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') ?? null,
            updatedAt: new Date(),
          },
        });

        const refreshToken = this.jwtService.signRefreshToken({
          sub: user.id,
          role: 'ADMIN',
        });
        const hashedRefreshToken = this.refreshTokenService.hashToken(refreshToken);
        await txClient.refreshtoken.create({
          data: {
            id: randomUUID(),
            tokenHash: hashedRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        });

        const accessToken = this.jwtService.signAccessToken({
          sub: user.id,
          role: 'ADMIN',
        });
        const cookieOptions = this.cookieService.createCookieOptions();
        res.cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        res.cookie('accessToken', accessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
          expires: new Date(Date.now() + 15 * 60 * 1000),
        });

        res.status(200).json(
          createResponse(
            {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: 'ADMIN',
              accessToken,
              refreshToken,
            },
            'Admin login successful',
            null,
          ),
        );
      });
    } catch (error) {
      next(error);
    }
  };

  private async handleFailedLogin(email: string, req: Request): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    const failedCount = user.failedLoginCount + 1;
    const shouldLock = failedCount >= Number(env.maxFailedLoginAttempts ?? 5);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failedCount,
        ...(shouldLock
          ? { status: user_status.LOCKED, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
          : {}),
      },
    });

    await this.prisma.loginattempt.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') ?? null,
        reason: 'invalid_credentials',
      },
    });
  }
}
