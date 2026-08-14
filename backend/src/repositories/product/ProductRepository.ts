import type { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base/BaseRepository.js';

export type ProductRecord = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  salePrice: number | null;
  costPrice: number | null;
  stock: number;
  soldCount: number;
  viewCount: number;
  status: string;
  isFeatured: boolean;
  isDigital: boolean;
  licenseType: string | null;
  licenseDuration: number | null;
  deviceLimit: number | null;
  deliveryMethod: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  publishedAt: Date | null;
  isPublished: boolean;
  categoryId: string | null;
  brandId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  productimage?: Array<{ id: string; url: string; altText: string | null; position: number }>;
};

export type CreateProductInput = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  price: number;
  salePrice?: number | null;
  costPrice?: number | null;
  stock?: number;
  soldCount?: number;
  viewCount?: number;
  status?: string;
  isFeatured?: boolean;
  isDigital?: boolean;
  licenseType?: string | null;
  licenseDuration?: number | null;
  deviceLimit?: number | null;
  deliveryMethod?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  publishedAt?: Date | null;
  isPublished?: boolean;
  categoryId?: string | null;
  brandId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type ProductSearchOptions = {
  keyword?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  licenseType?: string;
  status?: string;
  isFeatured?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'name' | 'createdAt' | 'soldCount' | 'viewCount';
  sortDirection?: 'asc' | 'desc';
};

export class ProductRepository extends BaseRepository<
  ProductRecord,
  CreateProductInput,
  UpdateProductInput
> {
  protected readonly modelName = 'product' as const;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  public async findById(id: string): Promise<ProductRecord | null> {
    return this.getDelegate()
      .findMany({
        where: { id, deletedAt: null },
        include: { productimage: { orderBy: { position: 'asc' } } },
        take: 1,
      })
      .then((results) => (results[0] as ProductRecord | undefined) ?? null);
  }

  public async findBySlug(slug: string): Promise<ProductRecord | null> {
    return this.getDelegate()
      .findMany({
        where: { slug },
        include: { productimage: { orderBy: { position: 'asc' } } },
        take: 1,
      })
      .then((results) => (results[0] as ProductRecord | undefined) ?? null);
  }

  public async findBySku(sku: string): Promise<ProductRecord | null> {
    return this.getDelegate()
      .findMany({
        where: { sku },
        take: 1,
      })
      .then((results) => results[0] ?? null);
  }

  public async search(options: ProductSearchOptions = {}) {
    const where: Record<string, unknown> = { deletedAt: null };

    if (options.keyword) {
      const kw = options.keyword.trim();
      if (kw) {
        where.OR = [
          { name: { contains: kw } },
          { slug: { contains: kw } },
          { shortDescription: { contains: kw } },
          { description: { contains: kw } },
          { categoryId: { contains: kw } },
          { brandId: { contains: kw } },
          { category: { is: { name: { contains: kw } } } },
          { category: { is: { slug: { contains: kw } } } },
          { brand: { is: { name: { contains: kw } } } },
        ];
      }
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.brandId) {
      where.brandId = options.brandId;
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      const priceFilter: Record<string, unknown> = {};
      if (options.minPrice !== undefined) {
        priceFilter.gte = options.minPrice;
      }
      if (options.maxPrice !== undefined) {
        priceFilter.lte = options.maxPrice;
      }
      where.price = priceFilter;
    }

    if (options.licenseType) {
      where.licenseType = options.licenseType;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.isFeatured !== undefined) {
      where.isFeatured = options.isFeatured;
    }

    const orderBy = options.sortBy
      ? { [options.sortBy]: options.sortDirection ?? 'asc' }
      : ({ createdAt: 'desc' } as Record<string, 'asc' | 'desc'>);

    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.max(1, options.pageSize ?? 20);
    const skip = (page - 1) * pageSize;

    const data = await this.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: { productimage: { orderBy: { position: 'asc' } } },
    });

    const total = await this.count(where);

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  public async findFeatured(limit = 10) {
    return this.findMany({
      where: { deletedAt: null, isFeatured: true, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { productimage: { orderBy: { position: 'asc' } } },
    });
  }

  public async findNew(limit = 10) {
    return this.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { productimage: { orderBy: { position: 'asc' } } },
    });
  }

  public async findRelated(productId: string, limit = 10) {
    const product = await this.findById(productId);
    if (!product || product.deletedAt) {
      return [];
    }

    const relatedWhere: Record<string, unknown> = {
      deletedAt: null,
      status: 'ACTIVE',
    };

    if (product.categoryId) {
      relatedWhere.categoryId = product.categoryId;
    }

    if (product.brandId) {
      relatedWhere.brandId = product.brandId;
    }

    const related = await this.findMany({
      where: relatedWhere,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    return related.filter((item) => item.id !== productId).slice(0, limit);
  }
}
