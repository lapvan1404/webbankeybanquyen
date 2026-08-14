import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

class PrismaService {
  private static instance: PrismaService;
  private readonly client: PrismaClient;

  private constructor() {
    this.client = new PrismaClient({
      adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ''),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }

    return PrismaService.instance;
  }

  public getClient(): PrismaClient {
    return this.client;
  }

  public async connect(): Promise<void> {
    await this.client.$connect();
  }

  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  public async transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.client.$transaction(async (tx) => fn(tx as PrismaClient));
  }
}

export const prismaService = PrismaService.getInstance();
export const prisma = prismaService.getClient();

export const connectDatabase = async (): Promise<void> => prismaService.connect();
export const disconnectDatabase = async (): Promise<void> => prismaService.disconnect();
export const withTransaction = <T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> =>
  prismaService.transaction(fn);
