import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';
import categoryRouter from './routes/category.js';
import brandRouter from './routes/brand.js';
import productRouter from './routes/product.js';
import productKeyRouter from './routes/productKey.js';
import cartRouter from './routes/cart.js';
import orderRouter from './routes/order.js';
import bannerRouter from './routes/banner.js';
import reviewRouter from './routes/review.js';
import adminUserRouter from './routes/adminUser.js';
import { connectDatabase, disconnectDatabase } from './common/database/prisma.js';

const app = express();

app.set('trust proxy', 1);
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.headers['x-request-id'] ||= uuidv4();
  next();
});
const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-request-id'],
};

app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(cookieParser(env.cookieSecret));
app.use(requestLogger);
// Temporarily disable global rate limiting for local testing.
// If needed, this can be re-enabled later with a more permissive configuration.
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     standardHeaders: true,
//     legacyHeaders: false,
//   }),
// );

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'webbankeybanquyen-backend' });
});

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin/upload', uploadRouter);
app.use('/api/admin', adminUserRouter);
app.use('/api', categoryRouter);
app.use('/api', brandRouter);
app.use('/api', productRouter);
app.use('/api', productKeyRouter);
app.use('/api', cartRouter);
app.use('/api', orderRouter);
app.use('/api', bannerRouter);
app.use('/api', reviewRouter);
app.use(
  '/uploads',
  express.static('uploads', {
    maxAge: '30d',
    immutable: true,
  }),
);
app.use(errorHandler);

const startServer = async () => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Backend foundation running on port ${env.port}`);
  });
};

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

void startServer();
