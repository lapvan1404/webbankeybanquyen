import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';
import { createResponse } from '../utils/response.js';

export const validateBody =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(null, 'Invalid request body', error.issues));
        return;
      }
      next(error);
    }
  };

export const validateParams =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as Request['params'];
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(null, 'Invalid route parameters', error.issues));
        return;
      }
      next(error);
    }
  };

export const validateQuery =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query as unknown) as Request['query'];
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(null, 'Invalid query parameters', error.issues));
        return;
      }
      next(error);
    }
  };
