import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { apiFetch, apiPost, ApiError } from "@/lib/apiClient";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Đăng nhập — Công Ty TNHH Công Nghệ Nam Nguyễn" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/session", { credentials: "same-origin" })
      .then(() => {
        navigate({ to: "/admin" });
      })
      .catch(() => undefined);
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const res = await apiPost<{ token?: string; accessToken?: string }>("/api/admin/login", {
        email,
        password,
      });
      const token = res?.token || res?.accessToken;
      if (token) {
        localStorage.setItem("admin_token", token);
      }
      navigate({ to: "/admin" });
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Đăng nhập thất bại");
    }
  };

  return (
    <Layout hideHeaderFooter>
      <div className="max-w-md mx-auto px-4 lg:px-0 py-24">
        <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8">
          <h1 className="text-3xl font-semibold mb-3">Đăng nhập Admin</h1>
          <p className="text-sm text-zinc-500 mb-6">
            Sử dụng tài khoản admin để truy cập quản trị.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
            <label className="block text-sm font-medium text-zinc-700">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              required
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <button className="w-full rounded-2xl bg-brand px-4 py-3 text-white font-semibold hover:bg-brand-hover transition-colors">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
