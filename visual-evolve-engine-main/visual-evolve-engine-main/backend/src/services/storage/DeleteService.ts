import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env.js';
import { R2Client } from './R2Client.js';
import { HttpError } from '../../errors/HttpError.js';

export class DeleteService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly r2Client: R2Client,
  ) {}

  public async deleteFile(id: string): Promise<void> {
    const record = await this.prisma.uploadedfile.findUnique({ where: { id } });
    if (!record) {
      throw new HttpError(
        404,
        'Upload record not found.',
        'Attempted to delete missing upload record.',
      );
    }

    await this.r2Client.deleteObject(record.bucket ?? env.r2Bucket, record.objectKey);
    await this.prisma.uploadedfile.delete({ where: { id } });
  }
}
