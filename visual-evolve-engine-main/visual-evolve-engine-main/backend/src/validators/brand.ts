import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required'),
  slug: z.string().trim().min(1, 'Brand slug is required'),
  description: z.string().trim().optional().nullable(),
  logoUrl: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export const updateBrandStatusSchema = z.object({
  isActive: z.boolean(),
});
