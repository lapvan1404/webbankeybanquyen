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
    const user = await apiPost<BackendUser>("/api/auth/login", credentials, {
      credentials: "include",
    });
    return toUser(user);
  },
  async register(payload) {
    const user = await apiPost<BackendUser>(
      "/api/auth/register",
      { fullName: payload.name, email: payload.email, password: payload.password },
      { credentials: "include" },
    );
    return toUser(user);
  },
  async logout() {
    await apiPost("/api/auth/logout", {}, { credentials: "include" });
  },
  async fetchProfile() {
    try {
      const user = await apiFetch<BackendUser>("/api/auth/me", {
        credentials: "include",
        retries: 0,
      });
      return toUser(user);
    } catch {
      return null;
    }
  },
};
