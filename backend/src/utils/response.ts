import type { ApiResponse } from '../types/api.js';

export const createResponse = <T>(
  data: T | null = null,
  message = '',
  errors: unknown = null,
  successOverride?: boolean,
): ApiResponse<T> => {
  const isErr =
    errors !== null ||
    message.toLowerCase().includes('error') ||
    message.toLowerCase().includes('failed') ||
    message.toLowerCase().includes('invalid');
  return {
    success: successOverride ?? !isErr,
    message,
    data,
    errors,
  };
};
