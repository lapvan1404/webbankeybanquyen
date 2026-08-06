import type { NextFunction, Request, Response } from 'express';
import { createResponse } from '../../utils/response.js';

export type AuthUserLike = {
  sub?: string;
  role?: string;
  permissions?: string[];
};

const ROLE_ALIASES: Record<string, string> = {
  admin: 'ADMIN',
  administrator: 'ADMIN',
  customer: 'CUSTOMER',
  user: 'CUSTOMER',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'product.read',
    'product.create',
    'product.update',
    'product.delete',
    'banner.read',
    'banner.create',
    'banner.update',
    'banner.delete',
    'order.read',
    'order.update',
    'order.cancel',
    'payment.read',
    'payment.refund',
    'user.read',
    'user.update',
    'user.delete',
    'dashboard.read',
    'system.manage',
  ],
  CUSTOMER: ['dashboard.read'],
};

export const normalizeRole = (role?: string): string | undefined => {
  if (!role) {
    return undefined;
  }

  const normalized = role.toString().trim().toLowerCase();
  return ROLE_ALIASES[normalized] ?? role.toString().toUpperCase();
};

export const getPermissionsForRole = (role?: string): string[] => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? (ROLE_PERMISSIONS[normalizedRole] ?? []) : [];
};

export const buildAuthorizationContext = <T extends AuthUserLike>(
  user?: T,
): T & { role?: string; permissions: string[] } => {
  const normalizedRole = normalizeRole(user?.role);
  return {
    ...user,
    role: normalizedRole,
    permissions: getPermissionsForRole(normalizedRole),
  } as T & { role?: string; permissions: string[] };
};

const respondUnauthorized = (res: Response): void => {
  res.status(401).json(createResponse(null, 'Unauthorized', null));
};

const respondForbidden = (res: Response): void => {
  res.status(403).json(createResponse(null, 'Forbidden', null));
};

export const requireAuth = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.sub) {
      respondUnauthorized(res);
      return;
    }

    req.user = buildAuthorizationContext(req.user);
    next();
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.sub) {
      respondUnauthorized(res);
      return;
    }

    const normalizedRole = normalizeRole(req.user.role);
    const allowedRoles = roles.map((role) => normalizeRole(role));
    req.user = buildAuthorizationContext(req.user);

    if (!normalizedRole || !allowedRoles.includes(normalizedRole)) {
      respondForbidden(res);
      return;
    }

    next();
  };
};

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.sub) {
      respondUnauthorized(res);
      return;
    }

    const authContext = buildAuthorizationContext(req.user);
    req.user = authContext;

    const grantedPermissions = authContext.permissions ?? [];
    const hasPermission = permissions.some((permission) => grantedPermissions.includes(permission));

    if (!hasPermission) {
      respondForbidden(res);
      return;
    }

    next();
  };
};

export const AdminGuard = requireRole('ADMIN');
export const CustomerGuard = requireRole('CUSTOMER');
