import type { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base/BaseRepository.js';

export type ProductKeyRecord = {
  id: string;
  productId: string;
  orderItemId: string | null;
  encryptedKey: string;
  keyHash: string;
  iv: string;
  algorithm: string;
  keyVersion: number | null;
  status: string;
  reservedUntil: Date | null;
  assignedAt: Date | null;
  batchId: string | null;
  importedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductKeyInput = {
  id: string;
  productId: string;
  orderItemId?: string | null;
  encryptedKey: string;
  keyHash: string;
  iv: string;
  algorithm?: string;
  keyVersion?: number | null;
  status?: string;
  reservedUntil?: Date | null;
  assignedAt?: Date | null;
  batchId?: string | null;
  importedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateProductKeyInput = Partial<CreateProductKeyInput>;

export type ProductKeySearchOptions = {
  productId?: string;
  status?: string;
  batchId?: string;
  orderItemId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'assignedAt' | 'reservedUntil';
  sortDirection?: 'asc' | 'desc';
};

export class ProductKeyRepository extends BaseRepository<
  ProductKeyRecord,
  CreateProductKeyInput,
  UpdateProductKeyInput
> {
  protected readonly modelName = 'productkey' as const;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  public async findById(id: string): Promise<ProductKeyRecord | null> {
    return this.getDelegate().findUnique({ where: { id } });
  }

  public async findAvailableByProduct(productId: string) {
    return this.findMany({ where: { productId, status: 'AVAILABLE' } });
  }

  public async findReservedByProduct(productId: string) {
    return this.findMany({ where: { productId, status: 'RESERVED' } });
  }

  public async findSoldByProduct(productId: string) {
    return this.findMany({ where: { productId, status: 'SOLD' } });
  }

  public async findDisabledByProduct(productId: string) {
    return this.findMany({ where: { productId, status: 'DISABLED' } });
  }

  public async findByHash(productId: string, keyHash: string) {
    return this.getDelegate()
      .findMany({
        where: { productId, keyHash },
        take: 1,
      })
      .then((results) => results[0] ?? null);
  }

  public async countAvailable(productId: string) {
    return this.count({ productId, status: 'AVAILABLE' });
  }

  public async reserveKey(id: string, reservedUntil: Date) {
    return this.getDelegate().update({
      where: { id },
      data: { status: 'RESERVED', reservedUntil },
    });
  }

  public async releaseKey(id: string) {
    return this.getDelegate().update({
      where: { id },
      data: { status: 'AVAILABLE', reservedUntil: null },
    });
  }

  public async assignKey(id: string, orderItemId: string) {
    return this.getDelegate().update({
      where: { id },
      data: { status: 'SOLD', orderItemId, assignedAt: new Date(), reservedUntil: null },
    });
  }

  public async assignAvailableKey(productId: string, orderItemId: string) {
    const candidate = await this.prisma.productkey.findFirst({
      where: { productId, status: 'AVAILABLE', orderItemId: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!candidate) {
      return null;
    }

    const result = await this.prisma.productkey.updateMany({
      where: { id: candidate.id, status: 'AVAILABLE', orderItemId: null },
      data: { status: 'SOLD', orderItemId, assignedAt: new Date(), reservedUntil: null },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.productkey.findFirst({ where: { orderItemId } });
  }

  public async disableKey(id: string) {
    return this.getDelegate().update({
      where: { id },
      data: { status: 'DISABLED' },
    });
  }

  public async search(options: ProductKeySearchOptions = {}) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.max(1, options.pageSize ?? 20);
    const orderBy = options.sortBy
      ? { [options.sortBy]: options.sortDirection ?? 'asc' }
      : ({ createdAt: 'desc' } as Record<string, 'asc' | 'desc'>);

    const where: Record<string, unknown> = {};
    if (options.productId) where.productId = options.productId;
    if (options.status) where.status = options.status;
    if (options.batchId) where.batchId = options.batchId;
    if (options.orderItemId) where.orderItemId = options.orderItemId;

    const data = await this.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
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
}
