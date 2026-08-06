import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle2, Copy, KeyRound, Mail, PhoneCall, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/layout";
import { ApiError } from "@/lib/apiClient";
import { getLicenseKeys, getOrder, type ApiOrder, type LicenseKey } from "@/lib/storeApi";

export const Route = createFileRoute("/checkout/success")({ component: CheckoutSuccessPage });

function money(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function CheckoutSuccessPage() {
  const orderId = useMemo(() => new URLSearchParams(window.location.search).get("orderId"), []);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Không tìm thấy thông tin đơn hàng.");
      setLoading(false);
      return;
    }
    Promise.all([getOrder(orderId), getLicenseKeys(orderId)])
      .then(([loadedOrder, loadedKeys]) => {
        setOrder(loadedOrder);
        setKeys(loadedKeys);
      })
      .catch((cause) => {
        setError(cause instanceof ApiError ? cause.message : "Không thể tải thông tin đơn hàng.");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.success(`Đã sao chép ${label}!`);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header Icon */}
        <div className="text-center space-y-3 mb-8">
          <div className="size-20 bg-emerald-100 ring-8 ring-emerald-50 text-emerald-600 rounded-full grid place-items-center mx-auto shadow-sm animate-bounce">
            <CheckCircle2 className="size-10" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Thanh toán thành công!</h1>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Cảm ơn bạn đã mua hàng tại <strong className="text-zinc-800">Công Ty TNHH Công Nghệ Nam Nguyễn</strong>. Mã bản quyền đã được kích hoạt thành công.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 ring-1 ring-black/5 text-center text-zinc-500">
            Đang kiểm tra và tải thông tin Key bản quyền...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Thông báo gửi Email */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0">
                <Mail className="size-5" />
              </div>
              <div className="text-xs text-emerald-900">
                <p className="font-bold text-sm">Mã Key đã được gửi về Gmail của bạn!</p>
                <p className="text-emerald-700 mt-0.5">
                  Vui lòng kiểm tra Hộp thư đến (hoặc Hòm thư Rác/Spam) của Email bạn đã điền khi đặt hàng.
                </p>
              </div>
            </div>

            {/* Danh sách Key Bản Quyền */}
            <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                  <KeyRound className="size-5 text-brand" /> Key Bản Quyền Đã Kích Hoạt
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Chính hãng 100%
                </span>
              </div>

              {keys.length === 0 ? (
                <p className="text-xs text-zinc-500">Đang tạo key bản quyền cho đơn hàng...</p>
              ) : (
                keys.map((item) => (
                  <div key={item.orderItemId} className="bg-zinc-50 rounded-xl p-4 ring-1 ring-black/5 space-y-2">
                    <p className="font-semibold text-sm text-zinc-900">{item.productName}</p>
                    <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-brand/30 shadow-inner">
                      <code className="font-mono font-bold text-base text-brand tracking-wider break-all">
                        {item.key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(item.key, "Mã Key")}
                        className="bg-brand hover:bg-brand-hover text-brand-foreground font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0"
                      >
                        {copiedKey === item.key ? (
                          <>
                            <Check className="size-4" /> Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" /> Sao chép
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tóm tắt Đơn hàng */}
            {order && (
              <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-6 space-y-3 text-xs">
                <h3 className="font-bold text-sm text-zinc-900 border-b pb-2">Chi tiết đơn hàng</h3>
                <div className="flex justify-between text-zinc-600">
                  <span>Mã đơn hàng:</span>
                  <span className="font-bold text-zinc-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Trạng thái thanh toán:</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ĐÃ THANH TOÁN</span>
                </div>
                <div className="flex justify-between text-zinc-600 border-t pt-2 items-baseline">
                  <span className="font-bold text-zinc-900 text-sm">Tổng tiền:</span>
                  <span className="font-bold text-brand text-lg">{money(Number(order.totalAmount))}</span>
                </div>
              </div>
            )}

            {/* Hỗ trợ kỹ thuật */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <PhoneCall className="size-4 text-amber-700 shrink-0" />
                <span>Cần hỗ trợ kích hoạt key nhanh? Liên hệ Hotline / Zalo: <strong>0383 158 080</strong></span>
              </div>
            </div>

            {/* Nút điều hướng */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/"
                className="flex-1 bg-brand hover:bg-brand-hover text-brand-foreground font-semibold py-3 px-6 rounded-xl transition-all shadow-sm text-center text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag className="size-4" /> Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
