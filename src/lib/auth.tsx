import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authClient } from "./authClient";
import type { AuthUser } from "./auth.types";

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    authClient
      .fetchProfile()
      .then((profile) => {
        if (!mounted) return;
        setUser(profile);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const authUser = await authClient.login({ email, password });
      setUser(authUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const authUser = await authClient.register({ name, email, password });
      setUser(authUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await authClient.logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng xuất thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthCtx = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
