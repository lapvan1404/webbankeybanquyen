# Brand Module

## Overview

The Brand module provides brand management for the storefront and admin panel. It supports listing brands, retrieving a brand by slug, and admin CRUD operations including status updates.

## Architecture

- Repository: `backend/src/repositories/brand/BrandRepository.ts`
- Service: `backend/src/services/brand/BrandService.ts`
- Controller: `backend/src/controllers/BrandController.ts`
- Routes: `backend/src/routes/brand.ts`
- Validation: `backend/src/validators/brand.ts`

## Database

Uses existing `brand` model from `backend/prisma/schema.prisma`.

- `name` must be unique
- `slug` must be unique
- `logoUrl` stores the uploaded image URL only
- Soft delete only via `deletedAt`

## Endpoints

Public:
- `GET /api/brands`
- `GET /api/brands/:slug`

Admin:
- `POST /api/admin/brands`
- `PUT /api/admin/brands/:id`
- `DELETE /api/admin/brands/:id`
- `PATCH /api/admin/brands/:id/status`

## Business Rules

- Unique brand name and slug.
- Soft delete only; brands are marked with `deletedAt`.
- Cannot delete a brand with linked products.
- Brand logo uses the Upload Module to store an image and save the returned `logoUrl`.
- Supports keyword search across `name`, `slug`, `description`, and `website`.
- Supports sorting by `sortOrder`, `name`, and `createdAt`.
- Supports pagination using `page` and `pageSize`.
