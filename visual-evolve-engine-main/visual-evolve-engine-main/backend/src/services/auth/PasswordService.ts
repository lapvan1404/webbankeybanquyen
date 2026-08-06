import argon2 from 'argon2';
import { compare as bcryptCompare } from 'bcryptjs';

const bcryptHashRegex = /^\$2[aby]\$/;

export class PasswordService {
  public async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  public async verify(password: string, hash: string): Promise<boolean> {
    if (bcryptHashRegex.test(hash)) {
      return bcryptCompare(password, hash);
    }

    try {
      return await argon2.verify(hash, password);
    } catch {
      return bcryptCompare(password, hash);
    }
  }
}
