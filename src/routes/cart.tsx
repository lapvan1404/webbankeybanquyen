import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, ArrowLeft, ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/products";
import { listActiveCoupons } from "@/lib/storeApi";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Giỏ hàng — Công Ty TNHH Công Nghệ Nam Nguyễn" }] }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, subtotal, count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [orderNote, setOrderNote] = useState("");

  const couponsQuery = useQuery({
    queryKey: ["active-coupons"],
    queryFn: listActiveCoupons,
    refetchInterval: 3000,
  });

  const activeCoupons = couponsQuery.data ?? [];

  const applyCoupon = () => {
    const inputCode = coupon.trim().toUpperCase();
    if (!inputCode) return;
    const found = activeCoupons.find((c) => c.code.toUpperCase() === inputCode && c.active);
    if (found) {
      setDiscount((subtotal * found.discountPercent) / 100);
      toast.success(`🎉 Áp dụng mã ${found.code} thành công — giảm ${found.discountPercent}%!`);
    } else {
      setDiscount(0);
      toast.error("Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa trong Admin.");
    }
  };

  const total = Math.max(0, subtotal - discount);

  return (
    <Layout>
      <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-3xl font-extrabold mb-8 text-zinc-900 flex items-center gap-3">
          <span>🛒 Giỏ hàng của bạn</span>
          <span className="text-xs bg-brand/10 text-brand px-3 py-1 rounded-full font-bold">
            {count} sản phẩm
          </span>
        </h1>

        {lines.length === 0 ? (
          <div className="bg-white rounded-3xl ring-1 ring-black/5 p-16 text-center shadow-sm space-y-4">
            <div className="size-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <ShoppingBag className="size-8" />
            </div>
            <p className="text-zinc-500 font-medium">Giỏ hàng của bạn đang trống.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-brand-foreground font-bold px-6 py-3 rounded-full transition-all shadow-md"
            >
              <ArrowLeft className="size-4" /> Tiếp tục khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* LEFT COL: CART ITEM LIST */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
              {lines.map((l) => (
                <div
                  key={l.product.id}
                  className="bg-white rounded-2xl ring-1 ring-black/5 p-5 flex gap-5 hover:shadow-sm transition-shadow"
                >
                  <Link to="/product/$slug" params={{ slug: l.product.slug }} className="shrink-0">
                    <img
                      src={l.product.image}
                      alt={l.product.name}
                      className="size-24 object-cover rounded-xl bg-zinc-50 ring-1 ring-black/5"
                      width={96}
                      height={96}
                      loading="lazy"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-extrabold text-brand tracking-widest">
                        {l.product.brand}
                      </div>
                      <Link
                        to="/product/$slug"
                        params={{ slug: l.product.slug }}
                        className="font-bold text-zinc-900 hover:text-brand line-clamp-2 text-base mt-0.5"
                      >
                        {l.product.name}
                      </Link>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4 flex-wrap pt-3 border-t border-zinc-100">
                      <div className="flex items-center bg-zinc-100 rounded-xl ring-1 ring-black/5">
                        <button
                          type="button"
                          onClick={() => setQty(l.product.id, l.qty - 1)}
                          className="size-8 grid place-items-center text-zinc-600 hover:text-brand font-bold transition cursor-pointer"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-zinc-900">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.product.id, l.qty + 1)}
                          className="size-8 grid place-items-center text-zinc-600 hover:text-brand font-bold transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-brand text-base">
                          {money(l.product.price * l.qty)}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(l.product.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Xóa khỏi giỏ hàng"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-brand transition-colors bg-white px-4 py-2.5 rounded-full ring-1 ring-black/5"
                >
                  <ArrowLeft className="size-3.5" /> Tiếp tục mua sắm
                </Link>
              </div>
            </div>

            {/* RIGHT COL: SUMMARY CARD RE-DESIGN */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="bg-white rounded-3xl ring-1 ring-black/10 p-6 lg:p-7 shadow-sm sticky top-28 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <h2 className="font-bold text-lg text-zinc-900">Tóm tắt đơn hàng</h2>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
                    ⚡ Giao key 5 phút
                  </span>
                </div>

                {/* PRICE BREAKDOWN */}
                <div className="space-y-3 text-xs text-zinc-600">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Tạm tính ({count} sản phẩm)</span>
                    <span className="font-semibold text-zinc-900 text-sm">{money(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Giao key qua Email</span>
                    <span className="font-bold text-emerald-600">MIỄN PHÍ (0đ)</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                      <span className="font-medium">Giảm giá Coupon</span>
                      <span className="font-extrabold">−{money(discount)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-zinc-100 flex justify-between items-baseline">
                    <div>
                      <span className="font-extrabold text-zinc-900 text-base block">Tổng cộng</span>
                      <span className="text-[10px] text-zinc-400">Đã bao gồm thuế VAT 10%</span>
                    </div>
                    <span className="text-2xl font-black text-brand tracking-tight">{money(total)}</span>
                  </div>
                </div>

                {/* COUPON DISCOUNT CODE SECTION */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <label className="block text-xs font-bold text-zinc-700">Mã giảm giá (Coupon):</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="Nhập mã coupon..."
                        className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold uppercase outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Áp dụng
                    </button>
                  </div>

                  {/* QUICK SUGGESTION CHIPS DYNAMIC FROM ADMIN DB */}
                  {activeCoupons.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-zinc-400 font-medium">Mã từ Admin:</span>
                      {activeCoupons.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCoupon(c.code);
                            setDiscount((subtotal * c.discountPercent) / 100);
                            toast.success(`🎉 Áp dụng mã ${c.code} thành công — giảm ${c.discountPercent}%!`);
                          }}
                          className="text-[10px] font-mono font-bold bg-brand/10 hover:bg-brand text-brand hover:text-white px-2.5 py-0.5 rounded-full transition cursor-pointer"
                        >
                          {c.code} (-{c.discountPercent}%)
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ORDER NOTE */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                  <label className="block text-xs font-bold text-zinc-700">Ghi chú cho cửa hàng (Tùy chọn):</label>
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Ví dụ: Xuất hóa đơn VAT Công ty..."
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 bg-zinc-50"
                  />
                </div>

                {/* CHECKOUT BUTTON */}
                <button
                  id="checkout-btn"
                  onClick={() => {
                    const activeCouponCode = coupon.trim();
                    if (!user) {
                      toast.error("Vui lòng đăng nhập để tiến hành thanh toán!");
                      navigate({
                        to: "/login",
                        search: {
                          redirect: activeCouponCode ? `/checkout?coupon=${encodeURIComponent(activeCouponCode)}` : "/checkout",
                        } as any,
                      });
                      return;
                    }
                    navigate({
                      to: "/checkout",
                      search: activeCouponCode ? ({ coupon: activeCouponCode } as any) : undefined,
                    });
                  }}
                  className="w-full bg-brand hover:bg-brand-hover text-brand-foreground font-black text-sm py-4 rounded-2xl transition shadow-lg shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>TIẾN HÀNH THANH TOÁN</span>
                  <span className="text-xs font-normal">→</span>
                </button>

                {/* TRUST BADGES CAM KẾT */}
                <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-600">
                  <div className="flex items-center gap-1.5 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                    <span className="text-brand font-bold text-xs">⚡</span>
                    <span>Giao key 5 phút</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                    <span className="text-brand font-bold text-xs">🛡️</span>
                    <span>Key chính hãng 100%</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                    <span className="text-brand font-bold text-xs">🔒</span>
                    <span>Thanh toán bảo mật</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                    <span className="text-brand font-bold text-xs">📞</span>
                    <span>Hỗ trợ online 24/7</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}
