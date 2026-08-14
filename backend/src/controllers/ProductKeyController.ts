import type { NextFunction, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createResponse } from '../utils/response.js';
import { ProductKeyService } from '../services/productKey/ProductKeyService.js';
import type { ProductKeySearchOptions } from '../repositories/productKey/ProductKeyRepository.js';

export class ProductKeyController {
  private readonly service: ProductKeyService;

  constructor(prisma: PrismaClient) {
    this.service = new ProductKeyService(prisma);
  }

  public searchProductKeys = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const options = req.query as unknown as ProductKeySearchOptions;
      const result = await this.service.search(options);
      res.status(200).json(createResponse(result, 'Product keys loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getProductKeyById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const key = await this.service.getById(id);
      res.status(200).json(createResponse(key, 'Product key loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getAvailableCount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const productId = Array.isArray(req.params.productId)
        ? req.params.productId[0]
        : req.params.productId;
      const count = await this.service.countAvailable(productId);
      res
        .status(200)
        .json(createResponse({ available: count }, 'Available stock count loaded.', null));
    } catch (error) {
      next(error);
    }
  };

  public createProductKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.body as {
        productId: string;
        key: string;
        batchId?: string | null;
      };
      const key = await this.service.createKey(payload.productId, payload.key, payload.batchId);
      res.status(201).json(createResponse(key, 'Product key created successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public updateProductKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = req.body as Partial<Record<string, unknown>>;
      const key = await this.service.updateKey(
        id,
        payload as Parameters<ProductKeyService['updateKey']>[1],
      );
      res.status(200).json(createResponse(key, 'Product key updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public deleteProductKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.deleteKey(id);
      res.status(200).json(createResponse(null, 'Product key deleted successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public reserveProductKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const key = await this.service.reserveKey(id);
      res.status(200).json(createResponse(key, 'Product key reserved successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public releaseProductKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const key = await this.service.releaseKey(id);
      res.status(200).json(createResponse(key, 'Product key released successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public assignProductKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = req.body as { orderItemId: string };
      const key = await this.service.assignKey(id, payload.orderItemId);
      res.status(200).json(createResponse(key, 'Product key assigned successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public importTxt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json(createResponse(null, 'No file uploaded.', null));
        return;
      }
      const payload = req.body as { productId: string; batchId?: string | null };
      const result = await this.service.importTxt(
        payload.productId,
        req.file.buffer,
        payload.batchId,
      );
      res.status(201).json(createResponse(result, 'Product keys imported successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public importCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json(createResponse(null, 'No file uploaded.', null));
        return;
      }
      const payload = req.body as { productId: string; batchId?: string | null };
      const result = await this.service.importCsv(
        payload.productId,
        req.file.buffer,
        payload.batchId,
      );
      res.status(201).json(createResponse(result, 'Product keys imported successfully.', null));
    } catch (error) {
      next(error);
    }
  };
}
