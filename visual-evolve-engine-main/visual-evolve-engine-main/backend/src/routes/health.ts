import express from 'express';
import type { Request, Response } from 'express';
import { createResponse } from '../utils/response.js';

const router = express.Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json(createResponse({ status: 'ok' }, 'Health check OK', null));
});

export default router;
