import type { Request as ExpressRequest } from 'express';

declare module 'express' {
  interface Request {
    user?: {
      sub: string;
      role?: string;
      type: 'access' | 'refresh';
    };
  }
}

export {};
