import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader, ImageItem } from "./ImageUploader";

type BannerFormInput = {
  title?: string;
  link?: string;
  position?: string;
  isActive?: boolean;
  imageUrl?: string;
};

type BannerFormProps = {
  banner?: BannerFormInput;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

export function BannerForm({ banner, onSave, onClose }: BannerFormProps) {
  const [formData, setFormData] = useState({
    title: banner?.title || "",
    link: banner?.link || "",
    position: banner?.position || "hero",
    isActive: banner?.isActive !== undefined ? banner.isActive : true,
  });

  const [images, setImages] = useState<ImageItem[]>(() => {
    if (banner?.imageUrl) {
      const urls = banner.imageUrl.split(",").map((s) => s.trim()).filter(Boolean);
      return urls.map((url) => ({ url }));
    }
    return [];
  });

  React.useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || "",
        link: banner.link || "",
        position: banner.position || "hero",
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });
      if (banner.imageUrl) {
        const urls = banner.imageUrl.split(",").map((s) => s.trim()).filter(Boolean);
        setImages(urls.map((url) => ({ url })));
      } else {
        setImages([]);
      }
    }
  }, [banner]);

  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImageUrl = images.map((img) => img.url).filter(Boolean).join(",");
    if (!finalImageUrl) {
      toast.error("Vui lòng ấn Tải lên để chọn ít nhất 1 ảnh cho banner.");
      return;
    }
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        subtitle: formData.position,
        imageUrl: finalImageUrl,
      };
      await onSave(dataToSave);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isPromoPosition =
    formData.position === "side" ||
    formData.position === "promo" ||
    formData.position === "promo_windows" ||
    formData.position === "promo_antivirus";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-xl font-semibold">{banner ? "Sửa banner / ảnh nổi bật" : "Thêm banner"}</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
            <ImageUploader
              images={images}
              onChange={setImages}
              maxImages={5}
              label={
                isPromoPosition
                  ? "Ảnh Banner nổi bật (Tối đa 5 ảnh chuyển động - Lưu vào uploads/banners/promo/)"
                  : "Ảnh Banner chính Hero (Tối đa 5 ảnh - Lưu vào uploads/banners/)"
              }
              folder={isPromoPosition ? "promo_banner" : "banners"}
              disabled={loading}
              onUploadingChange={setIsUploading}
              onUploadProgressChange={setUploadProgress}
            />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tiêu đề</label>
                <input
                  required
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Đường dẫn liên kết
                </label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Vị trí</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition bg-white"
                >
                  <option value="hero">Hero (Banner Slide Chính)</option>
                  <option value="promo_windows">Khối Nổi Bật Windows (Bên cạnh Banner)</option>
                  <option value="promo_antivirus">Khối Nổi Bật Antivirus (Bên cạnh Banner)</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="footer">Footer</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded text-brand focus:ring-brand"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-zinc-700">
                  Kích hoạt banner này
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-zinc-100 flex justify-end gap-3">
          {isUploading && (
            <p className="mr-auto text-xs text-zinc-500">Đang tải ảnh... {uploadProgress}%</p>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={loading || isUploading}
            className="px-4 py-2 rounded-full text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="banner-form"
            disabled={loading || isUploading}
            className="px-4 py-2 rounded-full text-sm font-medium bg-brand text-white hover:bg-brand-hover transition flex items-center gap-2"
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
