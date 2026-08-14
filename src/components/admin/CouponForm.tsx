import { useState } from "react";
import { Loader2, Tag, Percent } from "lucide-react";
import { toast } from "sonner";

interface CouponFormProps {
  coupon?: {
    id?: string;
    code?: string;
    discountPercent?: number;
    active?: boolean;
  };
  onSave: (data: { code: string; discountPercent: number; active: boolean }) => Promise<void>;
  onClose: () => void;
}

export function CouponForm({ coupon, onSave, onClose }: CouponFormProps) {
  const [code, setCode] = useState(coupon?.code ?? "");
  const [discountPercent, setDiscountPercent] = useState(coupon?.discountPercent ?? 10);
  const [active, setActive] = useState(coupon?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }
    if (discountPercent <= 0 || discountPercent > 100) {
      toast.error("Phần trăm giảm giá từ 1% đến 100%");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent),
        active,
      });
      toast.success(
        coupon ? "Cập nhật mã giảm giá thành công!" : "Tạo mã giảm giá mới thành công!",
      );
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi lưu mã giảm giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center font-bold">
              <Tag className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-900">
                {coupon ? "Chỉnh sửa mã giảm giá" : "Thêm mã giảm giá mới"}
              </h3>
              <p className="text-xs text-zinc-500">Tạo ưu đãi giảm giá cho khách hàng đặt mua</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 grid place-items-center text-zinc-600 font-bold text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Mã giảm giá (Coupon Code)
            </label>
            <input
              type="text"
              placeholder="VD: GIAM10, TET2026..."
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 font-mono font-bold text-sm tracking-wider outline-none transition"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">Phần trăm giảm giá (%)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                placeholder="10"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 font-bold text-sm outline-none transition"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                <Percent className="size-4" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="couponActive"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-brand rounded cursor-pointer"
            />
            <label htmlFor="couponActive" className="font-semibold text-zinc-800 cursor-pointer">
              Kích hoạt mã giảm giá này ngay lập tức
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand hover:bg-brand-hover text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                "Lưu mã giảm giá"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
