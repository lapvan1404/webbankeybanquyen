export type AuthUser = { id: string; name: string; email: string };

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthRegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthResult = {
  success: boolean;
  message: string;
  user?: AuthUser;
};

export interface AuthApiClient {
  login(credentials: AuthCredentials): Promise<AuthUser>;
  register(payload: AuthRegisterPayload): Promise<AuthUser>;
  logout(): Promise<void>;
  fetchProfile(): Promise<AuthUser | null>;
}
