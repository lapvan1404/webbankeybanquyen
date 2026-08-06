import { z } from 'zod';

// Common limits
const NAME_MAX = 200;
const DESCRIPTION_MAX = 5000;
const SKU_MIN = 3;
const SKU_MAX = 64;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateProductSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(SKU_MIN, `SKU must be at least ${SKU_MIN} characters`)
      .max(SKU_MAX, `SKU must be at most ${SKU_MAX} characters`),
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required')
      .regex(SLUG_REGEX, 'Slug must be lowercase letters, numbers and hyphens only'),
    shortDescription: z
      .string()
      .trim()
      .max(512, 'Short description is too long')
      .optional()
      .nullable(),
    description: z
      .string()
      .trim()
      .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`)
      .optional()
      .nullable(),
    thumbnailUrl: z.string().trim().optional().nullable(),

    price: z.number().min(0, 'Price must be >= 0'),
    salePrice: z.number().min(0, 'Sale price must be >= 0').optional().nullable(),

    stock: z.number().int().min(0, 'Stock must be >= 0').optional(),

    categoryId: z.string().trim().optional().nullable(),
    brandId: z.string().trim().optional().nullable(),

    licenseType: z.string().trim().optional().nullable(),
    licenseDuration: z.number().int().positive().optional().nullable(),
    deviceLimit: z.number().int().positive().optional().nullable(),
    deliveryMethod: z.string().trim().optional().nullable(),

    status: z.string().trim().optional(),
    isFeatured: z.boolean().optional(),
    isDigital: z.boolean().optional(),

    seoTitle: z.string().trim().max(300, 'SEO title too long').optional().nullable(),
    seoDescription: z.string().trim().max(1000, 'SEO description too long').optional().nullable(),
    seoKeywords: z.string().trim().max(1000, 'SEO keywords too long').optional().nullable(),

    publishedAt: z.preprocess(
      (v) => (v ? new Date(v as string) : v),
      z.date().optional().nullable(),
    ),
    images: z
      .array(
        z.object({
          url: z.string().trim(),
          altText: z.string().trim().max(255).optional().nullable(),
          position: z.number().int().min(0).max(9),
        }),
      )
      .max(10, 'Maximum 10 images')
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.salePrice !== undefined && val.salePrice !== null) {
      if (val.salePrice > val.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sale price cannot exceed price',
          path: ['salePrice'],
        });
      }
    }
  });

export const UpdateProductSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(SKU_MIN, `SKU must be at least ${SKU_MIN} characters`)
      .max(SKU_MAX, `SKU must be at most ${SKU_MAX} characters`)
      .optional(),
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`)
      .optional(),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required')
      .regex(SLUG_REGEX, 'Slug must be lowercase letters, numbers and hyphens only')
      .optional(),
    shortDescription: z
      .string()
      .trim()
      .max(512, 'Short description is too long')
      .optional()
      .nullable(),
    description: z
      .string()
      .trim()
      .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`)
      .optional()
      .nullable(),
    thumbnailUrl: z.string().trim().optional().nullable(),

    price: z.number().min(0, 'Price must be >= 0').optional(),
    salePrice: z.number().min(0, 'Sale price must be >= 0').optional().nullable(),

    stock: z.number().int().min(0, 'Stock must be >= 0').optional(),

    categoryId: z.string().trim().optional().nullable(),
    brandId: z.string().trim().optional().nullable(),

    licenseType: z.string().trim().optional().nullable(),
    licenseDuration: z.number().int().positive().optional().nullable(),
    deviceLimit: z.number().int().positive().optional().nullable(),
    deliveryMethod: z.string().trim().optional().nullable(),

    status: z.string().trim().optional(),
    isFeatured: z.boolean().optional(),
    isDigital: z.boolean().optional(),

    seoTitle: z.string().trim().max(300, 'SEO title too long').optional().nullable(),
    seoDescription: z.string().trim().max(1000, 'SEO description too long').optional().nullable(),
    seoKeywords: z.string().trim().max(1000, 'SEO keywords too long').optional().nullable(),

    publishedAt: z.preprocess(
      (v) => (v ? new Date(v as string) : v),
      z.date().optional().nullable(),
    ),
    images: z
      .array(
        z.object({
          url: z.string().trim(),
          altText: z.string().trim().max(255).optional().nullable(),
          position: z.number().int().min(0).max(3),
        }),
      )
      .max(4, 'Maximum 4 images')
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.salePrice !== undefined &&
      val.salePrice !== null &&
      val.price !== undefined &&
      val.price !== null
    ) {
      if (val.salePrice > val.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sale price cannot exceed price',
          path: ['salePrice'],
        });
      }
    }
  });

export const ProductSearchSchema = z
  .object({
    keyword: z.string().trim().max(200, 'Keyword is too long').optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(200).optional(),
    categoryId: z.string().trim().optional(),
    brandId: z.string().trim().optional(),
    licenseType: z.string().trim().optional(),
    status: z.string().trim().optional(),
    isFeatured: z.preprocess((v) => {
      if (v === 'true' || v === true) return true;
      if (v === 'false' || v === false) return false;
      return v;
    }, z.boolean().optional()),
    sort: z.enum(['price', 'name', 'createdAt', 'soldCount', 'viewCount']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    priceMin: z.number().min(0).optional(),
    priceMax: z.number().min(0).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.priceMin !== undefined && val.priceMax !== undefined) {
      if (val.priceMax < val.priceMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'priceMax must be greater than or equal to priceMin',
          path: ['priceMax'],
        });
      }
    }
  });

export const ProductStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED']),
});
