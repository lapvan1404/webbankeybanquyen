import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../common/database/prisma.js';
import { env } from '../config/env.js';
import { createResponse } from '../utils/response.js';
import { R2Client } from '../services/storage/R2Client.js';
import { UploadService } from '../services/storage/UploadService.js';
import { DeleteService } from '../services/storage/DeleteService.js';
import { SignedUrlService } from '../services/storage/SignedUrlService.js';

function extractQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export class UploadController {
  private readonly r2Client: R2Client;
  private readonly uploadService: UploadService;
  private readonly deleteService: DeleteService;
  private readonly signedUrlService: SignedUrlService;

  constructor() {
    this.r2Client = new R2Client();
    this.uploadService = new UploadService(prisma, this.r2Client);
    this.deleteService = new DeleteService(prisma, this.r2Client);
    this.signedUrlService = new SignedUrlService(prisma, this.r2Client);
  }

  public uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json(createResponse(null, 'No file was uploaded.', null));
        return;
      }

      const folder = (req.body?.folder ||
        req.query?.folder ||
        req.body?.type ||
        req.query?.type) as string | undefined;
      const result = await this.uploadService.uploadImage(req.file, req.user?.sub, folder);
      res.status(201).json(createResponse(result, 'Image uploaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public deleteImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.deleteService.deleteFile(id);
      res.status(200).json(createResponse(null, 'Image deleted successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getSignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const signedUrl = await this.signedUrlService.getSignedUrl(id, req.user?.sub, req.user?.role);
      res.status(200).json(createResponse({ signedUrl }, 'Signed URL generated.', null));
    } catch (error) {
      next(error);
    }
  };

  public getPublicObject = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const objectKey = extractQueryString(req.query.key);

      if (!objectKey || !objectKey.startsWith('uploads/')) {
        res.status(400).json(createResponse(null, 'Invalid object key.', null));
        return;
      }

      // Tạo signed URL từ R2
      const signedUrl = await this.r2Client.createSignedUrl(env.r2Bucket, objectKey);

      // Stream ảnh trực tiếp từ R2 về client (không redirect) để Vite proxy hoạt động
      const r2Res = await fetch(signedUrl);

      if (!r2Res.ok) {
        res.status(502).json(createResponse(null, 'Failed to fetch image from R2 storage.', null));
        return;
      }

      const contentType = r2Res.headers.get('content-type') ?? 'application/octet-stream';
      const contentLength = r2Res.headers.get('content-length');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1 giờ
      if (contentLength) res.setHeader('Content-Length', contentLength);

      const buffer = await r2Res.arrayBuffer();
      res.end(Buffer.from(buffer));
    } catch (error) {
      next(error);
    }
  };
}
