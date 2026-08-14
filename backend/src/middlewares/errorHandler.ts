import type { Request, Response, NextFunction } from 'express';
import { createResponse } from '../utils/response.js';
import { HttpError } from '../errors/HttpError.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(err);

  if (err instanceof HttpError) {
    res.status(err.status).json(createResponse(null, err.safeMessage, null));
    return;
  }

  res.status(500).json(createResponse(null, 'Internal server error', null));
};
