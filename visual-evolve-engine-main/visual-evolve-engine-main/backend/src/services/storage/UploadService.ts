import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { R2Client } from './R2Client.js';
import { validateImageBuffer } from './ImageValidation.js';
import { HttpError } from '../../errors/HttpError.js';

export interface UploadResult {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url: string;
  uploadedBy: string | null;
  createdAt: Date;
}

export class UploadService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly r2Client: R2Client,
  ) {}

  public async uploadImage(
    file: Express.Multer.File,
    uploadedById?: string,
    folder?: string,
  ): Promise<UploadResult> {
    if (!file?.buffer?.length) {
      throw new HttpError(400, 'No file was provided.', 'No file buffer received during upload.');
    }

    if (file.size > env.maxUploadSizeBytes) {
      throw new HttpError(
        413,
        `File exceeds the maximum allowed size of ${env.maxUploadSizeBytes / (1024 * 1024)}MB.`,
        'Uploaded file was larger than the allowed value.',
      );
    }

    const validation = validateImageBuffer(file.buffer, file.originalname, file.mimetype);
    if (!validation.isValid) {
      throw new HttpError(
        400,
        validation.reason ?? 'Invalid image file.',
        'Image validation failed.',
      );
    }

    const folderMap: Record<string, string> = {
      banner: 'uploads/banners',
      banners: 'uploads/banners',
      hero_banner: 'uploads/banners',
      promo_banner: 'uploads/banners/promo',
      side_banner: 'uploads/banners/promo',
      featured_banner: 'uploads/banners/promo',
      'featured-banners': 'uploads/banners/promo',
      product: 'uploads/products',
      products: 'uploads/products',
      gallery: 'uploads/products/gallery',
      product_gallery: 'uploads/products/gallery',
      category: 'uploads/categories',
      categories: 'uploads/categories',
      brand: 'uploads/brands',
      brands: 'uploads/brands',
    };

    const rawFolder = folder?.toLowerCase()?.trim() || '';
    const baseFolder =
      folderMap[rawFolder] ||
      (rawFolder ? `uploads/${rawFolder.replace(/[^a-z0-9_/-]/g, '')}` : 'uploads/images');

    const extension = validation.extension || '.jpg';
    const uniqueName = `${Date.now()}-${uuidv4()}${extension}`;
    const objectKey = `${baseFolder}/${uniqueName}`;

    await this.r2Client.uploadObject({
      bucket: env.r2Bucket,
      key: objectKey,
      body: file.buffer,
      contentType: validation.mimeType,
    });

    const record = await this.prisma.uploadedfile.create({
      data: {
        id: uuidv4(),
        originalName: file.originalname,
        fileName: uniqueName,
        mimeType: validation.mimeType,
        size: file.size,
        bucket: env.r2Bucket,
        objectKey,
        url: objectKey,
        uploadedById,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const publicUrl = `/api/upload/object?key=${encodeURIComponent(record.objectKey)}`;

    return {
      id: record.id,
      originalName: record.originalName,
      fileName: record.fileName,
      mimeType: record.mimeType,
      size: record.size,
      bucket: record.bucket,
      objectKey: record.objectKey,
      url: publicUrl,
      uploadedBy: record.uploadedById,
      createdAt: record.createdAt,
    };
  }
}
