import { createFileRoute, useNavigate, useLocation, Outlet } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Landmark,
  Clock,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { useCart, type CartLine } from "@/lib/cart";
import { money, type Product } from "@/lib/products";
import { ApiError } from "@/lib/apiClient";
import {
  createOrder,
  getOrder,
  getProductById,
  payOrder,
  toProduct,
  listActiveCoupons,
  type ApiOrder,
} from "@/lib/storeApi";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

type PaymentMethod = "vietqr" | "momo" | "vnpay";

export function CheckoutPage() {
  const location = useLocation();
  const { lines: cartLines, subtotal: cartSubtotal, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vietqr");
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isPaidVerified, setIsPaidVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 minutes

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // ── Tự động điền Email của tài khoản đang đăng nhập ──────────────────
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // ── Bảo vệ trang: chưa đăng nhập → redirect /login ──────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      const params = new URLSearchParams(window.location.search);
      const search: Record<string, string> = { redirect: "/checkout" };
      if (params.get("buyNowProductId")) search.buyNowProductId = params.get("buyNowProductId")!;
      if (params.get("buyNowQuantity")) search.buyNowQuantity = params.get("buyNowQuantity")!;
      if (params.get("coupon")) search.coupon = params.get("coupon")!;
      navigate({ to: "/login", search: search as any });
    }
  }, [authLoading, user, navigate]);

  const handleApplyCoupon = async (overrideCode?: string | React.SyntheticEvent) => {
    const rawCode = typeof overrideCode === "string" ? overrideCode : couponInput;
    const codeToUse = rawCode.trim().toUpperCase();
    if (!codeToUse) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }
    setApplyingCoupon(true);
    try {
      const list = await listActiveCoupons();
      const match = list.find((c: any) => c.code.toUpperCase() === codeToUse && c.active);
      if (match) {
        setAppliedCoupon({ code: match.code, discountPercent: match.discountPercent });
        setCouponInput(match.code);
        toast.success(`🎉 Tự động áp dụng mã ${match.code} giảm ${match.discountPercent}%!`);
      } else {
        toast.error("Mã giảm giá không tồn tại hoặc đã hết hạn!");
      }
    } catch {
      toast.error("Không thể xác thực mã giảm giá lúc này.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  // ── Tự động áp dụng mã Coupon được chuyển từ Giỏ hàng ───────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCoupon = params.get("coupon");
    if (urlCoupon && !appliedCoupon) {
      handleApplyCoupon(urlCoupon);
    }
  }, []);

  const buyNow = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("buyNowProductId");
    const value = Number(params.get("buyNowQuantity") ?? 1);
    return { productId, quantity: Number.isInteger(value) && value > 0 ? value : 1 };
  }, []);
  const isBuyNow = Boolean(buyNow.productId);

  useEffect(() => {
    if (!buyNow.productId || !user) return;
    setLoadingProduct(true);
    getProductById(buyNow.productId)
      .then((product) => {
        if (product) setBuyNowProduct(toProduct(product));
      })
      .catch((error) =>
        toast.error(error instanceof ApiError ? error.message : "Không thể tải sản phẩm mua ngay."),
      )
      .finally(() => setLoadingProduct(false));
  }, [buyNow.productId, user]);

  useEffect(() => {
    if (!order) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  useEffect(() => {
    if (!order) return;
    const pollInterval = setInterval(async () => {
      try {
        const latest = await getOrder(order.id);
        if (latest && (latest.paymentStatus === "PAID" || latest.status === "PAID")) {
          clearInterval(pollInterval);
          setIsPaidVerified(true);
          if (!isBuyNow) clear();
          toast.success("✅ ĐÃ XÁC NHẬN NHẬN TIỀN THÀNH CÔNG!");
          setTimeout(() => {
            window.location.href = `/checkout/success?orderId=${order.id}`;
          }, 1500);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [order, isBuyNow, clear]);

  const lines: CartLine[] =
    isBuyNow && buyNowProduct ? [{ product: buyNowProduct, qty: buyNow.quantity }] : cartLines;
  const subtotal = isBuyNow ? (buyNowProduct?.price ?? 0) * buyNow.quantity : cartSubtotal;
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  if (location.pathname.startsWith("/checkout/success")) {
    return <Outlet />;
  }

  const placeOrder = async () => {
    if (!user) {
      const params = new URLSearchParams(window.location.search);
      navigate({
        to: "/login",
        search: {
          buyNowProductId: params.get("buyNowProductId") ?? "",
          buyNowQuantity: params.get("buyNowQuantity") ?? "1",
        },
      });
      return;
    }
    if (isBuyNow && !buyNowProduct) {
      toast.error("Sản phẩm mua ngay không khả dụng.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createOrder(
        isBuyNow && buyNow.productId
          ? {
              productId: buyNow.productId,
              quantity: buyNow.quantity,
              couponCode: appliedCoupon?.code,
            }
          : { couponCode: appliedCoupon?.code },
      );
      setOrder(created);
      toast.success("Tạo đơn hàng thành công! Quét mã QR để hoàn tất chuyển khoản.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lỗi khi đặt hàng");
    } finally {
      setSubmitting(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      const latest = await getOrder(order.id);
      if (latest && (latest.paymentStatus === "PAID" || latest.status === "PAID")) {
        setIsPaidVerified(true);
        if (!isBuyNow) clear();
        toast.success("🎉 ADMIN ĐÃ XÁC NHẬN THANH TOÁN THÀNH CÔNG!");
        setTimeout(() => {
          window.location.href = `/checkout/success?orderId=${order.id}`;
        }, 1000);
      } else {
        toast.info("🟡 Đang chờ Admin xác nhận thanh toán. Vui lòng thử lại sau.");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Không thể kiểm tra trạng thái đơn hàng.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProduct)
    return (
      <Layout>
        <Empty text="Đang chuẩn bị đơn mua ngay..." />
      </Layout>
    );

  // Đang kiểm tra đăng nhập hoặc chưa đăng nhập → hiện loading, tránh flash nội dung
  if (authLoading || !user) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="size-8 animate-spin text-brand mx-auto" />
            <p className="text-sm text-zinc-500">Đang kiểm tra đăng nhập...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isBuyNow && lines.length === 0 && !order) {
    setTimeout(() => navigate({ to: "/cart" }), 0);
    return (
      <Layout>
        <Empty text="Giỏ hàng đang trống." />
      </Layout>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getMethodTitle = () => {
    if (paymentMethod === "momo") return "Ví điện tử MoMo";
    if (paymentMethod === "vnpay") return "Cổng VNPay (QR / ATM / Visa)";
    return "Chuyển khoản VietQR (MB Bank)";
  };

  return (
    <Layout>
      <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold mb-8 text-zinc-900">Thanh toán đơn hàng</h1>

        {!order ? (
          <div className="grid grid-cols-12 gap-8">
            <main className="col-span-12 lg:col-span-7 space-y-6">
              {/* Chọn phương thức thanh toán */}
              <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6 space-y-4 shadow-sm">
                <h2 className="font-semibold text-lg text-zinc-900 flex items-center gap-2">
                  <Landmark className="size-5 text-brand" />
                  Chọn phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  {/* Option 1: VietQR — luôn được chọn */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-brand bg-brand/5 shadow-sm cursor-default">
                    <input
                      type="radio"
                      name="payment"
                      checked
                      readOnly
                      className="mt-1 accent-brand"
                    />
                    <div className="size-10 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                      <Landmark className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-sm">
                          Chuyển khoản Ngân hàng (VietQR / MB Bank)
                        </span>
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Quét mã VietQR chuyển khoản tự động 24/7. Key duyệt sau 30 giây.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: MoMo — disabled, làm mờ */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-zinc-200 bg-zinc-50 opacity-40 cursor-not-allowed select-none">
                    <input type="radio" name="payment" disabled className="mt-1" />
                    <div className="size-10 rounded-lg bg-[#A50064] text-white grid place-items-center font-bold text-xs shrink-0">
                      MoMo
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-sm">Ví điện tử MoMo</span>
                        <span className="bg-zinc-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Sắp ra mắt
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Thanh toán tự động bằng ứng dụng Ví MoMo trên điện thoại.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: VNPay — disabled, làm mờ */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-zinc-200 bg-zinc-50 opacity-40 cursor-not-allowed select-none">
                    <input type="radio" name="payment" disabled className="mt-1" />
                    <div className="size-10 rounded-lg bg-[#005BAA] text-white grid place-items-center font-bold text-[10px] shrink-0">
                      VNPAY
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-sm">
                          Cổng VNPay (QR / ATM / Visa)
                        </span>
                        <span className="bg-zinc-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Sắp ra mắt
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Quét VNPay QR hoặc dùng thẻ ATM Nội Địa, Visa/Mastercard.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  className="w-full bg-brand hover:bg-brand-hover text-brand-foreground font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-base mt-4"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-5 animate-spin" /> Đang tạo đơn hàng...
                    </>
                  ) : (
                    <>
                      <QrCode className="size-5" /> Tiến hành thanh toán ({getMethodTitle()})
                    </>
                  )}
                </button>
              </div>
            </main>

            <aside className="col-span-12 lg:col-span-5">
              <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6 shadow-sm h-full">
                <h2 className="font-semibold text-lg text-zinc-900 mb-5">Tóm tắt đơn hàng</h2>
                <div className="space-y-3 mb-5 max-h-80 overflow-y-auto pr-1">
                  {lines.map((line) => (
                    <div
                      key={line.product.id}
                      className="flex gap-3 text-sm border-b border-zinc-100 pb-3 last:border-0"
                    >
                      <img
                        src={line.product.image}
                        alt=""
                        className="size-14 rounded-lg object-cover bg-zinc-50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 line-clamp-2">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-zinc-500">Số lượng: {line.qty}</p>
                      </div>
                      <span className="font-semibold text-zinc-900">
                        {money(line.product.price * line.qty)}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Khung Nhập Mã Giảm Giá */}
                <div className="border-t pt-4 mb-4">
                  <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                    Mã giảm giá / Ưu đãi
                  </label>
                  {appliedCoupon ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="font-mono font-bold text-xs text-emerald-800">
                          🏷️ {appliedCoupon.code}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-medium">
                          Giảm {appliedCoupon.discountPercent}% cho đơn hàng này
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(null)}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="VD: GIAM10, TET2026"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-3 py-2 text-xs font-mono font-semibold uppercase outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon}
                        className="bg-zinc-900 hover:bg-black text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer shrink-0"
                      >
                        {applyingCoupon ? "..." : "Áp dụng"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>Tạm tính</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                      <span>Mã giảm giá ({appliedCoupon.code})</span>
                      <span>-{money(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>Phí vận chuyển</span>
                    <span className="text-emerald-600 font-medium">Miễn phí (Email 5 phút)</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 items-baseline">
                    <span className="font-bold text-zinc-900 text-base">Tổng thanh toán</span>
                    <span className="text-2xl font-bold text-brand">{money(finalTotal)}</span>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="mt-6 pt-5 border-t border-zinc-100 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                    Cam kết của chúng tôi
                  </p>
                  {[
                    {
                      icon: "🔒",
                      title: "Thanh toán bảo mật SSL",
                      desc: "Mã hoá 256-bit, an toàn tuyệt đối",
                    },
                    {
                      icon: "⚡",
                      title: "Giao key trong 5 phút",
                      desc: "Tự động qua email sau khi thanh toán",
                    },
                    {
                      icon: "✅",
                      title: "Key bản quyền chính hãng",
                      desc: "Nhập trực tiếp từ nhà phân phối",
                    },
                    {
                      icon: "🎧",
                      title: "Hỗ trợ cài đặt miễn phí",
                      desc: "Hotline & chat 24/7 — 0383 158 080",
                    },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">{title}</p>
                        <p className="text-[11px] text-zinc-400">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* Màn hình Thanh toán Chi tiết qua QR MoMo / VNPay / VietQR */
          <div className="max-w-2xl mx-auto bg-white rounded-2xl ring-1 ring-black/10 p-6 lg:p-8 shadow-xl space-y-6">
            <div className="text-center border-b pb-6">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                <Clock className="size-3.5 animate-pulse text-amber-600" />
                Thời gian giữ đơn & key:{" "}
                <span className="font-bold text-amber-900">{formatTime(countdown)}</span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Quét mã QR để hoàn tất thanh toán
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Đơn hàng <span className="font-bold text-zinc-900">{order.orderNumber}</span> ·
                Phương thức: <span className="font-bold text-brand">{getMethodTitle()}</span>
              </p>
            </div>

            {/* Khung mã QR & Thông tin chuyển khoản */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Code Container */}
              <div className="bg-zinc-50 p-5 rounded-2xl ring-1 ring-black/5 text-center flex flex-col items-center justify-center">
                <div className="relative bg-white p-3 rounded-xl shadow-md ring-1 ring-black/10 mb-3">
                  <img
                    src={`https://img.vietqr.io/image/MB-013220059999-compact2.png?amount=${order.totalAmount || finalTotal}&addInfo=CK%20${order.orderNumber}&accountName=HA%20VAN%20DUNG`}
                    alt="Mã QR Thanh Toán MB Bank"
                    className="size-52 object-contain"
                  />
                  <div className="absolute inset-0 border-2 border-brand/20 rounded-xl pointer-events-none" />
                </div>
                <p className="text-[11px] text-zinc-500 font-medium flex items-center justify-center gap-1">
                  <QrCode className="size-3.5 text-brand" /> Mở app {paymentMethod.toUpperCase()}{" "}
                  hoặc Ngân hàng để quét
                </p>
              </div>

              {/* Chi tiết tài khoản */}
              <div className="space-y-3 text-xs">
                <div className="bg-zinc-50 p-3 rounded-xl ring-1 ring-black/5 space-y-1">
                  <span className="text-zinc-500 block text-[11px]">Ngân hàng nhận</span>
                  <span className="font-bold text-zinc-900 text-sm block">
                    MB Bank (Ngân hàng TMCP Quân Đội)
                  </span>
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl ring-1 ring-black/5 space-y-1 relative">
                  <span className="text-zinc-500 block text-[11px]">Số tài khoản nhận</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand text-base tracking-wider">
                      0132 2005 9999
                    </span>
                    <button
                      onClick={() => handleCopy("013220059999", "Số tài khoản")}
                      className="bg-white hover:bg-zinc-100 ring-1 ring-black/10 text-zinc-700 font-medium px-2 py-1 rounded flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="size-3" /> Chép
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl ring-1 ring-black/5 space-y-1 relative">
                  <span className="text-zinc-500 block text-[11px]">Chủ tài khoản</span>
                  <span className="font-bold text-zinc-900 text-sm block uppercase">
                    HA VAN DUNG
                  </span>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl ring-1 ring-amber-200 space-y-1 relative">
                  <span className="text-amber-700 block text-[11px] font-semibold">
                    Nội dung chuyển khoản (bắt buộc)
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-base tracking-wider">
                      CK {order.orderNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(`CK ${order.orderNumber}`, "Nội dung chuyển khoản")}
                      className="bg-white hover:bg-amber-100 ring-1 ring-amber-300 text-amber-900 font-medium px-2 py-1 rounded flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="size-3" /> Chép
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl ring-1 ring-black/5 space-y-1">
                  <span className="text-zinc-500 block text-[11px]">Số tiền cần thanh toán</span>
                  <span className="font-bold text-zinc-900 text-lg text-emerald-600 block">
                    {money(Number(order.totalAmount || finalTotal))}
                  </span>
                </div>
              </div>
            </div>

            {/* Trạng thái xác nhận thanh toán */}
            <div
              className={`p-4 rounded-xl flex items-center justify-between gap-4 border transition-all ${
                isPaidVerified
                  ? "bg-emerald-100 border-emerald-500 shadow-md ring-2 ring-emerald-400/50"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-full text-white grid place-items-center shrink-0 transition-all ${
                    isPaidVerified ? "bg-emerald-600 ring-4 ring-emerald-200" : "bg-amber-500"
                  }`}
                >
                  {isPaidVerified ? (
                    <Check className="size-5 stroke-[3]" />
                  ) : (
                    <Clock className="size-4 animate-spin" />
                  )}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-zinc-950 text-sm">
                    {isPaidVerified
                      ? "✓ ĐÃ XÁC NHẬN THANH TOÁN THÀNH CÔNG!"
                      : "🟡 Đang chờ Admin xác nhận thanh toán"}
                  </p>
                  <p className="text-zinc-600">
                    {isPaidVerified
                      ? "Key bản quyền đã sẵn sàng trên website. Đang chuyển hướng..."
                      : "Sau khi hoàn tất chuyển khoản, bấm 'Kiểm tra trạng thái' hoặc đợi Admin duyệt."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={checkPaymentStatus}
                disabled={submitting || isPaidVerified}
                className={`w-full font-bold py-3.5 px-6 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 ${
                  isPaidVerified
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-brand hover:bg-brand-hover text-brand-foreground cursor-pointer"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Đang kiểm tra...
                  </>
                ) : isPaidVerified ? (
                  <>
                    <Check className="size-5 stroke-[3]" /> ✓ Thanh toán đã xác nhận
                  </>
                ) : (
                  <>🔄 Kiểm tra trạng thái</>
                )}
              </button>

              <button
                onClick={() => {
                  setOrder(null);
                  setIsPaidVerified(false);
                }}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2.5 rounded-xl transition-all text-xs"
              >
                Đổi phương thức thanh toán khác
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-16 text-center text-zinc-500">{text}</div>;
}

function Field({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600 mb-1.5 block">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-zinc-50 ring-1 ring-zinc-200 focus:ring-brand rounded-xl px-4 py-3 text-sm outline-none transition-all"
      />
    </label>
  );
}
