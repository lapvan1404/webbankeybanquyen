# Assets — Cloudflare R2 Image Repository

## Purpose
Local image repository structured for Cloudflare R2 upload. All images in this directory follow a consistent naming convention and are optimized for web delivery.

## Directory Structure
```
assets/
├── banners/
│   ├── home/            → Homepage hero banners
│   └── promotion/       → Promotional campaign banners
├── brands/              → Brand/manufacturer logos
├── categories/          → Category cover images
├── products/
│   ├── windows/         → Windows OS product images
│   ├── office/          → Microsoft Office product images
│   └── antivirus/       → Antivirus software product images
└── placeholders/        → Fallback images for missing assets
```

## Image Specifications Summary

| Asset Type | Resolution | Max Size | Format | Notes |
|---|---|---|---|---|
| Product | 1200 × 1200 px | 500 KB | WebP | 4 images per product; image 1 = thumbnail |
| Brand Logo | 512 × 512 px | 200 KB | WebP/PNG | Transparent background preferred |
| Category | 800 × 800 px | 300 KB | WebP | — |
| Banner | 1920 × 700 px | 1 MB | WebP | — |
| Placeholder | Matches type | Matches type | WebP | One per asset type |

## Format Policy
- **Prefer WebP** for all images.
- **PNG** is allowed only when transparency is required (e.g., brand logos).
- JPEG and other formats are **not allowed**.

## Naming Convention
- All filenames are **lowercase** with **hyphens** as separators.
- No spaces, underscores, or special characters.
- Product images use sequential numbering: `{product-slug}-{1-4}.webp`
- Banners use zero-padded numbering: `banner-home-{01-99}.webp`

## R2 Bucket Mapping
When uploaded to Cloudflare R2, the local folder structure maps directly to R2 object keys:
```
assets/products/windows/windows-11-home-1.webp
  → R2 key: products/windows/windows-11-home-1.webp

assets/banners/home/banner-home-01.webp
  → R2 key: banners/home/banner-home-01.webp
```

## Important
- Do **NOT** commit actual image binaries to Git.
- Use `.gitkeep` or this README structure to preserve folders.
- Actual images should be uploaded directly to R2 via CLI or dashboard.
