import type { NextFunction, Request, Response } from 'express';
import { JWTService } from '../../services/auth/JWTService.js';

export const authMiddleware = (jwtService: JWTService) => {
  const getTokenFromRequest = (req: Request): string | undefined => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length);
    }

    return req.signedCookies?.accessToken ?? req.cookies?.accessToken;
  };

  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = getTokenFromRequest(req);
    if (!token) {
      req.user = undefined;
      next();
      return;
    }

    try {
      req.user = jwtService.verifyAccessToken(token);
      next();
    } catch {
      req.user = undefined;
      next();
    }
  };
};
