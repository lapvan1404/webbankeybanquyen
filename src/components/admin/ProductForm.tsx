import React, { useState } from "react";
import { X } from "lucide-react";
import { ImageUploader, ImageItem } from "./ImageUploader";

type ProductFormInput = {
  name?: string;
  sku?: string;
  slug?: string;
  price?: number | string;
  salePrice?: number | string | null;
  stock?: number | string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  thumbnailUrl?: string | null;
  image?: string | null;
  images?: Array<{ url: string }>;
};

type ProductFormProps = {
  product?: ProductFormInput;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

export function ProductForm({ product, categories, brands, onSave, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    slug: product?.slug || "",
    price: product?.price || "",
    salePrice: product?.salePrice || "",
    stock: product?.stock || "",
    shortDescription: product?.shortDescription || "",
    description: product?.description || "",
    categoryId: product?.categoryId || "",
    brandId: product?.brandId || "",
    status: product?.status || "active",
  });

  const [images, setImages] = useState<ImageItem[]>(() => {
    if (product?.images?.length) {
      return product.images.map((img) => ({ url: img.url }));
    }
    if (product?.thumbnailUrl) return [{ url: product.thumbnailUrl }];
    if (product?.image) return [{ url: product.image }];
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && !product
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
      const generatedSku =
        formData.sku.trim() ||
        `SKU-${(formData.slug || Date.now().toString())
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 16)}`;

      const dataToSave = {
        ...formData,
        sku: generatedSku,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        stock: Number(formData.stock),
        thumbnailUrl: images[0]?.url ?? null,
        image: images[0]?.url ?? null,
        images: images.map((img, i) => ({ url: img.url, position: i })),
      };
      await onSave(dataToSave);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-xl font-semibold">{product ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
            <ImageUploader
              images={images}
              onChange={setImages}
              maxImages={10}
              label="Ảnh sản phẩm (Tự động lưu vào thư mục R2 uploads/products/)"
              folder="products"
              disabled={loading}
              onUploadingChange={setIsUploading}
              onUploadProgressChange={setUploadProgress}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tên sản phẩm</label>
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
                <label className="block text-sm font-medium text-zinc-700 mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition bg-white"
                >
                  <option value="active">Hoạt động</option>
                  <option value="draft">Bản nháp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Giá bán</label>
                <input
                  required
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Giá khuyến mãi
                </label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Kho hàng</label>
                <input
                  required
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition bg-white"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Thương hiệu</label>
                <select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition bg-white"
                >
                  <option value="">Chọn thương hiệu</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Mô tả ngắn (Tổng quan)
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Mô tả ngắn hiển thị dưới tên sản phẩm..."
                  className="w-full rounded-lg border border-zinc-300 p-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1 flex items-center justify-between">
                  <span>Thông tin chi tiết (Hiển thị riêng bên mục Thông tin chi tiết)</span>
                  <span className="text-xs text-brand font-normal">Riêng biệt với Mô tả</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Nhập đầy đủ Thông tin chi tiết sản phẩm (Cấu hình máy yêu cầu, Điều kiện bảo hành, Hướng dẫn kích hoạt...)"
                  className="w-full rounded-lg border border-zinc-300 p-2.5 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition resize-y min-h-[100px]"
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
            form="product-form"
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
