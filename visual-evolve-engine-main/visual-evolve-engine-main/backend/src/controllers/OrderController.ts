import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createResponse } from '../utils/response.js';
import { OrderService } from '../services/order/OrderService.js';
import { CreateOrderSchema, UpdateOrderStatusSchema } from '../validators/order.js';

export class OrderController {
  private readonly service: OrderService;

  constructor(prisma: PrismaClient) {
    this.service = new OrderService(prisma);
  }

  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const payload = CreateOrderSchema.parse(req.body);
      const couponCode = (payload as any).couponCode;
      const order =
        payload.productId
          ? await this.service.createBuyNowOrder(userId, payload.productId, payload.quantity || 1, couponCode)
          : await this.service.createOrder(userId, couponCode);
      res.status(201).json(createResponse(order, 'Order created successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const orders = await this.service.listUserOrders(userId);
      res.status(200).json(createResponse(orders, 'Orders loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.service.getUserOrder(userId, id);
      res.status(200).json(createResponse(order, 'Order loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public listAdminOrders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const orders = await this.service.listAdminOrders();
      res.status(200).json(createResponse(orders, 'Orders loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getAdminOrderById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.service.getAdminOrder(id);
      res.status(200).json(createResponse(order, 'Order loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public updateOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = req.body as z.infer<typeof UpdateOrderStatusSchema>;
      const order = await this.service.updateOrderStatus(id, payload.status);
      res.status(200).json(createResponse(order, 'Order status updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public payOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { customerEmail } = req.body || {};
      const order = await this.service.payOrder(userId, id, customerEmail);
      res.status(200).json(createResponse(order, 'Order paid successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getOrderLicenseKeys = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const keys = await this.service.getOrderLicenseKeys(userId, id);
      res.status(200).json(createResponse(keys, 'License keys loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public markOrderPaidAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.service.markOrderPaidAdmin(id);
      res.status(200).json(createResponse(order, 'Order marked as paid successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public cancelOrderAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = await this.service.cancelOrderAdmin(id);
      res.status(200).json(createResponse(order, 'Order cancelled successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public handleBankWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.body;
      const content = JSON.stringify(payload);
      const order = await this.service.handleBankWebhook(content);
      if (order) {
        res.status(200).json(createResponse(order, 'Webhook processed & order paid.', null));
      } else {
        res.status(200).json(createResponse(null, 'No matching order found in webhook.', null));
      }
    } catch (error) {
      next(error);
    }
  };

  public getAdminOrderLicenseKeys = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const keys = await this.service.getAdminOrderLicenseKeys(id);
      res.status(200).json(createResponse(keys, 'Admin order license keys retrieved.', null));
    } catch (error) {
      next(error);
    }
  };

  public getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const list = await this.service.getNotifications();
      res.status(200).json(createResponse(list, 'Notifications loaded', null));
    } catch (error) {
      next(error);
    }
  };

  public markNotificationRead = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.markNotificationRead(id);
      res.status(200).json(createResponse(null, 'Notification marked read', null));
    } catch (error) {
      next(error);
    }
  };

  public markAllNotificationsRead = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.service.markAllNotificationsRead();
      res.status(200).json(createResponse(null, 'All notifications marked read', null));
    } catch (error) {
      next(error);
    }
  };

  public clearNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.service.clearAllNotifications();
      res.status(200).json(createResponse(null, 'All notifications deleted.', null));
    } catch (error) {
      next(error);
    }
  };
}
