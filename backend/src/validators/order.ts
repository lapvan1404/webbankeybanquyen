import { z } from 'zod';

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']),
});

export const MockPaymentSchema = z
  .object({
    customerEmail: z.string().optional(),
  })
  .passthrough();

// An empty body retains the existing cart checkout behaviour. Supplying this
// payload creates a single-item order without reading or mutating the cart.
export const CreateOrderSchema = z
  .object({
    productId: z.string().optional(),
    quantity: z.number().int().positive().max(100).optional(),
    couponCode: z.string().optional(),
  })
  .passthrough();
