import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/auth-guard";
import { useQuery } from "@tanstack/react-query";
import { getLicenseKeys, listOrders } from "@/lib/storeApi";
import { money } from "@/lib/products";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Tài khoản — Công Ty TNHH Công Nghệ Nam Nguyễn" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
    enabled: Boolean(user),
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const keysQuery = useQuery({
    queryKey: ["license-keys", selectedOrderId],
    queryFn: () => getLicenseKeys(selectedOrderId ?? ""),
    enabled: Boolean(selectedOrderId),
  });

  if (loading || !user) {
    return (
      <Layout>
        <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-16 text-center">
          <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8">
            <p className="text-sm text-zinc-500">Đang tải thông tin tài khoản...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <RequireAuth>
      <Layout>
        <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-10">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
            <div>
              <span className="text-brand text-[10px] font-bold tracking-widest uppercase bg-brand/10 px-3 py-1 rounded-full">
                TÀI KHOẢN CỦA TÔI
              </span>
              <h1 className="text-3xl font-bold text-zinc-900 mt-2">Xin chào, {user.name}</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Quản lý thông tin tài khoản và xem mã Key bản quyền đã mua tại Công Ty TNHH Công
                Nghệ Nam Nguyễn.
              </p>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate({ to: "/" });
              }}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-2.5 rounded-full text-xs transition cursor-pointer self-start md:self-auto border border-red-200"
            >
              Đăng xuất tài khoản
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 ring-1 ring-black/5 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-zinc-100 pb-5">
                  <div className="size-14 rounded-2xl bg-brand text-brand-foreground flex items-center justify-center font-bold text-xl shadow-md uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base">{user.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{user.email}</p>
                    <span className="inline-block mt-2 bg-emerald-50 text-emerald-700 font-semibold text-[10px] px-2.5 py-0.5 rounded-full ring-1 ring-emerald-200">
                      ✓ Tài khoản chính thức
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="bg-zinc-50 p-4 rounded-2xl space-y-3 ring-1 ring-zinc-200/60">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        Họ và tên
                      </p>
                      <p className="font-semibold text-zinc-800 text-sm mt-0.5">{user.name}</p>
                    </div>
                    <div className="border-t border-zinc-200/60 pt-2.5">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        Địa chỉ Email
                      </p>
                      <p className="font-semibold text-zinc-800 text-sm mt-0.5 font-mono">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-brand/5 p-4 rounded-2xl space-y-1 text-brand">
                    <p className="font-bold">🔑 Hỗ trợ kích hoạt Key 24/7</p>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      Tất cả mã Key mua tại cửa hàng đều được lưu trữ vĩnh viễn trong tài khoản của
                      bạn. Đội ngũ kỹ thuật hỗ trợ cài đặt qua UltraViewer/TeamViewer 24/7.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 lg:p-8 ring-1 ring-black/5 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    <span>🛍️ Lịch sử đơn hàng của bạn</span>
                    <span className="text-xs bg-zinc-100 text-zinc-600 font-semibold px-3 py-1 rounded-full">
                      {(ordersQuery.data ?? []).length} đơn
                    </span>
                  </h2>
                </div>

                {ordersQuery.isLoading ? (
                  <div className="text-center py-12 text-zinc-400 text-sm">
                    Đang tải danh sách đơn hàng...
                  </div>
                ) : null}

                {ordersQuery.isError ? (
                  <div className="text-center py-12 text-red-500 text-sm">
                    Không thể tải lịch sử đơn hàng.
                  </div>
                ) : null}

                {!ordersQuery.isLoading &&
                !ordersQuery.isError &&
                (ordersQuery.data ?? []).length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <p className="text-4xl">🛒</p>
                    <p className="text-zinc-500 font-medium text-sm">Bạn chưa mua đơn hàng nào.</p>
                    <Link
                      to="/"
                      className="inline-block bg-brand text-brand-foreground font-semibold px-6 py-2.5 rounded-full text-xs shadow-md hover:bg-brand-hover transition"
                    >
                      Khám phá phần mềm ngay
                    </Link>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {(ordersQuery.data ?? []).map((order) => {
                    const isPaid =
                      order.status === "PAID" ||
                      order.status === "approved" ||
                      order.status === "COMPLETED";
                    const isSelected = selectedOrderId === order.id;

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-zinc-200 p-5 space-y-4 hover:border-brand/30 transition-all bg-zinc-50/50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 pb-3">
                          <div>
                            <span className="font-mono font-bold text-zinc-900 text-base">
                              #{order.orderNumber || order.id.slice(0, 8)}
                            </span>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Ngày đặt:{" "}
                              {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-brand text-base">
                              {money(Number(order.totalAmount))}
                            </span>
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : order.status === "CANCELLED"
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {isPaid
                                ? "🟢 ĐÃ THANH TOÁN"
                                : order.status === "CANCELLED"
                                  ? "🔴 ĐÃ HỦY"
                                  : "🟡 CHỜ ADMIN XÁC NHẬN"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <span className="text-xs text-zinc-500">
                            Trạng thái cấp Key:{" "}
                            <strong className="text-zinc-800">
                              {isPaid
                                ? "Hiển thị trực tiếp trên Website"
                                : order.status === "CANCELLED"
                                  ? "Đơn hàng đã hủy"
                                  : "Đang chờ Admin xác nhận thanh toán"}
                            </strong>
                          </span>
                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderId(isSelected ? null : order.id)}
                              className="bg-brand text-brand-foreground hover:bg-brand-hover font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
                            >
                              🔑 {isSelected ? "Ẩn License Key" : "Xem Mã Key Bản Quyền"}
                            </button>
                          )}
                        </div>

                        {isSelected && (
                          <div className="mt-3 p-4 bg-zinc-900 text-white rounded-2xl space-y-3 ring-1 ring-black/20">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                🔑 Danh sách mã License Key của đơn hàng
                              </h4>
                              {keysQuery.isLoading && (
                                <span className="text-[11px] text-zinc-400">Đang nạp Key...</span>
                              )}
                            </div>

                            {keysQuery.isLoading ? (
                              <p className="text-xs text-zinc-400 italic">
                                Đang tải mã key từ server bảo mật...
                              </p>
                            ) : keysQuery.isError ? (
                              <p className="text-xs text-red-400">
                                Không thể nạp key. Vui lòng thử lại sau.
                              </p>
                            ) : (keysQuery.data ?? []).length > 0 ? (
                              (keysQuery.data ?? []).map((k: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ring-1 ring-white/10"
                                >
                                  <div>
                                    <p className="text-[11px] text-zinc-400 font-medium">
                                      {k.productName || "Phần mềm bản quyền"}
                                    </p>
                                    <p className="font-mono text-emerald-400 font-bold text-sm tracking-widest mt-0.5 select-all">
                                      {k.key}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(k.key);
                                      alert(`Đã sao chép mã Key: ${k.key}`);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer shrink-0 self-start sm:self-auto"
                                  >
                                    Sao chép Key
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-zinc-400 italic">
                                Đơn hàng đã được thanh toán. Nếu chưa thấy mã Key hiển thị, vui lòng
                                liên hệ Hotline 0383 158 080 để hỗ trợ ngay lập tức.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </RequireAuth>
  );
}
