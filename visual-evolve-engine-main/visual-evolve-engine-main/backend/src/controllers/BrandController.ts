import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../common/database/prisma.js';
import { createResponse } from '../utils/response.js';
import { BrandService } from '../services/brand/BrandService.js';
import {
  createBrandSchema,
  updateBrandSchema,
  updateBrandStatusSchema,
} from '../validators/brand.js';

export class BrandController {
  private readonly service: BrandService;

  constructor() {
    this.service = new BrandService(prisma);
  }

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options = {
        keyword: typeof req.query.keyword === 'string' ? req.query.keyword : undefined,
        status: typeof req.query.status === 'string' ? req.query.status === 'true' : undefined,
        sortBy:
          typeof req.query.sortBy === 'string'
            ? (req.query.sortBy as 'sortOrder' | 'name' | 'createdAt')
            : undefined,
        sortDirection:
          typeof req.query.sortDirection === 'string'
            ? (req.query.sortDirection as 'asc' | 'desc')
            : undefined,
        page: typeof req.query.page === 'string' ? Number(req.query.page) : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? Number(req.query.pageSize) : undefined,
      };

      const result = await this.service.list(options);
      res.status(200).json(createResponse(result, 'Brands loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const brand = await this.service.getBySlug(slug);
      res.status(200).json(createResponse(brand, 'Brand loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = createBrandSchema.parse(req.body);
      const brand = await this.service.create({
        id: '',
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        logoUrl: payload.logoUrl,
        website: payload.website,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      });

      res.status(201).json(createResponse(brand, 'Brand created successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = updateBrandSchema.parse(req.body);
      const brand = await this.service.update(id, {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        logoUrl: payload.logoUrl,
        website: payload.website,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      });

      res.status(200).json(createResponse(brand, 'Brand updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.delete(id);
      res.status(200).json(createResponse(null, 'Brand deleted successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = updateBrandStatusSchema.parse(req.body);
      const brand = await this.service.updateStatus(id, payload.isActive);
      res.status(200).json(createResponse(brand, 'Brand status updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };
}
