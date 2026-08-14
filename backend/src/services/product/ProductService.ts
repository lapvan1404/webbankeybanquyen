import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { BrandRepository } from '../../repositories/brand/BrandRepository.js';
import { CategoryRepository } from '../../repositories/category/CategoryRepository.js';
import {
  ProductRecord,
  ProductRepository,
  CreateProductInput,
  UpdateProductInput,
  ProductSearchOptions,
} from '../../repositories/product/ProductRepository.js';
import { UnitOfWork } from '../../common/database/unitOfWork.js';
import { HttpError } from '../../errors/HttpError.js';

export type ProductDto = {
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
  images?: Array<{ id: string; url: string; altText: string | null; position: number }>;
};

export class ProductService {
  private readonly repository: ProductRepository;
  private readonly categoryRepository: CategoryRepository;
  private readonly brandRepository: BrandRepository;
  private readonly unitOfWork: UnitOfWork;

  constructor(prisma: PrismaClient) {
    this.repository = new ProductRepository(prisma);
    this.categoryRepository = new CategoryRepository(prisma);
    this.brandRepository = new BrandRepository(prisma);
    this.unitOfWork = new UnitOfWork(prisma);
  }

  public async getById(id: string) {
    const product = await this.repository.findById(id);
    if (!product || product.deletedAt) {
      throw new HttpError(404, 'Product not found.', 'Product lookup failed');
    }
    return this.toDto(product);
  }

  public async getBySlug(slug: string) {
    const product = await this.repository.findBySlug(slug);
    if (!product) {
      throw new HttpError(404, 'Product not found.', 'Product slug lookup failed');
    }
    return this.toDto(product);
  }

  public async create(
    input: CreateProductInput & {
      images?: Array<{ url: string; altText?: string | null; position: number }>;
    },
  ) {
    await this.validateUniqueSku(input.sku);
    await this.validateUniqueSlug(input.slug);
    await this.validateCategory(input.categoryId);
    await this.validateBrand(input.brandId);
    this.validatePricing(input.price, input.salePrice);
    this.validateStock(input.stock);
    this.validateLicense(input.licenseDuration, input.deviceLimit);

    const { images: _images, ...rawInput } = input;
    const productInput: CreateProductInput = {
      ...rawInput,
      id: randomUUID(),
      sku: input.sku.trim(),
      name: input.name.trim(),
      slug: input.slug.trim(),
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      price: input.price,
      salePrice: input.salePrice ?? null,
      costPrice: input.costPrice ?? null,
      stock: input.stock ?? 0,
      soldCount: input.soldCount ?? 0,
      viewCount: input.viewCount ?? 0,
      status: input.status ?? 'ACTIVE',
      isFeatured: input.isFeatured ?? false,
      isDigital: input.isDigital ?? false,
      licenseType: input.licenseType ?? null,
      licenseDuration: input.licenseDuration ?? null,
      deviceLimit: input.deviceLimit ?? null,
      deliveryMethod: input.deliveryMethod ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      seoKeywords: input.seoKeywords ?? null,
      publishedAt: input.publishedAt ?? null,
      isPublished: input.isPublished ?? false,
      categoryId: input.categoryId ?? null,
      brandId: input.brandId ?? null,
      createdAt: input.createdAt ?? new Date(),
      updatedAt: input.updatedAt ?? new Date(),
      deletedAt: input.deletedAt ?? null,
    };

    try {
      const product = await this.unitOfWork.execute(async (transaction) => {
        const repo = new ProductRepository(transaction.getClient());
        const createdProduct = await repo.create(productInput);

        if (input.images && input.images.length > 0) {
          for (const image of input.images) {
            await transaction.getClient().productimage.create({
              data: {
                id: randomUUID(),
                productId: createdProduct.id,
                url: image.url,
                altText: image.altText ?? null,
                position: image.position,
                updatedAt: new Date(),
              },
            });
          }
        }

        // Re-fetch to get the images included via repository
        const finalProduct = await repo.findById(createdProduct.id);
        return finalProduct ?? createdProduct;
      });

      return this.toDto(product);
    } catch (err: any) {
      if (err?.code === 'P2002' || String(err?.message || '').includes('P2002') || String(err?.message || '').includes('Unique constraint')) {
        throw new HttpError(
          409,
          `Mã SKU "${input.sku}" hoặc tên sản phẩm đã tồn tại trong cơ sở dữ liệu. Vui lòng đổi SKU hoặc Tên khác.`,
          'Duplicate SKU or Slug',
        );
      }
      throw err;
    }
  }

