import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../common/database/prisma.js';
import { createResponse } from '../utils/response.js';
import { CartService } from '../services/cart/CartService.js';
import type { AddCartItemSchema, UpdateCartItemSchema } from '../validators/cart.js';

export class CartController {
  private readonly service: CartService;

  constructor() {
    this.service = new CartService(prisma);
  }

  public getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const cart = await this.service.getCart(userId);
      res.status(200).json(createResponse(cart, 'Cart loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const summary = await this.service.getSummary(userId);
      res.status(200).json(createResponse(summary, 'Cart summary loaded successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const payload = req.body as z.infer<typeof AddCartItemSchema>;
      const cart = await this.service.addItem(userId, payload.productId, payload.quantity);
      res.status(201).json(createResponse(cart, 'Product added to cart successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
      const payload = req.body as z.infer<typeof UpdateCartItemSchema>;
      const cart = await this.service.updateItemQuantity(userId, itemId, payload.quantity);
      res.status(200).json(createResponse(cart, 'Cart item updated successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
      const cart = await this.service.removeItem(userId, itemId);
      res.status(200).json(createResponse(cart, 'Cart item removed successfully.', null));
    } catch (error) {
      next(error);
    }
  };

  public clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub ?? '';
      const result = await this.service.clearCart(userId);
      res.status(200).json(createResponse(result, 'Cart cleared successfully.', null));
    } catch (error) {
      next(error);
    }
  };
}
