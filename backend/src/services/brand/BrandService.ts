import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  BrandRecord,
  BrandRepository,
  CreateBrandInput,
  UpdateBrandInput,
} from '../../repositories/brand/BrandRepository.js';
import { HttpError } from '../../errors/HttpError.js';

export type BrandSearchOptions = {
  keyword?: string;
  status?: boolean;
  sortBy?: 'sortOrder' | 'name' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type BrandDto = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  sortOrder: number;
  status: boolean;
  createdAt: Date;
};

export class BrandService {
  private readonly repository: BrandRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new BrandRepository(prisma);
  }

  public async list(options: BrandSearchOptions = {}) {
    const where: Record<string, unknown> = { deletedAt: null };

    if (options.keyword) {
      where.AND = [
        { deletedAt: null },
        {
          OR: [
            { name: { contains: options.keyword, mode: 'insensitive' } },
            { slug: { contains: options.keyword, mode: 'insensitive' } },
            { description: { contains: options.keyword, mode: 'insensitive' } },
            { website: { contains: options.keyword, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (options.status !== undefined) {
      where.isActive = options.status;
    }

    const orderBy = options.sortBy
      ? { [options.sortBy]: options.sortDirection ?? 'asc' }
      : ({ sortOrder: 'asc' } as Record<string, 'asc' | 'desc'>);

    const total = await this.repository.count(where);
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.max(1, options.pageSize ?? 20);
    const skip = (page - 1) * pageSize;

    const brands = await this.repository.findMany({
      where,
      orderBy,
      include: { product: true },
      skip,
      take: pageSize,
    });

    return {
      data: brands.map((brand) => this.toDto(brand)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  public async getBySlug(slug: string) {
    const brands = await this.repository.findMany({
      where: { slug, deletedAt: null },
      include: { product: true },
      take: 1,
    });

    const brand = brands[0] ?? null;
    if (!brand) {
      throw new HttpError(404, 'Brand not found.', 'Brand slug lookup failed');
    }

    return this.toDto(brand);
  }

  public async create(input: CreateBrandInput) {
    await this.validateUniqueNameAndSlug(input.name, input.slug);

    const record = await this.repository.create({
      ...input,
      id: randomUUID(),
      name: input.name.trim(),
      slug: input.slug.trim(),
      logoUrl: input.logoUrl ?? null,
      website: input.website ?? null,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      seoKeywords: input.seoKeywords ?? null,
      createdAt: input.createdAt ?? new Date(),
      updatedAt: input.updatedAt ?? new Date(),
      deletedAt: input.deletedAt ?? null,
    });

    return this.toDto(record);
  }

  public async update(id: string, input: UpdateBrandInput) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Brand not found.', 'Update target missing');
    }

    if (input.name && input.name.trim() !== existing.name) {
      await this.validateUniqueNameAndSlug(input.name, existing.slug, id);
    }

    if (input.slug && input.slug.trim() !== existing.slug) {
      await this.validateUniqueNameAndSlug(existing.name, input.slug, id);
    }

    const updatePayload: UpdateBrandInput = {
      ...input,
      name: input.name?.trim() ?? existing.name,
      slug: input.slug?.trim() ?? existing.slug,
      logoUrl: input.logoUrl === undefined ? existing.logoUrl : input.logoUrl,
      website: input.website ?? existing.website,
      description: input.description ?? existing.description,
      isActive: input.isActive ?? existing.isActive,
      seoTitle: input.seoTitle ?? existing.seoTitle,
      seoDescription: input.seoDescription ?? existing.seoDescription,
      seoKeywords: input.seoKeywords ?? existing.seoKeywords,
      updatedAt: new Date(),
    };

    const record = await this.repository.update(id, updatePayload);
    return this.toDto(record);
  }

  public async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Brand not found.', 'Delete target missing');
    }

    const productCount = await this.repository.countProducts(id);
    if (productCount > 0) {
      throw new HttpError(
        400,
        'Cannot delete a brand that still contains products.',
        'Brand has products',
      );
    }

    await this.repository.update(id, { deletedAt: new Date() });
    return { success: true };
  }

  public async updateStatus(id: string, isActive: boolean) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Brand not found.', 'Status update target missing');
    }

    const record = await this.repository.update(id, { isActive, updatedAt: new Date() });
    return this.toDto(record);
  }

  private async validateUniqueNameAndSlug(name: string, slug: string, excludeId?: string) {
    const existingByName = await this.repository.findMany({
      where: { name: name.trim(), deletedAt: null },
      take: 1,
    });
    if (existingByName.length > 0 && existingByName[0].id !== excludeId) {
      throw new HttpError(409, 'Brand name already exists.', 'Duplicate brand name');
    }

    const existingBySlug = await this.repository.findMany({
      where: { slug: slug.trim(), deletedAt: null },
      take: 1,
    });
    if (existingBySlug.length > 0 && existingBySlug[0].id !== excludeId) {
      throw new HttpError(409, 'Brand slug already exists.', 'Duplicate brand slug');
    }
  }

  private toDto(brand: BrandRecord): BrandDto {
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl,
      website: brand.website,
      description: brand.description,
      sortOrder: brand.sortOrder,
      status: brand.isActive,
      createdAt: brand.createdAt,
    };
  }
}
