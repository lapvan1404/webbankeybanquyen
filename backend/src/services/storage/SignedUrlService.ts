import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../errors/HttpError.js';
import { R2Client } from './R2Client.js';

export class SignedUrlService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly r2Client: R2Client,
  ) {}

  public async getSignedUrl(
    id: string,
    requestingUserId?: string,
    requestingRole?: string,
  ): Promise<string> {
    const record = await this.prisma.uploadedfile.findUnique({ where: { id } });
    if (!record) {
      throw new HttpError(404, 'File not found.');
    }

    const normalizedRole = requestingRole?.toUpperCase();
    const isAdmin = normalizedRole === 'ADMIN';
    const isOwner = record.uploadedById === requestingUserId;

    if (!isAdmin && !isOwner) {
      throw new HttpError(403, 'Forbidden.');
    }

    return this.r2Client.createSignedUrl(record.bucket, record.objectKey);
  }
}
