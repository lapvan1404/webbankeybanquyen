import crypto from 'crypto';

export class RefreshTokenService {
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public rotateToken(token: string): string {
    return this.hashToken(token);
  }
}
