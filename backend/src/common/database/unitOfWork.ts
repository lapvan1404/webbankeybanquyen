import { PrismaClient } from '@prisma/client';

export class DatabaseTransaction {
  private readonly tx: PrismaClient;

  constructor(tx: PrismaClient) {
    this.tx = tx;
  }

  public getClient(): PrismaClient {
    return this.tx;
  }
}

export class UnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  public async execute<T>(work: (transaction: DatabaseTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) =>
      work(new DatabaseTransaction(tx as PrismaClient)),
    );
  }
}
