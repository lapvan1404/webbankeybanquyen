# Image Manager (Admin Panel)

## Purpose

Image Manager provides a unified image workflow for admin modules using the existing Cloudflare R2 upload API:

- Product (up to 4 images)
- Category (1 image)
- Brand (1 logo)
- Banner (1 image)

No new upload service was introduced. Uploading and deletion reuse existing endpoints:

- `POST /api/upload/image`
- `DELETE /api/upload/:id`

## Scope and constraints

- Reuses existing authentication and authorization architecture.
- Stores only image URLs in module payloads.
- Does not store image binary in database.
- Keeps backend business logic unchanged.
- Does not change Prisma schema or migrations.

## Product image behavior

- Maximum 4 images.
- Multi-file selection supported.
- Image order is editable with move left/right controls.
- First image is treated as thumbnail/default image.
- Supports remove and replace per image.
- Save payload includes URL-only fields:
  - `thumbnailUrl`: first image URL
  - `images`: ordered URL list with position metadata

## Category/Brand/Banner behavior

- Single-image mode.
- Upload, preview, replace, delete supported.
- Save payload includes URL-only fields:
  - Category: `image`
  - Brand: `logoUrl`
  - Banner: `imageUrl`

## Upload UX behavior

- Upload progress indicator shown during upload.
- Save button disabled while upload is in progress.
- If upload fails:
  - Error toast shown.
  - Successfully uploaded images are preserved.
- Allowed upload types enforced in UI file picker and validation path:
  - `jpg`, `jpeg`, `png`, `webp`
  - `svg` is not accepted.

## Implementation files

- `src/components/admin/ImageUploader.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/components/admin/CategoryForm.tsx`
- `src/components/admin/BrandForm.tsx`
- `src/components/admin/BannerForm.tsx`

## Verification

### Build quality gates

Executed successfully:

- `npm run lint` (pass, warnings only)
- `npm run build` (pass)
- `npm run typecheck` (pass)

### Upload flow test checklist

The implementation supports the following required flows:

- Product:
  - Upload up to 4 images
  - Remove image
  - Replace image
  - Reorder image list
  - Save product with URL-only payload
- Category:
  - Upload
  - Replace
- Brand:
  - Upload
  - Replace
- Banner:
  - Upload
  - Replace

Note: This task intentionally avoids uploading real images during this implementation pass per request constraints.
