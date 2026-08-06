import { JWTService } from '../../src/services/auth/JWTService.js';

export const makeAdminToken = () => {
  const svc = new JWTService();
  return svc.signAccessToken({ sub: 'test-admin', role: 'ADMIN' });
};

export const makeCustomerToken = () => {
  const svc = new JWTService();
  return svc.signAccessToken({ sub: 'test-customer', role: 'CUSTOMER' });
};
