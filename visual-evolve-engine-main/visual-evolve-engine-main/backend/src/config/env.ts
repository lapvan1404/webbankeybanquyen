import dotenv from 'dotenv';

dotenv.config();

const getEnv = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const getOptionalEnv = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  maxFailedLoginAttempts: getEnv('MAX_FAILED_LOGIN_ATTEMPTS', '5'),
  databaseUrl: getEnv('DATABASE_URL'),
  jwtSecret: getEnv('JWT_SECRET'),
  jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET'),
  cookieSecret: getEnv('COOKIE_SECRET'),
  r2AccountId: getOptionalEnv('R2_ACCOUNT_ID'),
  r2AccessKey: getOptionalEnv('R2_ACCESS_KEY'),
  r2SecretKey: getOptionalEnv('R2_SECRET_KEY'),
  r2Bucket: getOptionalEnv('R2_BUCKET'),
  r2Endpoint: getOptionalEnv('R2_ENDPOINT'),
  maxUploadSizeBytes: Number(getOptionalEnv('MAX_UPLOAD_SIZE_BYTES', String(5 * 1024 * 1024))),
  momoAccessKey: getEnv('MOMO_ACCESS_KEY'),
  momoSecretKey: getEnv('MOMO_SECRET_KEY'),
};
