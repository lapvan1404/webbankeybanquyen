import React, { useState } from "react";
import { X } from "lucide-react";
import { ImageUploader, ImageItem } from "./ImageUploader";

type BrandFormInput = {
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  logoUrl?: string | null;
};

type BrandFormProps = {
  brand?: BrandFormInput;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

export function BrandForm({ brand, onSave, onClose }: BrandFormProps) {
  const [formData, setFormData] = useState({
    name: brand?.name || "",
    slug: brand?.slug || "",
    description: brand?.description || "",
    website: brand?.website || "",
  });

  const [images, setImages] = useState<ImageItem[]>(() => {
    if (brand?.logoUrl) return [{ url: brand.logoUrl }];
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && !brand
        ? {
            slug: value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)+/g, ""),
          }
        : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        logoUrl: images[0]?.url ?? null,
      };
      await onSave(dataToSave);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-xl font-semibold">
            {brand ? "Sửa thương hiệu" : "Thêm thương hiệu"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <form id="brand-form" onSubmit={handleSubmit} className="space-y-4">
            <ImageUploader
              images={images}
              onChange={setImages}
              maxImages={1}
              label="Logo thương hiệu (Lưu vào uploads/brands/)"
              folder="brands"
              disabled={loading}
              onUploadingChange={setIsUploading}
              onUploadProgressChange={setUploadProgress}
            />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Tên thương hiệu
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Slug</label>
                <input
                  required
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition resize-none"
                ></textarea>
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
            form="brand-form"
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
