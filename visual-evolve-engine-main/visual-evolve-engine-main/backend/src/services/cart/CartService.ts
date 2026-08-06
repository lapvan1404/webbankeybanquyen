import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { HttpError } from '../../errors/HttpError.js';
import { UnitOfWork } from '../../common/database/unitOfWork.js';
import {
  CartRepository,
  CartRecord,
  CartItemRecord,
  CreateCartItemInput,
} from '../../repositories/cart/CartRepository.js';
import { ProductRepository } from '../../repositories/product/ProductRepository.js';

export type CartItemDto = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    thumbnailUrl: string | null;
    status: string;
  };
};

export type CartDto = {
  id: string;
  userId: string;
  items: CartItemDto[];
  totalItems: number;
  subtotal: number;
  total: number;
  itemCount: number;
};

export type CartSummaryDto = {
  totalItems: number;
  subtotal: number;
  total: number;
  itemCount: number;
};

export class CartService {
  private readonly repository: CartRepository;
  private readonly productRepository: ProductRepository;
  private readonly unitOfWork: UnitOfWork;

  constructor(prisma: PrismaClient) {
    this.repository = new CartRepository(prisma);
    this.productRepository = new ProductRepository(prisma);
    this.unitOfWork = new UnitOfWork(prisma);
  }

  public async getCart(userId: string): Promise<CartDto> {
    const cart = await this.getOrCreateCartWithItems(userId);
    return this.toDto(cart);
  }

  public async getSummary(userId: string): Promise<CartSummaryDto> {
    const cart = await this.getOrCreateCartWithItems(userId);
    return this.toSummary(cart);
  }

  public async addItem(userId: string, productId: string, quantity: number) {
    if (quantity < 1) {
      throw new HttpError(400, 'Quantity must be at least 1.', 'Invalid quantity');
    }

    const product = await this.getValidProduct(productId);
    const cart = await this.getOrCreateCart(userId);
    const price = Number(product.price);

    await this.unitOfWork.execute(async (transaction) => {
      const repo = new CartRepository(transaction.getClient());
      const existingItem = await repo.getCartItemByProduct(cart.id, productId);
      if (existingItem) {
        await repo.updateCartItem(existingItem.id, {
          quantity: existingItem.quantity + quantity,
          price,
          updatedAt: new Date(),
        });
        return;
      }

      const item: CreateCartItemInput = {
        id: randomUUID(),
        cartId: cart.id,
        productId,
        quantity,
        price,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await repo.createCartItem(item);
    });

    return this.getCart(userId);
  }

  public async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    if (quantity < 1) {
      throw new HttpError(400, 'Quantity must be at least 1.', 'Invalid quantity');
    }

    const cart = await this.getOrCreateCart(userId);
    const item = await this.repository.getCartItemById(itemId);
    if (!item || item.cartId !== cart.id) {
      throw new HttpError(404, 'Cart item not found.', 'Cart item lookup failed');
    }

    await this.getValidProduct(item.productId);

    await this.repository.updateCartItem(itemId, {
      quantity,
      updatedAt: new Date(),
    });

    return this.getCart(userId);
  }

  public async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.repository.getCartItemById(itemId);
    if (!item || item.cartId !== cart.id) {
      throw new HttpError(404, 'Cart item not found.', 'Cart item lookup failed');
    }

    await this.repository.deleteCartItem(itemId);
    return this.getCart(userId);
  }

  public async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.repository.clearCart(cart.id);
    return { success: true };
  }

  private async getValidProduct(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product || product.deletedAt) {
      throw new HttpError(404, 'Product not found.', 'Product lookup failed');
    }

    if (product.status !== 'ACTIVE') {
      throw new HttpError(400, 'Product is not available for cart operations.', 'Product inactive');
    }

    return product;
  }

  private async getOrCreateCart(userId: string) {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    return this.repository.createCart({
      id: randomUUID(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private async getOrCreateCartWithItems(userId: string) {
    const existing = await this.repository.findByUserIdWithItems(userId);
    if (existing) {
      return existing;
    }

    return this.repository.createCart({
      id: randomUUID(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private toSummary(cart: CartRecord): CartSummaryDto {
    const items = cart.cartitem ?? [];
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    return {
      totalItems,
      subtotal,
      total: subtotal,
      itemCount: items.length,
    };
  }

  private toDto(cart: CartRecord): CartDto {
    const items: CartItemDto[] = (cart.cartitem ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        id: item.product?.id ?? item.productId,
        name: item.product?.name ?? '',
        slug: item.product?.slug ?? '',
        price: Number(item.product?.price ?? item.price),
        thumbnailUrl: item.product?.thumbnailUrl ?? null,
        status: item.product?.status ?? 'ACTIVE',
      },
    }));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      totalItems,
      subtotal,
      total: subtotal,
      itemCount: items.length,
    };
  }
}
