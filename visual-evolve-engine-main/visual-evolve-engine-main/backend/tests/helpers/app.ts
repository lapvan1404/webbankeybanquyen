import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../src/config/env.js';
import { requestLogger } from '../../src/middlewares/requestLogger.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import healthRouter from '../../src/routes/health.js';
import authRouter from '../../src/routes/auth.js';
import uploadRouter from '../../src/routes/upload.js';
import categoryRouter from '../../src/routes/category.js';
import brandRouter from '../../src/routes/brand.js';
import productRouter from '../../src/routes/product.js';

export const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);
  app.use((req, _res, next) => {
    req.headers['x-request-id'] ||= uuidv4();
    next();
  });
  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser(env.cookieSecret));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(requestLogger);

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api', categoryRouter);
  app.use('/api', brandRouter);
  app.use('/api', productRouter);
  app.use(errorHandler);

  return app;
};
