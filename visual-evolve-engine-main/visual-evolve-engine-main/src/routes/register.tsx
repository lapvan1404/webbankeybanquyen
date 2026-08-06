import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { RequireGuest } from "@/components/auth-guard";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Đăng ký — Công Ty TNHH Công Nghệ Nam Nguyễn" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("email") || "";
    } catch {
      return "";
    }
  }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [user, navigate, loading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirm) {
      setError("Mật khẩu xác nhận chưa khớp");
      return;
    }

    setError("");

    try {
      await register(name.trim(), email.trim(), password);
      navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    }
  };

  return (
    <RequireGuest>
      <Layout>
        <div className="max-w-md mx-auto px-4 lg:px-0 py-16">
          <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8">
            <h1 className="text-3xl font-semibold mb-2">Tạo tài khoản mới</h1>
            <p className="text-sm text-zinc-500 mb-6">
              Đăng ký để lưu thông tin và tiện theo dõi đơn hàng.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-zinc-700">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
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
              <label className="block text-sm font-medium text-zinc-700">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <button
                type="submit"
                className="w-full rounded-2xl bg-brand px-4 py-3 text-white font-semibold hover:bg-brand-hover transition-colors"
              >
                Đăng ký
              </button>
            </form>

            <p className="mt-6 text-sm text-zinc-500 text-center">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-semibold text-brand hover:text-brand-hover">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </Layout>
    </RequireGuest>
  );
}
