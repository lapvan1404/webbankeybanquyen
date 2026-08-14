import { z } from 'zod';

export const AddCartItemSchema = z.object({
  productId: z.string().uuid('productId must be a valid UUID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional().default(1),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});
