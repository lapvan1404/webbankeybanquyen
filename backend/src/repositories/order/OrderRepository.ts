import type { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from '../base/BaseRepository.js';

export type OrderItemRecord = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number | Prisma.Decimal;
  quantity: number;
  totalPrice: number | Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | Prisma.Decimal;
  shippingCost: number | Prisma.Decimal;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  orderitem?: OrderItemRecord[];
};

export type CreateOrderInput = {
  id: string;
  orderNumber: string;
  userId: string;
  status?: string;
  paymentStatus?: string;
  totalAmount: number;
  shippingCost?: number;
  placedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export type CreateOrderItemInput = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateOrderStatusInput = {
  status: string;
  updatedAt: Date;
};

export type UpdateOrderPaymentInput = {
  status: string;
  paymentStatus: string;
  updatedAt: Date;
};

export class OrderRepository extends BaseRepository<
  OrderRecord,
  CreateOrderInput,
  UpdateOrderStatusInput
> {
  protected readonly modelName = 'order' as const;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  public async createOrder(input: CreateOrderInput): Promise<OrderRecord> {
    return this.create(input);
  }

  public async createOrderItem(input: CreateOrderItemInput): Promise<OrderItemRecord> {
    return this.prisma.orderitem.create({ data: input as never });
  }

  public async findByUserId(userId: string): Promise<OrderRecord[]> {
    return this.prisma.order.findMany({
      where: { userId, deletedAt: null },
      include: { orderitem: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<OrderRecord[]>;
  }

  public async findByIdWithItems(id: string): Promise<OrderRecord | null> {
    return this.prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: { orderitem: true },
    }) as Promise<OrderRecord | null>;
  }

  public async findAll(): Promise<OrderRecord[]> {
    return this.prisma.order.findMany({
      where: { deletedAt: null },
      include: { orderitem: true, user: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<OrderRecord[]>;
  }

  public async findByOrderNumber(orderNumber: string): Promise<OrderRecord | null> {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: { orderitem: true },
    }) as Promise<OrderRecord | null>;
  }

  public async updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<OrderRecord> {
    return this.prisma.order.update({ where: { id }, data: input as never });
  }

  public async updateOrderPayment(
    id: string,
    input: UpdateOrderPaymentInput,
  ): Promise<OrderRecord> {
    return this.prisma.order.update({ where: { id }, data: input as never });
  }
}
