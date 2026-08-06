import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Copy, KeyRound, Mail, Search, ShieldCheck, ShoppingBag, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/products";
import { listOrders, getLicenseKeys, payOrder, type ApiOrder, type LicenseKey } from "@/lib/storeApi";
import { ApiError } from "@/lib/apiClient";

export const Route = createFileRoute("/lookup")({ component: LookupPage });

function LookupPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderKeys, setOrderKeys] = useState<Record<string, LicenseKey[]>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login", search: { redirect: "/lookup" } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listOrders()
      .then(async (data) => {
        setOrders(data);
        const paidOrders = data.filter((o) => o.status === "PAID" || o.paymentStatus === "PAID");
        const keysMap: Record<string, LicenseKey[]> = {};
        await Promise.all(
          paidOrders.map(async (o) => {
            try {
              const keys = await getLicenseKeys(o.id);
              keysMap[o.id] = keys;
            } catch {
              // ignore key load error
            }
          }),
        );
        setOrderKeys(keysMap);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Không thể tải danh sách đơn hàng");
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleCopy = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    toast.success("Đã sao chép Mã Key bản quyền!");
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handlePayNow = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      await payOrder(orderId);
      toast.success("Thanh toán thành công! Key bản quyền đã được cấp.");
      const updatedList = await listOrders();
      setOrders(updatedList);
      const keys = await getLicenseKeys(orderId);
      setOrderKeys((prev) => ({ ...prev, [orderId]: keys }));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xác nhận thanh toán thất bại");
    } finally {
      setPayingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const matchOrderNumber = o.orderNumber?.toLowerCase().includes(q);
    const matchId = o.id.toLowerCase().includes(q);
    const matchItem = o.items?.some((i) => i.productName?.toLowerCase().includes(q));
    return matchOrderNumber || matchId || matchItem;
  });

  if (authLoading || (!user && !authLoading)) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-zinc-500">
          Đang kiểm tra quyền truy cập...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand/10 via-brand/5 to-transparent rounded-3xl p-8 border border-brand/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-brand font-bold text-xs uppercase tracking-widest">
                Tài khoản: {user?.email}
              </span>
              <h1 className="text-3xl font-bold text-zinc-900 mt-1">Tra Cứu & Quản Lý Đơn Hàng</h1>
              <p className="text-xs text-zinc-500 mt-1">
                Xem lại danh sách đơn hàng đã mua, nhận mã Key bản quyền và theo dõi trạng thái thanh toán.
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã đơn (ORD-...), tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-zinc-200 focus:border-brand outline-none text-sm shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-zinc-500 shadow-sm border border-zinc-100">
            Đang tải thông tin đơn hàng...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center space-y-3 shadow-sm border border-zinc-100">
            <ShoppingBag className="size-12 text-zinc-300 mx-auto" />
            <h3 className="font-bold text-zinc-800 text-lg">Chưa tìm thấy đơn hàng nào</h3>
            <p className="text-xs text-zinc-500">
              {searchQuery ? "Không tìm thấy đơn hàng phù hợp với từ khóa." : "Bạn chưa thực hiện đơn hàng nào trên hệ thống."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isPaid = order.status === "PAID" || order.paymentStatus === "PAID";
              const keys = orderKeys[order.id] || [];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all hover:border-brand/40"
                >
                  {/* Order Header */}
                  <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-zinc-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-zinc-400">·</span>
                      <span className="text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isPaid ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[11px] flex items-center gap-1">
                          <ShieldCheck className="size-3.5" /> ĐÃ THANH TOÁN
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-[11px] flex items-center gap-1">
                          <Clock className="size-3.5" /> CHỜ THANH TOÁN
                        </span>
                      )}
                      <span className="font-bold text-brand text-base">{money(Number(order.totalAmount))}</span>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6 space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-zinc-50 last:border-0">
                          <span className="font-medium text-zinc-800">{item.productName || "Sản phẩm bản quyền"}</span>
                          <span className="text-xs text-zinc-500">
                            x{item.quantity} · <strong className="text-zinc-900">{money(Number(item.unitPrice || 0))}</strong>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Paid Keys Box */}
                    {isPaid && (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <KeyRound className="size-4 text-brand" /> Mã Key Bản Quyền Chính Hãng
                          </span>
                          <span className="text-[11px] text-emerald-700 font-normal flex items-center gap-1">
                            <Mail className="size-3.5" /> Đã gửi về Email: {user?.email}
                          </span>
                        </div>

                        {keys.length === 0 ? (
                          <p className="text-xs text-zinc-500">Đang tải Key bản quyền...</p>
                        ) : (
                          keys.map((k, i) => (
                            <div
                              key={i}
                              className="bg-white p-3 rounded-lg border border-emerald-300 flex items-center justify-between gap-3 shadow-inner"
                            >
                              <code className="font-mono font-bold text-brand text-base tracking-wider break-all">
                                {k.key}
                              </code>
                              <button
                                onClick={() => handleCopy(k.key)}
                                className="bg-brand hover:bg-brand-hover text-brand-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0"
                              >
                                {copiedKey === k.key ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                {copiedKey === k.key ? "Đã chép" : "Sao chép"}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Pending Action Bar */}
                    {!isPaid && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-amber-900 font-medium">
                          Đơn hàng chưa hoàn tất thanh toán. Bấm nút dưới để hoàn tất và nhận Key tức thì!
                        </span>
                        <button
                          onClick={() => handlePayNow(order.id)}
                          disabled={payingOrderId === order.id}
                          className="bg-brand hover:bg-brand-hover text-brand-foreground font-semibold px-5 py-2 rounded-lg transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                        >
                          {payingOrderId === order.id ? "Đang xử lý..." : "Thanh toán & Nhận Key ngay"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
