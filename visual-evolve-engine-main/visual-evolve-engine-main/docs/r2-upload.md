# Cloudflare R2 Upload Module

## Overview
This module adds a reusable image upload foundation for the backend using Cloudflare R2. It is intentionally scoped to storage and upload infrastructure only; product APIs remain out of scope.

## What is implemented
- Cloudflare R2 client with upload, delete, and signed URL support
- Image validation for common image formats and executable-file rejection
- Upload endpoint for authenticated users
- Delete endpoint restricted to administrators
- Signed URL endpoint for generated object access
- Database-backed metadata persistence for uploaded files

## Environment variables
- R2_ACCOUNT_ID
- R2_ACCESS_KEY
- R2_SECRET_KEY
- R2_BUCKET
- R2_ENDPOINT
- MAX_UPLOAD_SIZE_BYTES

## API endpoints
- POST /api/upload/image
- DELETE /api/upload/:id
- GET /api/upload/:id/url

## Security notes
- Only authenticated users can upload.
- Only ADMIN users can delete.
- File names are generated on the server and client filenames are not trusted.
- MIME types and file signatures are validated before upload.
