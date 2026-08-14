import type { AuthApiClient } from "./auth.types";
import { apiFetch, apiPost } from "./apiClient";

type BackendUser = {
  id: string;
  email: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

const toUser = (user: BackendUser) => ({
  id: user.id,
  email: user.email,
  name: user.fullName ?? ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email),
});

export const authClient: AuthApiClient = {
  async login(credentials) {
    const res = await apiPost<any>("/api/auth/login", credentials, {
      credentials: "include",
    });
    const userData = res?.user || res;
    const token = res?.tokens?.accessToken || res?.accessToken;
    if (token && typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    return toUser(userData);
  },
  async register(payload) {
    const res = await apiPost<any>(
      "/api/auth/register",
      { fullName: payload.name, email: payload.email, password: payload.password },
      { credentials: "include" },
    );
    const userData = res?.user || res;
    const token = res?.tokens?.accessToken || res?.accessToken;
    if (token && typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    return toUser(userData);
  },
  async logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
    }
    try {
      await apiPost("/api/auth/logout", {}, { credentials: "include" });
    } catch {
      // ignore
    }
  },
  async fetchProfile() {
    try {
      const res = await apiFetch<any>("/api/auth/me", {
        credentials: "include",
        retries: 0,
      });
      const userData = res?.user || res;
      return toUser(userData);
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
      }
      return null;
    }
  },
};
