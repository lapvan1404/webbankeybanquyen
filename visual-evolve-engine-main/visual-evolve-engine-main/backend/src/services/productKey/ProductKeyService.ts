import type { PrismaClient } from '@prisma/client';
import { createCipheriv, createHash, randomBytes, randomUUID } from 'crypto';
import { HttpError } from '../../errors/HttpError.js';
import { UnitOfWork } from '../../common/database/unitOfWork.js';
import {
  ProductKeyRepository,
  CreateProductKeyInput,
  ProductKeySearchOptions,
} from '../../repositories/productKey/ProductKeyRepository.js';
import { ProductRepository as ProductEntityRepository } from '../../repositories/product/ProductRepository.js';

export type ProductKeyImportResult = {
  created: number;
  skipped: number;
  batchId: string | null;
};

export class ProductKeyService {
  private readonly repository: ProductKeyRepository;
  private readonly productRepository: ProductEntityRepository;
  private readonly unitOfWork: UnitOfWork;
  private readonly encryptionKey: Buffer;

  constructor(prisma: PrismaClient) {
    this.repository = new ProductKeyRepository(prisma);
    this.productRepository = new ProductEntityRepository(prisma);
    this.unitOfWork = new UnitOfWork(prisma);
    this.encryptionKey = createHash('sha256')
      .update(process.env.PRODUCT_KEY_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? 'default-secret')
      .digest();
  }

  public async getById(id: string) {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new HttpError(404, 'Product key not found.', 'Product key lookup failed');
    }
    return record;
  }

  public async search(options: ProductKeySearchOptions) {
    return this.repository.search(options);
  }

  public async createKey(productId: string, key: string, batchId?: string | null) {
    await this.validateProductExists(productId);

    const keyHash = this.createKeyHash(key);
    const existing = await this.repository.findByHash(productId, keyHash);
    if (existing) {
      throw new HttpError(
        409,
        'A product key with this value already exists.',
        'Duplicate product key',
      );
    }

    const { encryptedKey, iv } = this.encryptKey(key);
    const payload: CreateProductKeyInput = {
      id: randomUUID(),
      productId,
      orderItemId: null,
      encryptedKey,
      keyHash,
      iv,
      algorithm: 'AES_256_GCM',
      keyVersion: 1,
      status: 'AVAILABLE',
      reservedUntil: null,
      assignedAt: null,
      batchId: batchId ?? null,
      importedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.repository.create(payload);
  }

  public async updateKey(id: string, input: Partial<CreateProductKeyInput>) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new HttpError(404, 'Product key not found.', 'Update failed');
    }
    return this.repository.update(id, {
      ...input,
      updatedAt: new Date(),
    });
  }

  public async deleteKey(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new HttpError(404, 'Product key not found.', 'Delete failed');
    }
    await this.repository.delete(id);
    return { success: true };
  }

  public async countAvailable(productId: string) {
    await this.validateProductExists(productId);
    return this.repository.countAvailable(productId);
  }

  public async reserveKey(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new HttpError(404, 'Product key not found.', 'Reserve failed');
    }
    if (existing.status !== 'AVAILABLE') {
      throw new HttpError(400, 'Only available keys can be reserved.', 'Invalid reserve');
    }

    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000);
    return this.repository.reserveKey(id, reservedUntil);
  }

  public async releaseKey(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new HttpError(404, 'Product key not found.', 'Release failed');
    }
    if (existing.status !== 'RESERVED') {
      throw new HttpError(400, 'Only reserved keys can be released.', 'Invalid release');
    }

    return this.repository.releaseKey(id);
  }

  public async assignKey(id: string, orderItemId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new HttpError(404, 'Product key not found.', 'Assign failed');
    }
    if (existing.status === 'SOLD') {
      throw new HttpError(400, 'A sold key cannot be assigned again.', 'Invalid assignment');
    }
    if (existing.status === 'DISABLED') {
      throw new HttpError(400, 'A disabled key cannot be assigned.', 'Invalid assignment');
    }

    return this.repository.assignKey(id, orderItemId);
  }

  public async importTxt(productId: string, content: Buffer, batchId?: string | null) {
    const keys = this.parseTxt(content.toString('utf8'));
    return this.importKeys(productId, keys, batchId);
  }

  public async importCsv(productId: string, content: Buffer, batchId?: string | null) {
    const keys = this.parseCsv(content.toString('utf8'));
    return this.importKeys(productId, keys, batchId);
  }

  private async importKeys(productId: string, keys: string[], batchId?: string | null) {
    await this.validateProductExists(productId);

    const uniqueKeys = new Map<string, string>();
    for (const key of keys) {
      const trimmed = key.trim();
      if (!trimmed) {
        continue;
      }
      const hash = this.createKeyHash(trimmed);
      if (!uniqueKeys.has(hash)) {
        uniqueKeys.set(hash, trimmed);
      }
    }

    if (uniqueKeys.size === 0) {
      throw new HttpError(400, 'No valid product keys found in the uploaded file.', 'Empty import');
    }

    const hashes = Array.from(uniqueKeys.keys());
    const now = new Date();
    const created = await this.unitOfWork.execute(async (transaction) => {
      const repo = new ProductKeyRepository(transaction.getClient());
      const existing = await repo.findMany({
        where: { productId, keyHash: { in: hashes } },
      });
      const existingHashes = new Set(existing.map((record) => record.keyHash));

      const itemsToCreate: CreateProductKeyInput[] = [];
      for (const [hash, key] of uniqueKeys.entries()) {
        if (existingHashes.has(hash)) {
          continue;
        }
        const { encryptedKey, iv } = this.encryptKey(key);
        itemsToCreate.push({
          id: randomUUID(),
          productId,
          orderItemId: null,
          encryptedKey,
          keyHash: hash,
          iv,
          algorithm: 'AES_256_GCM',
          keyVersion: 1,
          status: 'AVAILABLE',
          reservedUntil: null,
          assignedAt: null,
          batchId: batchId ?? null,
          importedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }

      await Promise.all(itemsToCreate.map((payload) => repo.create(payload)));
      return itemsToCreate.length;
    });

    return {
      created,
      skipped: uniqueKeys.size - created,
      batchId: batchId ?? null,
    };
  }

  private async validateProductExists(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new HttpError(404, 'Product not found.', 'Product validation failed');
    }
  }

  private createKeyHash(key: string) {
    return createHash('sha256').update(key).digest('hex');
  }

  private encryptKey(key: string) {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      encryptedKey: Buffer.concat([encrypted, authTag]).toString('base64'),
      iv: iv.toString('hex'),
    };
  }

  private parseTxt(payload: string) {
    return payload
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  private parseCsv(payload: string) {
    return payload
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.split(',')[0].trim())
      .filter((entry) => entry.length > 0);
  }
}
