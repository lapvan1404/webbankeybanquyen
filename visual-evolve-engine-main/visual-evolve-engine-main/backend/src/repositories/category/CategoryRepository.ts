import type { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base/BaseRepository.js';

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  product?: { id: string }[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateCategoryInput = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export class CategoryRepository extends BaseRepository<
  CategoryRecord,
  CreateCategoryInput,
  UpdateCategoryInput
> {
  protected readonly modelName = 'category' as const;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  public async countProducts(categoryId: string): Promise<number> {
    return this.prisma.product.count({ where: { categoryId, deletedAt: null } });
  }
}
