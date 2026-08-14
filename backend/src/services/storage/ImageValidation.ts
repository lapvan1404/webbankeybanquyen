import { extname } from 'node:path';

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.jfif',
  '.avif',
  '.svg',
]);

export interface ImageValidationResult {
  isValid: boolean;
  mimeType: string;
  extension: string;
  reason?: string;
}

export const validateImageBuffer = (
  buffer: Buffer,
  originalName = '',
  declaredMimeType?: string,
): ImageValidationResult => {
  const extension = extname(originalName).toLowerCase();
  const normalizedExtension = extension || '.jpg';

  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      mimeType: declaredMimeType ?? 'application/octet-stream',
      extension: normalizedExtension,
      reason: 'File is empty.',
    };
  }

  const header = buffer.subarray(0, 16);
  const headerText = header.toString('latin1');

  // Block executables & scripts
  if (
    (header[0] === 0x4d && header[1] === 0x5a) ||
    (header[0] === 0x7f && headerText.startsWith('\u007fELF')) ||
    headerText.startsWith('#!') ||
    headerText.includes('<?php') ||
    headerText.includes('<script')
  ) {
    return {
      isValid: false,
      mimeType: declaredMimeType ?? 'application/x-executable',
      extension: normalizedExtension,
      reason: 'Executable signatures or scripts are not allowed.',
    };
  }

  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isValid: true, mimeType: 'image/png', extension: normalizedExtension || '.png' };
  }

  // JPEG / JPG (starts with 0xFF 0xD8)
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { isValid: true, mimeType: 'image/jpeg', extension: normalizedExtension || '.jpg' };
  }

  // WEBP (RIFF...WEBP)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x47) {
    return { isValid: true, mimeType: 'image/webp', extension: normalizedExtension || '.webp' };
  }

  // GIF (GIF87a / GIF89a)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { isValid: true, mimeType: 'image/gif', extension: normalizedExtension || '.gif' };
  }

  // Fallback: If declared mime type or extension is a valid image type
  const mime = (declaredMimeType || '').toLowerCase();
  if (mime.startsWith('image/') || ALLOWED_EXTENSIONS.has(normalizedExtension)) {
    return {
      isValid: true,
      mimeType: declaredMimeType || 'image/jpeg',
      extension: normalizedExtension || '.jpg',
    };
  }

  return {
    isValid: false,
    mimeType: declaredMimeType ?? 'application/octet-stream',
    extension: normalizedExtension,
    reason: 'File signature could not be verified.',
  };
};
