import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { RequireGuest } from "@/components/auth-guard";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Đăng nhập — Công Ty TNHH Công Nghệ Nam Nguyễn" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      // If login was initiated with a directBuy query, forward it to checkout
      try {
        const qs = typeof window !== "undefined" ? window.location.search : "";
        const params = new URLSearchParams(qs);
        if (params.has("redirect")) {
          window.location.href = params.get("redirect") || "/";
          return;
        }
        if (params.has("buyNowProductId")) {
          navigate({
            to: "/checkout",
            search: {
              buyNowProductId: params.get("buyNowProductId") ?? "",
              buyNowQuantity: params.get("buyNowQuantity") ?? "1",
            },
          });
          return;
        }
      } catch (e) {
        // ignore
      }
      navigate({ to: "/" });
    }
  }, [user, navigate, loading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await login(email.trim(), password);
      // If login was initiated with a directBuy query, forward it to checkout
      const qs = window.location.search;
      const params = new URLSearchParams(qs);
      if (params.has("redirect")) {
        window.location.href = params.get("redirect") || "/";
        return;
      }
      if (params.has("buyNowProductId")) {
        navigate({
          to: "/checkout",
          search: {
            buyNowProductId: params.get("buyNowProductId") ?? "",
            buyNowQuantity: params.get("buyNowQuantity") ?? "1",
          },
        });
        return;
      }
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  };

  return (
    <RequireGuest>
      <Layout>
        <div className="max-w-md mx-auto px-4 lg:px-0 py-16">
          <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8">
            <h1 className="text-3xl font-semibold mb-2">Đăng nhập</h1>
            <p className="text-sm text-zinc-500 mb-6">
              Đăng nhập để quản lý tài khoản và đơn hàng của bạn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <label className="block text-sm font-medium text-zinc-700">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <button
                type="submit"
                className="w-full rounded-2xl bg-brand px-4 py-3 text-white font-semibold hover:bg-brand-hover transition-colors"
              >
                Đăng nhập
              </button>
            </form>
            <p className="mt-6 text-sm text-zinc-500 text-center">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-semibold text-brand hover:text-brand-hover">
                Đăng ký ngay
              </Link>
            </p>

            {/* Admin login removed from public UI */}
          </div>
        </div>
      </Layout>
    </RequireGuest>
  );
}
