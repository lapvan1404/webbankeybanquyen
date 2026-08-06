import type { ApiResponse } from '../types/api.js';

export const createResponse = <T>(
  data: T | null = null,
  message = '',
  errors: unknown = null,
): ApiResponse<T> => ({
  success: errors === null,
  message,
  data,
  errors,
});
