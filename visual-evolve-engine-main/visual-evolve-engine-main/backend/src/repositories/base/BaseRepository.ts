import { Prisma, PrismaClient } from '@prisma/client';
import {
  IRepository,
  RepositoryQueryOptions,
} from '../../common/database/interfaces/IRepository.js';

type RepositoryDelegate<TModel> = {
  findUnique(args: { where: { id: string } }): Promise<TModel | null>;
  findMany(args: Record<string, unknown>): Promise<TModel[]>;
  count(args: { where?: Record<string, unknown> }): Promise<number>;
  create(args: { data: unknown }): Promise<TModel>;
  update(args: { where: { id: string }; data: unknown }): Promise<TModel>;
  delete(args: { where: { id: string } }): Promise<TModel>;
};

export abstract class BaseRepository<TModel, TCreateInput, TUpdateInput> implements IRepository<
  TModel,
  TCreateInput,
  TUpdateInput
> {
  protected constructor(protected readonly prisma: PrismaClient) {}

  public async findById(id: string): Promise<TModel | null> {
    return this.getDelegate().findUnique({ where: { id } });
  }

  public async findMany(options: RepositoryQueryOptions = {}): Promise<TModel[]> {
    return this.getDelegate().findMany({
      where: options.where,
      orderBy: options.orderBy,
      skip: options.skip,
      take: options.take,
      include: options.include,
    });
  }

  public async create(input: TCreateInput): Promise<TModel> {
    return this.getDelegate().create({ data: input as never });
  }

  public async update(id: string, input: TUpdateInput): Promise<TModel> {
    return this.getDelegate().update({ where: { id }, data: input as never });
  }

  public async delete(id: string): Promise<TModel> {
    return this.getDelegate().delete({ where: { id } });
  }

  public async count(where: Record<string, unknown> = {}): Promise<number> {
    return this.getDelegate().count({ where });
  }

  protected paginate<TItem>(items: TItem[], page = 1, pageSize = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      data: items.slice(start, end),
      page: safePage,
      pageSize: safePageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / safePageSize)),
    };
  }

  protected sort<TItem>(items: TItem[], field: keyof TItem, direction: 'asc' | 'desc' = 'asc') {
    const sorted = [...items].sort((left, right) => {
      const leftValue = left[field] as string | number | Date | null;
      const rightValue = right[field] as string | number | Date | null;

      if (leftValue == null && rightValue == null) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;

      if (leftValue < rightValue) return direction === 'asc' ? -1 : 1;
      if (leftValue > rightValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  protected filter<TItem>(items: TItem[], criteria: Partial<TItem>) {
    return items.filter((item) => {
      return Object.entries(criteria).every(([key, value]) => {
        if (value == null) return true;
        return (item[key as keyof TItem] as unknown) === value;
      });
    });
  }

  protected abstract readonly modelName: keyof PrismaClient;

  protected getDelegate(): RepositoryDelegate<TModel> {
    return this.prisma[
      this.modelName as keyof PrismaClient
    ] as unknown as RepositoryDelegate<TModel>;
  }

  protected mapDatabaseError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const code = error.code;
      const message = error.message;
      return new Error(`Database error (${code}): ${message}`);
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return new Error(`Database error: ${error.message}`);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return new Error(`Database validation error: ${error.message}`);
    }

    return error instanceof Error ? error : new Error('Unknown database error');
  }
}
