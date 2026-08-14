import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../common/database/prisma.js';
import { createResponse } from '../utils/response.js';
import { CategoryService } from '../services/category/CategoryService.js';
import {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
} from '../validators/category.js';

export class CategoryController {
  private readonly service: CategoryService;

  constructor() {
    this.service = new CategoryService(prisma);
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
      res.status(200).json(createResponse(result, 'Categories loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const category = await this.service.getBySlug(slug);
      res.status(200).json(createResponse(category, 'Category loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = createCategorySchema.parse(req.body);
      const category = await this.service.create({
        id: '',
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        imageUrl: payload.image,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      });
      res.status(201).json(createResponse(category, 'Category created successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = updateCategorySchema.parse(req.body);
      const category = await this.service.update(id, {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        imageUrl: payload.image,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      });
      res.status(200).json(createResponse(category, 'Category updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.delete(id);
      res.status(200).json(createResponse(null, 'Category deleted successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = updateCategoryStatusSchema.parse(req.body);
      const category = await this.service.updateStatus(id, payload.isActive);
      res.status(200).json(createResponse(category, 'Category status updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };
}
