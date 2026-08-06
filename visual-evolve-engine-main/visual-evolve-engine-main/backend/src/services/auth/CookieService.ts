import type { CookieOptions } from 'express';
import { env } from '../../config/env.js';

export interface CookieTokenPair {
  accessToken: string;
  refreshToken: string;
}

export class CookieService {
  private readonly cookieSecret = env.cookieSecret;

  public createCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      signed: true,
      path: '/',
    };
  }

  public getSignedCookieValue(value: string): string {
    return this.cookieSecret ? `${value}` : value;
  }

  public buildTokenCookies(tokens: CookieTokenPair): Record<string, string> {
    return {
      accessToken: this.getSignedCookieValue(tokens.accessToken),
      refreshToken: this.getSignedCookieValue(tokens.refreshToken),
    };
  }
}
