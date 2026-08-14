import { PrismaClient } from '@prisma/client';

export class RepositoryFactory {
  constructor(private readonly prisma: PrismaClient) {}

  public createRepository<TRepository>(
    factory: (prisma: PrismaClient) => TRepository,
  ): TRepository {
    return factory(this.prisma);
  }
}
