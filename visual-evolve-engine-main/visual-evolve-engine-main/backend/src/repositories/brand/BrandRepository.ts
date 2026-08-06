import type { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base/BaseRepository.js';

export type BrandRecord = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  product?: { id: string }[];
};

export type CreateBrandInput = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export type UpdateBrandInput = Partial<CreateBrandInput>;

export class BrandRepository extends BaseRepository<
  BrandRecord,
  CreateBrandInput,
  UpdateBrandInput
> {
  protected readonly modelName = 'brand' as const;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  public async countProducts(brandId: string): Promise<number> {
    return this.prisma.product.count({ where: { brandId, deletedAt: null } });
  }
}
