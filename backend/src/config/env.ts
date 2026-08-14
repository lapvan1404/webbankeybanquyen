import dotenv from 'dotenv';

dotenv.config();

const getEnv = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    return '';
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  maxFailedLoginAttempts: getEnv('MAX_FAILED_LOGIN_ATTEMPTS', '5'),
  databaseUrl: getEnv('DATABASE_URL', 'file:./dev.db'),
  jwtSecret: getEnv('JWT_SECRET', 'webbankey_super_secret_jwt_key_2026'),
  jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET', 'webbankey_super_secret_refresh_key_2026'),
  cookieSecret: getEnv('COOKIE_SECRET', 'webbankey_cookie_secret_2026'),
  r2AccountId: getEnv('R2_ACCOUNT_ID', ''),
  r2AccessKey: getEnv('R2_ACCESS_KEY', ''),
  r2SecretKey: getEnv('R2_SECRET_KEY', ''),
  r2Bucket: getEnv('R2_BUCKET', ''),
  r2Endpoint: getEnv('R2_ENDPOINT', ''),
  maxUploadSizeBytes: Number(getEnv('MAX_UPLOAD_SIZE_BYTES', String(5 * 1024 * 1024))),
  momoAccessKey: getEnv('MOMO_ACCESS_KEY', 'MOMO_ACCESS_KEY_DUMMY'),
  momoSecretKey: getEnv('MOMO_SECRET_KEY', 'MOMO_SECRET_KEY_DUMMY'),
};
