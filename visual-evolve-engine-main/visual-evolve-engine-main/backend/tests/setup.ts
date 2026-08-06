// Test bootstrap: set env defaults for tests and connect/disconnect DB
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./tmp/test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET ?? 'test-cookie-secret';
process.env.MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY ?? 'test';
process.env.MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY ?? 'test';

import { connectDatabase, disconnectDatabase } from '../src/common/database/prisma.js';

export const setupTestDB = async () => {
  await connectDatabase();
};

export const teardownTestDB = async () => {
  await disconnectDatabase();
};
