import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';

export interface TokenPayload {
  sub: string;
  role?: string;
  type: 'access' | 'refresh';
}

export class JWTService {
  private readonly accessSecret = env.jwtSecret;
  private readonly refreshSecret = env.jwtRefreshSecret;

  public signAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    return this.signToken({ ...payload, type: 'access' }, this.accessSecret, {
      expiresIn: '15m',
    });
  }

  public signRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    return this.signToken({ ...payload, type: 'refresh' }, this.refreshSecret, {
      expiresIn: '7d',
    });
  }

  public verifyAccessToken(token: string): TokenPayload {
    return this.verifyToken(token, this.accessSecret) as TokenPayload;
  }

  public verifyRefreshToken(token: string): TokenPayload {
    return this.verifyToken(token, this.refreshSecret) as TokenPayload;
  }

  private signToken(payload: TokenPayload, secret: string, options: SignOptions): string {
    return jwt.sign(payload, secret, options);
  }

  private verifyToken(token: string, secret: string): TokenPayload {
    return jwt.verify(token, secret) as TokenPayload;
  }
}
