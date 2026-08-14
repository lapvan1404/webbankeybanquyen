import type { PrismaClient } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'crypto';
import { HttpError } from '../../errors/HttpError.js';
import { UnitOfWork } from '../../common/database/unitOfWork.js';
import { CartRepository } from '../../repositories/cart/CartRepository.js';
import { ProductRepository } from '../../repositories/product/ProductRepository.js';
import {
  CreateOrderItemInput,
  OrderRepository,
  OrderRecord,
} from '../../repositories/order/OrderRepository.js';
import { ProductKeyRepository } from '../../repositories/productKey/ProductKeyRepository.js';
import { EmailService } from '../email/EmailService.js';

export type OrderItemDto = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: Date;
  items: OrderItemDto[];
};

export type LicenseKeyDto = {
  orderItemId: string;
  productId: string;
  productName: string;
  key: string;
};

export class OrderService {
  private readonly prisma: PrismaClient;
  private readonly repository: OrderRepository;
  private readonly cartRepository: CartRepository;
  private readonly productRepository: ProductRepository;
  private readonly productKeyRepository: ProductKeyRepository;
  private readonly emailService: EmailService;
  private readonly unitOfWork: UnitOfWork;
  private readonly encryptionKey: Buffer;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.repository = new OrderRepository(prisma);
    this.cartRepository = new CartRepository(prisma);
    this.productRepository = new ProductRepository(prisma);
    this.productKeyRepository = new ProductKeyRepository(prisma);
    this.emailService = new EmailService();
    this.unitOfWork = new UnitOfWork(prisma);
    this.encryptionKey = createHash('sha256')
      .update(process.env.PRODUCT_KEY_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? 'default-secret')
      .digest();
  }

  private async applyCouponDiscount(
    transaction: any,
    rawTotal: number,
    couponCode?: string,
  ): Promise<number> {
    if (!couponCode) return rawTotal;
    try {
      const setting = await transaction
        .getClient()
        .systemsetting.findUnique({ where: { key: 'coupons_list' } });
      if (!setting) return rawTotal;
      const list = JSON.parse(setting.value);
      const match = list.find(
        (c: any) => c.code.toUpperCase() === couponCode.toUpperCase() && c.active,
      );
      if (match && match.discountPercent > 0) {
        const discount = (rawTotal * match.discountPercent) / 100;
        return Math.max(0, rawTotal - discount);
      }
    } catch {
      // fallback
    }
    return rawTotal;
  }

  public async createOrder(userId: string, couponCode?: string): Promise<OrderDto> {
    if (!userId) {
      throw new HttpError(
        401,
        'Authentication required to create an order.',
        'Order creation failed',
      );
    }

    let createdOrder: OrderRecord | null = null;

    await this.unitOfWork.execute(async (transaction) => {
      const orderRepo = new OrderRepository(transaction.getClient());
      const cartRepo = new CartRepository(transaction.getClient());
      const productRepo = new ProductRepository(transaction.getClient());

      const cart = await cartRepo.findByUserIdWithItems(userId);
      if (!cart || !cart.cartitem?.length) {
        throw new HttpError(400, 'Cart is empty.', 'Order creation failed');
      }

      let totalAmount = 0;
      const orderItemsInput: Array<Omit<CreateOrderItemInput, 'id' | 'orderId'>> = [];

      for (const item of cart.cartitem) {
        const product = await productRepo.findById(item.productId);
        if (!product || product.deletedAt) {
          throw new HttpError(404, `Product not found: ${item.productId}`, 'Order creation failed');
        }
        if (product.status !== 'ACTIVE') {
          throw new HttpError(
            400,
            `Product is not active: ${product.name}`,
            'Order creation failed',
          );
        }
        if (product.stock < item.quantity) {
          throw new HttpError(
            400,
            `Insufficient stock for: ${product.name}`,
            'Order creation failed',
          );
        }

        const unitPrice = Number(product.salePrice ?? product.price);
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;

        orderItemsInput.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice,
          quantity: item.quantity,
          totalPrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const finalTotalAmount = await this.applyCouponDiscount(transaction, totalAmount, couponCode);

      const order = await orderRepo.createOrder({
        id: randomUUID(),
        orderNumber: this.generateOrderNumber(),
        userId,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        totalAmount: finalTotalAmount,
        shippingCost: 0,
        placedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      for (const itemInput of orderItemsInput) {
        await orderRepo.createOrderItem({
          ...itemInput,
          id: randomUUID(),
          orderId: order.id,
        });
      }

      await cartRepo.clearCart(cart.id);

      await transaction.getClient().notification.create({
        data: {
          id: randomUUID(),
          userId: order.userId,
          title: `Đơn hàng mới #${order.orderNumber}`,
          message: `Đơn hàng mới #${order.orderNumber}: ${orderItemsInput[0]?.productName || 'Sản phẩm'}`,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      createdOrder = await orderRepo.findByIdWithItems(order.id);
    });

    if (!createdOrder) {
      throw new HttpError(500, 'Order could not be created.', 'Order creation failed');
    }

    return this.toDto(createdOrder);
  }

  /** Creates a one-item order without reading or changing the customer's cart. */
  public async createBuyNowOrder(
    userId: string,
    productId: string,
    quantity: number,
    couponCode?: string,
  ): Promise<OrderDto> {
    if (!userId) {
      throw new HttpError(
        401,
        'Authentication required to create an order.',
        'Order creation failed',
      );
    }

    let createdOrder: OrderRecord | null = null;
    await this.unitOfWork.execute(async (transaction) => {
      const productRepo = new ProductRepository(transaction.getClient());
      const orderRepo = new OrderRepository(transaction.getClient());
      const product = await productRepo.findById(productId);

      if (!product || product.deletedAt) {
        throw new HttpError(404, 'Product not found.', 'Order creation failed');
      }
      if (product.status !== 'ACTIVE') {
        throw new HttpError(400, 'Product is not available for checkout.', 'Order creation failed');
      }

      const unitPrice = Number(product.salePrice ?? product.price);
      const rawTotal = unitPrice * quantity;
      const finalTotalAmount = await this.applyCouponDiscount(transaction, rawTotal, couponCode);

      const order = await orderRepo.createOrder({
        id: randomUUID(),
        orderNumber: this.generateOrderNumber(),
        userId,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        totalAmount: finalTotalAmount,
        shippingCost: 0,
        placedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await orderRepo.createOrderItem({
        id: randomUUID(),
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await transaction.getClient().notification.create({
        data: {
          id: randomUUID(),
          userId: order.userId,
          title: `Đơn hàng mới #${order.orderNumber}`,
          message: `Đơn hàng mới #${order.orderNumber}: ${product.name}`,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      createdOrder = await orderRepo.findByIdWithItems(order.id);
    });

    if (!createdOrder) {
      throw new HttpError(500, 'Order could not be created.', 'Order creation failed');
    }
    return this.toDto(createdOrder);
  }

  public async listUserOrders(userId: string): Promise<OrderDto[]> {
    const orders = await this.repository.findByUserId(userId);
    return orders.map((order) => this.toDto(order));
  }

  public async getUserOrder(userId: string, id: string): Promise<OrderDto> {
    const order = await this.repository.findByIdWithItems(id);
    if (!order || order.deletedAt) {
      throw new HttpError(404, 'Order not found.', 'Order lookup failed');
    }

    if (userId && order.userId && order.userId !== userId && !order.userId.startsWith('guest')) {
      throw new HttpError(404, 'Order not found.', 'Order lookup failed');
    }

    return this.toDto(order);
  }

  public async listAdminOrders(): Promise<OrderDto[]> {
    const orders = await this.repository.findAll();
    return orders.map((order) => this.toDto(order));
  }

  public async getAdminOrder(id: string): Promise<OrderDto> {
    const order = await this.repository.findByIdWithItems(id);
    if (!order || order.deletedAt) {
      throw new HttpError(404, 'Order not found.', 'Order lookup failed');
    }

    return this.toDto(order);
  }

  public async updateOrderStatus(id: string, status: string): Promise<OrderDto> {
    const normalizedStatus = this.normalizeStatus(status);
    const order = await this.repository.findByIdWithItems(id);

    if (!order || order.deletedAt) {
      throw new HttpError(404, 'Order not found.', 'Order status update failed');
    }

    const updated = await this.repository.updateOrderStatus(id, {
      status: normalizedStatus,
      updatedAt: new Date(),
    });

    return this.toDto({ ...updated, orderitem: order.orderitem ?? [] });
  }

  public async payOrder(userId: string, id: string, customerEmail?: string): Promise<OrderDto> {
    const order = await this.repository.findByIdWithItems(id);
    if (!order || order.deletedAt) {
      throw new HttpError(404, 'Order not found.', 'Payment failed');
    }

    if (userId && order.userId && order.userId !== userId && !order.userId.startsWith('guest')) {
      throw new HttpError(403, 'You are not authorized to pay this order.', 'Payment failed');
    }

    if (order.status === 'CANCELLED') {
      throw new HttpError(400, 'Cannot pay a cancelled order.', 'Payment failed');
    }

    // Customer cannot self-confirm payment as PAID. Order remains PENDING/UNPAID awaiting Admin confirmation.
    return this.toDto(order);
  }

  public async handleBankWebhook(rawContent: string): Promise<OrderDto | null> {
    try {
      const match = rawContent.match(/ORD-?[A-Za-z0-9]+-?[A-Za-z0-9]+/i);
      if (!match) return null;

      const rawCode = match[0].toUpperCase().replace(/[^A-Z0-9]/g, '');

      const orders = await this.prisma.order.findMany({
        where: { deletedAt: null, paymentStatus: 'UNPAID' },
      });

      const matchedOrder = orders.find(
        (o) =>
          o.orderNumber.toUpperCase() === match[0].toUpperCase() ||
          o.orderNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === rawCode,
      );

      if (!matchedOrder) return null;
      return this.markOrderPaidAdmin(matchedOrder.id, 'system-webhook');
    } catch (err) {
      console.error('SePay Webhook Error:', err);
      return null;
    }
  }

  public async markOrderPaidAdmin(id: string, adminId?: string): Promise<OrderDto> {
    const order = await this.repository.findByIdWithItems(id);
    if (!order || order.deletedAt) {
      throw new HttpError(404, 'Order not found.', 'Payment failed');
    }

    if (order.status === 'CANCELLED') {
      throw new HttpError(400, 'Cannot confirm a cancelled order.', 'Payment failed');
    }

    let dto: OrderDto;
    if (order.status === 'PAID' && order.paymentStatus === 'PAID') {
      dto = this.toDto(order);
    } else {
      dto = await this.processPayment(order.id);
    }

    // Record Audit Log for Admin Confirm Payment
    try {
      await this.prisma.auditlog.create({
        data: {
          id: randomUUID(),
          userId: adminId || 'admin',
          event: 'CONFIRM_PAYMENT',
          metadata: JSON.stringify({
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: Number(order.totalAmount),
            adminId: adminId || 'admin',
            previousPaymentStatus: order.paymentStatus,
            newPaymentStatus: 'PAID',
            timestamp: new Date(),
          }),
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.error('Failed to create CONFIRM_PAYMENT audit log:', err);
    }

    // Direct Website License Key Delivery (NO EMAIL SENT)
    return dto;
  }

  public async cancelOrderAdmin(id: string): Promise<OrderDto> {
    const order = await this.repository.findByIdWithItems(id);
    if (!order || order.deletedAt) {
      throw new HttpError(404, 'Order not found.', 'Order cancellation failed');
    }

    const updated = await this.repository.updateOrderPayment(id, {
      status: 'CANCELLED',
      paymentStatus: 'UNPAID',
      updatedAt: new Date(),
    });

    return this.toDto({ ...updated, orderitem: order.orderitem ?? [] });
  }

  public async getOrderLicenseKeys(userId: string, id: string): Promise<LicenseKeyDto[]> {
    const order = await this.repository.findByIdWithItems(id);
    if (!order || order.deletedAt) {
      throw new HttpError(404, 'Order not found.', 'License key lookup failed');
    }

    if (userId && order.userId && order.userId !== userId && !order.userId.startsWith('guest')) {
      throw new HttpError(
        403,
        'You are not authorized to view these license keys.',
        'License key lookup failed',
      );
    }

    if (order.status !== 'PAID' || order.paymentStatus !== 'PAID') {
      throw new HttpError(
        403,
        'Only paid orders can access license keys.',
        'License key lookup failed',
      );
    }

    const keys: LicenseKeyDto[] = [];
    for (const item of order.orderitem ?? []) {
      const productKeys = await this.productKeyRepository.findMany({
        where: { orderItemId: item.id },
      });
      const assignedKey = productKeys[0];
      if (!assignedKey) {
        continue;
      }
      keys.push({
        orderItemId: item.id,
        productId: item.productId,
        productName: item.productName,
        key: this.decryptKey(assignedKey),
      });
    }

    return keys;
  }

  public async getAdminOrderLicenseKeys(id: string): Promise<LicenseKeyDto[]> {
    const order = await this.repository.findByIdWithItems(id);
    if (!order || order.deletedAt) {
      throw new HttpError(404, 'Order not found.', 'License key lookup failed');
    }

    const keys: LicenseKeyDto[] = [];
    for (const item of order.orderitem ?? []) {
      const productKeys = await this.productKeyRepository.findMany({
        where: { orderItemId: item.id },
      });
      let assignedKey = productKeys[0];
      if (!assignedKey) {
        const rawKey = this.generateSampleKey(item.productName || item.sku);
        const encrypted = this.encryptKey(rawKey);
        assignedKey = (await this.productKeyRepository.create({
          id: randomUUID(),
          productId: item.productId,
          orderItemId: item.id,
          encryptedKey: encrypted.encryptedKey,
          keyHash: encrypted.keyHash,
          iv: encrypted.iv,
          algorithm: 'AES_256_GCM',
          status: 'SOLD',
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as any;
      }
      if (assignedKey) {
        keys.push({
          orderItemId: item.id,
          productId: item.productId,
          productName: item.productName,
          key: this.decryptKey(assignedKey),
        });
      }
    }

    return keys;
  }

  private normalizeStatus(status: string): string {
    const normalized = status.toUpperCase();
    if (['PENDING', 'PAID', 'CANCELLED'].includes(normalized)) {
      return normalized;
    }

    throw new HttpError(400, 'Invalid order status.', 'Order status update failed');
  }

  private async processPayment(orderId: string): Promise<OrderDto> {
    return this.unitOfWork.execute(async (transaction) => {
      const orderRepo = new OrderRepository(transaction.getClient());
      const productKeyRepo = new ProductKeyRepository(transaction.getClient());

      const order = await orderRepo.findByIdWithItems(orderId);
      if (!order || order.deletedAt) {
        throw new HttpError(404, 'Order not found.', 'Payment failed');
      }

      for (const item of order.orderitem ?? []) {
        // Decrease product stock and increase sold count in MySQL database
        const prod = await transaction.getClient().product.findUnique({
          where: { id: item.productId },
        });
        if (prod) {
          const currentStock = prod.stock ?? 0;
          const currentSoldCount = prod.soldCount ?? 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          const newSoldCount = currentSoldCount + item.quantity;
          await transaction.getClient().product.update({
            where: { id: item.productId },
            data: {
              stock: newStock,
              soldCount: newSoldCount,
              updatedAt: new Date(),
            },
          });
        }

        let assignedKey = await productKeyRepo.assignAvailableKey(item.productId, item.id);
        if (!assignedKey) {
          const rawKey = this.generateSampleKey(item.productName || item.sku);
          const encrypted = this.encryptKey(rawKey);
          await productKeyRepo.create({
            id: randomUUID(),
            productId: item.productId,
            orderItemId: item.id,
            encryptedKey: encrypted.encryptedKey,
            keyHash: encrypted.keyHash,
            iv: encrypted.iv,
            algorithm: 'AES_256_GCM',
            status: 'SOLD',
            assignedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      const updated = await orderRepo.updateOrderPayment(order.id, {
        status: 'PAID',
        paymentStatus: 'PAID',
        updatedAt: new Date(),
      });

      return this.toDto({ ...updated, orderitem: order.orderitem ?? [] });
    });
  }

  private generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = randomUUID().slice(0, 8).toUpperCase();
    return `ORD-${date}-${suffix}`;
  }

  private encryptKey(plainKey: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plainKey, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([encrypted, authTag]);

    return {
      encryptedKey: combined.toString('base64'),
      iv: iv.toString('hex'),
      keyHash: createHash('sha256').update(plainKey).digest('hex'),
    };
  }

  private generateSampleKey(productNameOrSku: string): string {
    const p = (productNameOrSku || '').toLowerCase();
    let prefix = 'KEY';
    if (p.includes('win') || p.includes('windows')) prefix = 'WIN11';
    else if (p.includes('office') || p.includes('365')) prefix = 'OFF365';
    else if (p.includes('eset')) prefix = 'ESET';
    else if (p.includes('kaspersky')) prefix = 'KASP';
    else if (p.includes('bkav')) prefix = 'BKAV';

    const part1 = randomUUID().slice(0, 5).toUpperCase();
    const part2 = randomUUID().slice(0, 5).toUpperCase();
    const part3 = randomUUID().slice(0, 5).toUpperCase();
    const part4 = randomUUID().slice(0, 5).toUpperCase();

    return `${prefix}-${part1}-${part2}-${part3}-${part4}`;
  }

  private decryptKey(productKey: { encryptedKey: string; iv: string }) {
    const iv = Buffer.from(productKey.iv, 'hex');
    const encryptedBuffer = Buffer.from(productKey.encryptedKey, 'base64');
    const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
    const cipherText = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString('utf8');
  }

  public async getNotifications(): Promise<any[]> {
    const list = await this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return list.map((n) => ({
      id: n.id,
      message: n.message || n.title || 'Thông báo hệ thống',
      type: 'order',
      createdAt: n.createdAt,
      read: n.read,
    }));
  }

  public async markNotificationRead(id: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  public async markAllNotificationsRead(): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
  }

  public async clearAllNotifications(): Promise<void> {
    await this.prisma.notification.deleteMany({});
  }

  private toDto(order: any): OrderDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      email: order.user?.email || (order as any).customerEmail || 'khachhang@gmail.com',
      phone: order.user?.phone || (order as any).customerPhone || '0383158080',
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      items: (order.orderitem ?? []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        totalPrice: Number(item.totalPrice),
      })),
    } as any;
  }
}
