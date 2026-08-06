import type { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from '../base/BaseRepository.js';

export type CartItemProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | Prisma.Decimal;
  thumbnailUrl: string | null;
  status: string;
  deletedAt: Date | null;
};

export type CartItemRecord = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number | Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
  product?: CartItemProduct;
};

export type CartRecord = {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  cartitem?: CartItemRecord[];
};

export type CreateCartInput = {
  id: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CreateCartItemInput = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateCartItemInput = Partial<CreateCartItemInput>;

export class CartRepository extends BaseRepository<
  CartRecord,
  CreateCartInput,
  Partial<CreateCartInput>
> {
  protected readonly modelName = 'cart' as const;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  public async findByUserId(userId: string): Promise<CartRecord | null> {
    return this.getDelegate()
      .findMany({ where: { userId }, take: 1 })
      .then((results) => results[0] ?? null);
  }

  public async findByUserIdWithItems(userId: string): Promise<CartRecord | null> {
    return this.getDelegate()
      .findMany({
        where: { userId },
        include: {
          cartitem: {
            include: {
              product: true,
            },
          },
        },
        take: 1,
      })
      .then((results) => results[0] ?? null);
  }

  public async createCart(input: CreateCartInput): Promise<CartRecord> {
    return this.create(input);
  }

  public async getCartItemByProduct(
    cartId: string,
    productId: string,
  ): Promise<CartItemRecord | null> {
    return this.prisma.cartitem
      .findMany({ where: { cartId, productId }, take: 1 })
      .then((results) => results[0] ?? null);
  }

  public async getCartItemById(id: string): Promise<CartItemRecord | null> {
    return this.prisma.cartitem.findUnique({ where: { id } });
  }

  public async createCartItem(input: CreateCartItemInput): Promise<CartItemRecord> {
    return this.prisma.cartitem.create({ data: input as never });
  }

  public async updateCartItem(id: string, input: UpdateCartItemInput): Promise<CartItemRecord> {
    return this.prisma.cartitem.update({ where: { id }, data: input as never });
  }

  public async deleteCartItem(id: string): Promise<CartItemRecord> {
    return this.prisma.cartitem.delete({ where: { id } });
  }

  public async clearCart(cartId: string): Promise<{ count: number }> {
    return this.prisma.cartitem.deleteMany({ where: { cartId } });
  }
}
