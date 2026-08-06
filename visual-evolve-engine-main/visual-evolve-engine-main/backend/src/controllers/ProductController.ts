import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../common/database/prisma.js';
import { createResponse } from '../utils/response.js';
import { ProductService } from '../services/product/ProductService.js';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductSearchSchema,
  ProductStatusSchema,
} from '../validators/product.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductSearchOptions,
} from '../repositories/product/ProductRepository.js';

export class ProductController {
  private readonly service: ProductService;

  private readonly mapImages = (
    images?: Array<{ url: string; altText?: string | null; position: number }>,
  ) => images;

  constructor() {
    this.service = new ProductService(prisma);
  }

  public getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = {
        keyword: typeof req.query.keyword === 'string' ? req.query.keyword : undefined,
        page: typeof req.query.page === 'string' ? Number(req.query.page) : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? Number(req.query.pageSize) : undefined,
        categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
        brandId: typeof req.query.brandId === 'string' ? req.query.brandId : undefined,
        licenseType: typeof req.query.licenseType === 'string' ? req.query.licenseType : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        isFeatured:
          typeof req.query.isFeatured === 'string' ? req.query.isFeatured === 'true' : undefined,
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        order:
          typeof req.query.order === 'string' ? (req.query.order as 'asc' | 'desc') : undefined,
        priceMin: typeof req.query.priceMin === 'string' ? Number(req.query.priceMin) : undefined,
        priceMax: typeof req.query.priceMax === 'string' ? Number(req.query.priceMax) : undefined,
      };

      const options = ProductSearchSchema.parse(raw);

      const searchOptions: ProductSearchOptions = {
        keyword: options.keyword,
        page: options.page,
        pageSize: options.pageSize,
        categoryId: options.categoryId,
        brandId: options.brandId,
        licenseType: options.licenseType,
        status: options.status,
        isFeatured: options.isFeatured,
        sortBy: options.sort as ProductSearchOptions['sortBy'],
        sortDirection: options.order as ProductSearchOptions['sortDirection'],
        minPrice: options.priceMin,
        maxPrice: options.priceMax,
      };

      const result = await this.service.search(searchOptions);
      res.status(200).json(createResponse(result, 'Products loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getProductBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const product = await this.service.getBySlug(slug);
      res.status(200).json(createResponse(product, 'Product loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getProductById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const product = await this.service.getById(id);
      res.status(200).json(createResponse(product, 'Product loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getFeaturedProducts = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      const products = await this.service.getFeatured(limit ?? 10);
      res
        .status(200)
        .json(createResponse(products, 'Featured products loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getRelatedProducts = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      const products = await this.service.getRelated(id, limit ?? 10);
      res.status(200).json(createResponse(products, 'Related products loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  // Admin
  public createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = CreateProductSchema.parse(req.body);

      const input: CreateProductInput & {
        images?: Array<{ url: string; altText?: string | null; position: number }>;
      } = {
        id: '',
        sku: payload.sku,
        name: payload.name,
        slug: payload.slug,
        shortDescription: payload.shortDescription,
        description: payload.description,
        thumbnailUrl: payload.thumbnailUrl,
        price: payload.price,
        salePrice: payload.salePrice ?? null,
        stock: payload.stock ?? 0,
        status: payload.status ?? 'ACTIVE',
        isFeatured: payload.isFeatured ?? false,
        isDigital: payload.isDigital ?? false,
        licenseType: payload.licenseType ?? null,
        licenseDuration: payload.licenseDuration ?? null,
        deviceLimit: payload.deviceLimit ?? null,
        deliveryMethod: payload.deliveryMethod ?? null,
        seoTitle: payload.seoTitle ?? null,
        seoDescription: payload.seoDescription ?? null,
        seoKeywords: payload.seoKeywords ?? null,
        publishedAt: payload.publishedAt ?? null,
        categoryId: payload.categoryId ?? null,
        brandId: payload.brandId ?? null,
      };

      if ('images' in payload) {
        input.images = this.mapImages(payload.images);
      }

      const product = await this.service.create(input);

      res.status(201).json(createResponse(product, 'Product created successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = UpdateProductSchema.parse(req.body);
      const product = await this.service.update(id, {
        ...(payload as UpdateProductInput),
        images: this.mapImages(payload.images),
      });
      res.status(200).json(createResponse(product, 'Product updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.delete(id);
      res.status(200).json(createResponse(null, 'Product deleted successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public updateProductStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = ProductStatusSchema.parse(req.body);
      const product = await this.service.update(id, {
        status: payload.status,
      } as UpdateProductInput);
      res.status(200).json(createResponse(product, 'Product status updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };
}
