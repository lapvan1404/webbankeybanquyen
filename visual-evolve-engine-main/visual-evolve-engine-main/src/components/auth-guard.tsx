import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

type AuthGuardProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, navigate, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-black/5 text-center">
          <p className="text-sm text-zinc-500">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireGuest({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [loading, navigate, user]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-black/5 text-center">
          <p className="text-sm text-zinc-500">Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
