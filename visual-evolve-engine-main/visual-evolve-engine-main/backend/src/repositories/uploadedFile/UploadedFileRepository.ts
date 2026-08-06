import type { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base/BaseRepository.js';

export type UploadedFileRecord = {
  id: string;
  originalName: string | null;
  fileName: string;
  mimeType: string;
  size: number;
  bucket: string | null;
  objectKey: string | null;
  url: string;
  uploadedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateUploadedFileInput = {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url: string;
  uploadedById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateUploadedFileInput = Partial<CreateUploadedFileInput>;

export class UploadedFileRepository extends BaseRepository<
  UploadedFileRecord,
  CreateUploadedFileInput,
  UpdateUploadedFileInput
> {
  protected readonly modelName = 'uploadedfile' as const;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }
}
