# Product Images

## Purpose
Product gallery images. Each product must have exactly 4 images. Image 1 is used as the thumbnail.

## Specifications
| Property | Value |
|---|---|
| **Format** | WebP (preferred), PNG (if transparency needed) |
| **Resolution** | 1200 × 1200 px |
| **Max file size** | 500 KB |
| **Images per product** | Exactly 4 |
| **Thumbnail** | Image 1 (`{product-slug}-1.webp`) |

## Subfolders
| Folder | Description |
|---|---|
| `windows/` | Windows OS product images |
| `office/` | Microsoft Office product images |
| `antivirus/` | Antivirus software product images |

## Naming Convention
```
{category}/{product-slug}-{n}.webp
```
- `{category}` — product category subfolder
- `{product-slug}` — lowercase product slug with hyphens
- `{n}` — image number (1–4)

## Example File Names
```
windows/windows-11-home-1.webp
windows/windows-11-home-2.webp
windows/windows-11-home-3.webp
windows/windows-11-home-4.webp
office/office-2024-pro-1.webp
antivirus/kaspersky-standard-1.webp
```
