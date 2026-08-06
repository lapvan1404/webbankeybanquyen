import { z } from 'zod';

const PRODUCT_KEY_STATUS = ['AVAILABLE', 'RESERVED', 'SOLD', 'DISABLED'] as const;

export const CreateProductKeySchema = z.object({
  productId: z.string().uuid('productId must be a valid UUID'),
  key: z.string().trim().min(1, 'Key value is required'),
  batchId: z.string().trim().optional().nullable(),
});

export const UpdateProductKeySchema = z.object({
  status: z.enum(PRODUCT_KEY_STATUS).optional(),
  batchId: z.string().trim().optional().nullable(),
  orderItemId: z.string().uuid().optional().nullable(),
  reservedUntil: z.preprocess((value) => {
    if (typeof value === 'string' && value.length > 0) {
      return new Date(value);
    }
    return value;
  }, z.date().optional().nullable()),
});

export const ProductKeySearchSchema = z.object({
  productId: z.string().uuid().optional(),
  status: z.enum(PRODUCT_KEY_STATUS).optional(),
  batchId: z.string().trim().optional(),
  page: z.preprocess((value) => {
    if (typeof value === 'string' && value.length > 0) return Number(value);
    return value;
  }, z.number().int().min(1).optional()),
  pageSize: z.preprocess((value) => {
    if (typeof value === 'string' && value.length > 0) return Number(value);
    return value;
  }, z.number().int().min(1).max(200).optional()),
  sort: z.enum(['createdAt', 'updatedAt', 'assignedAt', 'reservedUntil']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const AssignProductKeySchema = z.object({
  orderItemId: z.string().uuid('orderItemId must be a valid UUID'),
});

export const ImportProductKeySchema = z.object({
  productId: z.string().uuid('productId must be a valid UUID'),
  batchId: z.string().trim().optional().nullable(),
});
