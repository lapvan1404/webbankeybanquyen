import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  CategoryRecord,
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../repositories/category/CategoryRepository.js';
import { HttpError } from '../../errors/HttpError.js';

export type CategorySearchOptions = {
  keyword?: string;
  status?: boolean;
  sortBy?: 'sortOrder' | 'name' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
  sortOrder: number;
  status: boolean;
  createdAt: Date;
};

export class CategoryService {
  private readonly repository: CategoryRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new CategoryRepository(prisma);
  }

  public async list(options: CategorySearchOptions = {}) {
    const where: Record<string, unknown> = { deletedAt: null };

    if (options.keyword) {
      where.AND = [
        { deletedAt: null },
        {
          OR: [
            { name: { contains: options.keyword, mode: 'insensitive' } },
            { slug: { contains: options.keyword, mode: 'insensitive' } },
            { description: { contains: options.keyword, mode: 'insensitive' } },
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

    const categories = await this.repository.findMany({
      where,
      orderBy,
      include: { product: true },
      skip,
      take: pageSize,
    });

    const mapped = categories.map((category) => this.toDto(category));

    return {
      data: mapped,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  public async getBySlug(slug: string) {
    const category = await this.repository.findMany({
      where: { slug, deletedAt: null },
      include: { product: true },
      take: 1,
    });

    const record = category[0] ?? null;
    if (!record) {
      throw new HttpError(404, 'Category not found.', 'Category slug lookup failed');
    }

    return this.toDto(record);
  }

  public async create(input: CreateCategoryInput) {
    await this.validateUniqueNameAndSlug(input.name, input.slug);

    const record = await this.repository.create({
      ...input,
      id: randomUUID(),
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      createdAt: input.createdAt ?? new Date(),
      updatedAt: input.updatedAt ?? new Date(),
    });

    return this.toDto(record);
  }

  public async update(id: string, input: UpdateCategoryInput) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Category not found.', 'Update target missing');
    }

    if (input.name && input.name.trim() !== existing.name) {
      await this.validateUniqueNameAndSlug(input.name, existing.slug, id);
    }

    if (input.slug && input.slug.trim() !== existing.slug) {
      await this.validateUniqueNameAndSlug(existing.name, input.slug, id);
    }

    const updatePayload: UpdateCategoryInput = {
      ...input,
      name: input.name?.trim() ?? existing.name,
      slug: input.slug?.trim() ?? existing.slug,
      description: input.description ?? existing.description,
      imageUrl: input.imageUrl ?? existing.imageUrl,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: new Date(),
    };

    const record = await this.repository.update(id, updatePayload);
    return this.toDto(record);
  }

  public async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Category not found.', 'Delete target missing');
    }

    const productCount = await this.repository.countProducts(id);
    if (productCount > 0) {
      throw new HttpError(
        400,
        'Cannot delete a category that still contains products.',
        'Category has products',
      );
    }

    await this.repository.update(id, { deletedAt: new Date() });
    return { success: true };
  }

  public async updateStatus(id: string, isActive: boolean) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new HttpError(404, 'Category not found.', 'Status update target missing');
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
      throw new HttpError(409, 'Category name already exists.', 'Duplicate category name');
    }

    const existingBySlug = await this.repository.findMany({
      where: { slug: slug.trim(), deletedAt: null },
      take: 1,
    });
    if (existingBySlug.length > 0 && existingBySlug[0].id !== excludeId) {
      throw new HttpError(409, 'Category slug already exists.', 'Duplicate category slug');
    }
  }

  private toDto(category: CategoryRecord): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.imageUrl,
      productCount: category.product?.length ?? 0,
      sortOrder: category.sortOrder,
      status: category.isActive,
      createdAt: category.createdAt,
    };
  }
}
