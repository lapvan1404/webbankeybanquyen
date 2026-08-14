import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface KeyFormProps {
  keyData?: {
    id?: string;
    productId?: string;
    key?: string;
    status?: string;
  };
  products: { id: string; name: string }[];
  onSave: (data: { productId: string; key: string; status: string }) => Promise<void>;
  onClose: () => void;
}

export function KeyForm({ keyData, products, onSave, onClose }: KeyFormProps) {
  const [productId, setProductId] = useState(keyData?.productId ?? products[0]?.id ?? "");
  const [key, setKey] = useState(keyData?.key ?? "");
  const [status, setStatus] = useState(keyData?.status ?? "AVAILABLE");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error("Vui lòng chọn sản phẩm áp dụng");
      return;
    }
    if (!key.trim()) {
      toast.error("Vui lòng nhập mã key bản quyền");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        productId,
        key: key.trim(),
        status,
      });
      toast.success(keyData ? "Cập nhật Key thành công!" : "Thêm Key bản quyền mới thành công!");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu Key bản quyền");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center font-bold">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-900">
                {keyData ? "Chỉnh sửa Key bản quyền" : "Thêm Key bản quyền mới"}
              </h3>
              <p className="text-xs text-zinc-500">
                Quản lý mã key cấp tự động cho khách mua sản phẩm
              </p>
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
            <label className="font-semibold text-zinc-700 block mb-1">Sản phẩm áp dụng</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 font-semibold text-sm outline-none transition"
              required
            >
              <option value="" disabled>
                -- Chọn sản phẩm --
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">Mã Key Bản Quyền</label>
            <textarea
              rows={3}
              placeholder="VD: ESET-39BA1-F4401-209B1..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-zinc-900 text-emerald-400 border border-zinc-700 focus:border-emerald-500 rounded-xl p-3 font-mono font-bold text-sm tracking-wider outline-none transition"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">Trạng thái khoá</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 font-semibold text-xs outline-none transition"
            >
              <option value="AVAILABLE">Sẵn sàng (Chưa bán)</option>
              <option value="SOLD">Đã bán (Đã cấp cho đơn)</option>
              <option value="DISABLED">Tạm khóa / Hỏng</option>
            </select>
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                "Lưu Key bản quyền"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