  public async update(
    id: string,
    input: UpdateProductInput & {
      images?: Array<{ url: string; altText?: string | null; position: number }>;
    },
  ) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Product not found.', 'Update target missing');
    }

    if (input.sku && input.sku.trim() !== existing.sku) {
      await this.validateUniqueSku(input.sku, id);
    }

    if (input.slug && input.slug.trim() !== existing.slug) {
      await this.validateUniqueSlug(input.slug, id);
    }

    if (input.categoryId !== undefined) {
      await this.validateCategory(input.categoryId);
    }

    if (input.brandId !== undefined) {
      await this.validateBrand(input.brandId);
    }

    this.validatePricing(input.price ?? existing.price, input.salePrice ?? existing.salePrice);
    this.validateStock(input.stock ?? existing.stock);
    this.validateLicense(
      input.licenseDuration ?? existing.licenseDuration,
      input.deviceLimit ?? existing.deviceLimit,
    );

    const { images: _imagesUp, ...rawUpdateInput } = input;
    const updatePayload: UpdateProductInput = {
      ...rawUpdateInput,
      sku: input.sku?.trim() ?? existing.sku,
      name: input.name?.trim() ?? existing.name,
      slug: input.slug?.trim() ?? existing.slug,
      shortDescription: input.shortDescription ?? existing.shortDescription,
      description: input.description ?? existing.description,
      thumbnailUrl: input.thumbnailUrl === undefined ? existing.thumbnailUrl : input.thumbnailUrl,
      price: input.price ?? existing.price,
      salePrice: input.salePrice === undefined ? existing.salePrice : input.salePrice,
      costPrice: input.costPrice === undefined ? existing.costPrice : input.costPrice,
      stock: input.stock ?? existing.stock,
      status: input.status ?? existing.status,
      isFeatured: input.isFeatured ?? existing.isFeatured,
      isDigital: input.isDigital ?? existing.isDigital,
      licenseType: input.licenseType === undefined ? existing.licenseType : input.licenseType,
      licenseDuration:
        input.licenseDuration === undefined ? existing.licenseDuration : input.licenseDuration,
      deviceLimit: input.deviceLimit === undefined ? existing.deviceLimit : input.deviceLimit,
      deliveryMethod:
        input.deliveryMethod === undefined ? existing.deliveryMethod : input.deliveryMethod,
      seoTitle: input.seoTitle === undefined ? existing.seoTitle : input.seoTitle,
      seoDescription:
        input.seoDescription === undefined ? existing.seoDescription : input.seoDescription,
      seoKeywords: input.seoKeywords === undefined ? existing.seoKeywords : input.seoKeywords,
      publishedAt: input.publishedAt === undefined ? existing.publishedAt : input.publishedAt,
      isPublished: input.isPublished === undefined ? existing.isPublished : input.isPublished,
      categoryId: input.categoryId === undefined ? existing.categoryId : input.categoryId,
      brandId: input.brandId === undefined ? existing.brandId : input.brandId,
      updatedAt: new Date(),
    };

    const product = await this.unitOfWork.execute(async (transaction) => {
      const repo = new ProductRepository(transaction.getClient());
      const updatedProduct = await repo.update(id, updatePayload);

      if (input.images !== undefined) {
        await transaction.getClient().productimage.deleteMany({
          where: { productId: id },
        });

        if (input.images && input.images.length > 0) {
          for (const image of input.images) {
            await transaction.getClient().productimage.create({
              data: {
                id: randomUUID(),
                productId: id,
                url: image.url,
                altText: image.altText ?? null,
                position: image.position,
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      const finalProduct = await repo.findById(id);
      return finalProduct ?? updatedProduct;
    });
    return this.toDto(product);
  }

  public async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Không tìm thấy sản phẩm.', 'Delete target missing');
    }

    const timeSuffix = Date.now();
    const product = await this.repository.update(id, {
      deletedAt: new Date(),
      sku: `${existing.sku}_deleted_${timeSuffix}`,
      slug: `${existing.slug}_deleted_${timeSuffix}`,
      status: 'INACTIVE',
      updatedAt: new Date(),
    });
    return this.toDto(product);
  }

  public async search(options: ProductSearchOptions) {
    const result = await this.repository.search(options);
    return {
      ...result,
      data: result.data.map((item) => this.toDto(item)),
    };
  }

  public async getFeatured(limit = 10) {
    return this.repository.findFeatured(limit).then((products) => products.map(this.toDto));
  }

  public async getNew(limit = 10) {
    return this.repository.findNew(limit).then((products) => products.map(this.toDto));
  }

  public async getRelated(productId: string, limit = 10) {
    return this.repository
      .findRelated(productId, limit)
      .then((products) => products.map(this.toDto));
  }

  public async increaseViewCount(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Product not found.', 'View count update target missing');
    }

    const product = await this.repository.update(id, {
      viewCount: existing.viewCount + 1,
      updatedAt: new Date(),
    });

    return this.toDto(product);
  }

  public async increaseSoldCount(id: string, amount = 1) {
    if (amount < 1) {
      throw new HttpError(
        400,
        'Sold count increment must be positive.',
        'Invalid sold count increment',
      );
    }

    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Product not found.', 'Sold count update target missing');
    }

    const product = await this.repository.update(id, {
      soldCount: existing.soldCount + amount,
      updatedAt: new Date(),
    });

    return this.toDto(product);
  }

  private async validateUniqueSku(sku: string, excludeId?: string) {
    const product = await this.repository.findBySku(sku.trim());
    if (product && product.id !== excludeId) {
      throw new HttpError(409, `Mã SKU "${sku.trim()}" đã tồn tại trên hệ thống.`, 'Duplicate product SKU');
    }
  }

  private async validateUniqueSlug(slug: string, excludeId?: string) {
    const product = await this.repository.findBySlug(slug.trim());
    if (product && product.id !== excludeId) {
      throw new HttpError(409, `Đường dẫn Slug "${slug.trim()}" đã tồn tại trên hệ thống.`, 'Duplicate product slug');
    }
  }

  private async validateCategory(categoryId?: string | null) {
    if (!categoryId) {
      return;
    }

    const category = await this.categoryRepository.findById(categoryId);
    if (!category || category.deletedAt) {
      throw new HttpError(400, 'Category does not exist.', 'Invalid product category');
    }
  }

  private async validateBrand(brandId?: string | null) {
    if (!brandId) {
      return;
    }

    const brand = await this.brandRepository.findById(brandId);
    if (!brand || brand.deletedAt) {
      throw new HttpError(400, 'Brand does not exist.', 'Invalid product brand');
    }
  }

  private validatePricing(price: number, salePrice: number | null | undefined) {
    if (price < 0) {
      throw new HttpError(
        400,
        'Price must be greater than or equal to zero.',
        'Invalid product price',
      );
    }

    if (salePrice !== undefined && salePrice !== null && salePrice > price) {
      throw new HttpError(400, 'Sale price cannot exceed price.', 'Invalid sale price');
    }
  }

  private validateStock(stock: number | undefined) {
    if (stock !== undefined && stock < 0) {
      throw new HttpError(
        400,
        'Stock must be greater than or equal to zero.',
        'Invalid stock quantity',
      );
    }
  }

  private validateLicense(
    licenseDuration: number | null | undefined,
    deviceLimit: number | null | undefined,
  ) {
    if (licenseDuration !== undefined && licenseDuration !== null && licenseDuration <= 0) {
      throw new HttpError(
        400,
        'License duration must be greater than zero.',
        'Invalid license duration',
      );
    }

    if (deviceLimit !== undefined && deviceLimit !== null && deviceLimit <= 0) {
      throw new HttpError(400, 'Device limit must be greater than zero.', 'Invalid device limit');
    }
  }

  private toDto(product: ProductRecord): ProductDto {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      thumbnailUrl: product.thumbnailUrl,
      price: product.price,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      stock: product.stock,
      soldCount: product.soldCount,
      viewCount: product.viewCount,
      status: product.status,
      isFeatured: product.isFeatured,
      isDigital: product.isDigital,
      licenseType: product.licenseType,
      licenseDuration: product.licenseDuration,
      deviceLimit: product.deviceLimit,
      deliveryMethod: product.deliveryMethod,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      seoKeywords: product.seoKeywords,
      publishedAt: product.publishedAt,
      isPublished: product.isPublished,
      categoryId: product.categoryId,
      brandId: product.brandId,
      createdAt: product.createdAt,
      images: product.productimage ?? [],
    };
  }
}
