import env from "./env";
import { apiFetch, apiPost } from "./apiClient";
import type { Product } from "./products";

export type ApiProduct = {
  id: string;
  sku?: string;
  name: string;
  slug: string;
  images?: Array<{ url?: string; position?: number }>;
  brand?: string;
  category?: string;
  image?: string;
  badge?: string;
  rating?: number;
  reviews?: number;
  shortDescription?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  price: number | string;
  salePrice?: number | string | null;
  stock?: number;
  status?: string;
  isFeatured?: boolean;
  categoryId?: string | null;
  brandId?: string | null;
  createdAt?: string;
};

export type ApiCartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number | string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    thumbnailUrl?: string | null;
    status?: string;
  };
};

export type ApiCart = {
  id: string;
  userId: string;
  items: ApiCartItem[];
  totalItems: number;
  subtotal: number;
  total: number;
  itemCount: number;
};

export type ApiOrderItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number | string;
  quantity: number;
  totalPrice: number | string;
};

export type ApiOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  items: ApiOrderItem[];
};

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
};
export type ApiBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive?: boolean;
};
export type LicenseKey = {
  orderItemId: string;
  productId: string;
  productName: string;
  key: string;
};
export type ApiBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  isActive?: boolean;
  position?: string | null;
};

export async function listProducts(params = ""): Promise<{ data: ApiProduct[] }> {
  const res = await apiFetch<{ data: ApiProduct[] } | ApiProduct[]>(`/api/products${params}`);
  return { data: unwrapList(res) };
}
export const getProductBySlug = (slug: string) =>
  apiFetch<ApiProduct>(`/api/products/${slug}`).catch(() => null);
export const getProductById = (id: string) =>
  apiFetch<ApiProduct>(`/api/products/id/${id}`).catch(() => null);
export const listFeaturedProducts = () => apiFetch<ApiProduct[]>("/api/products/featured");
export const listBanners = () => apiFetch<ApiBanner[]>("/api/banners");
export const listCategories = () =>
  apiFetch<{ data: ApiCategory[] } | ApiCategory[]>("/api/categories?pageSize=100");
export const getCategoryBySlug = (slug: string) =>
  apiFetch<ApiCategory>(`/api/categories/${slug}`).catch(() => null);
export const listBrands = () =>
  apiFetch<{ data: ApiBrand[] } | ApiBrand[]>("/api/brands?pageSize=100");
export const getCart = () => apiFetch<ApiCart>("/api/cart", { credentials: "include" });
export const addCartItem = (productId: string, quantity: number) =>
  apiPost<ApiCart>("/api/cart/items", { productId, quantity }, { credentials: "include" });
export const updateCartItem = (itemId: string, quantity: number) =>
  apiFetch<ApiCart>(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: { quantity },
    credentials: "include",
  });
export const removeCartItem = (itemId: string) =>
  apiFetch<ApiCart>(`/api/cart/items/${itemId}`, { method: "DELETE", credentials: "include" });
export const clearCart = () =>
  apiFetch<{ success: boolean }>("/api/cart", { method: "DELETE", credentials: "include" });
export const createOrder = (payload?: {
  productId?: string;
  quantity?: number;
  couponCode?: string;
}) => apiPost<ApiOrder>("/api/orders", payload ?? {}, { credentials: "include" });
export const listOrders = () => apiFetch<ApiOrder[]>("/api/orders", { credentials: "include" });
export const getOrder = (id: string) =>
  apiFetch<ApiOrder>(`/api/orders/${id}`, { credentials: "include" });
export const payOrder = (id: string, customerEmail?: string) =>
  apiPost<ApiOrder>(`/api/orders/${id}/pay`, { customerEmail }, { credentials: "include" });
export const getLicenseKeys = (id: string) =>
  apiFetch<LicenseKey[]>(`/api/orders/${id}/license-keys`, { credentials: "include" });

export async function listActiveCoupons(): Promise<
  Array<{ id: string; code: string; discountPercent: number; active: boolean }>
> {
  try {
    const res = await apiFetch<any>("/api/store/coupons");
    return Array.isArray(res) ? res : res?.data || [];
  } catch {
    return [
      { id: "cp1", code: "GIAM10", discountPercent: 10, active: true },
      { id: "cp2", code: "NAMNGUYEN20", discountPercent: 20, active: true },
    ];
  }
}

export function unwrapList<T>(value: { data: T[] } | T[]): T[] {
  return Array.isArray(value) ? value : value.data;
}

export function cleanImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim();
  if (clean.includes("example.com")) return "";

  if (clean.includes(",")) {
    const parts = clean
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !s.includes("example.com"));
    clean = parts[0] || "";
  }

  if (!clean || clean.includes("example.com")) return "";

  const apiBase = env.apiBaseUrl.replace(/\/$/, "");

  if (clean.includes("/api/upload/object")) {
    const idx = clean.indexOf("/api/upload/object");
    let single = clean.slice(idx);
    if (single.includes(",")) {
      single = single.split(",")[0].trim();
    }
    return `${apiBase}${single}`;
  }

  if (clean.includes("/api/admin/upload/object")) {
    const idx = clean.indexOf("/api/admin/upload/object");
    let single = clean.slice(idx);
    if (single.includes(",")) {
      single = single.split(",")[0].trim();
    }
    return `${apiBase}${single}`;
  }

  if (clean.startsWith("uploads/")) {
    return `${apiBase}/api/upload/object?key=${encodeURIComponent(clean)}`;
  }

  if (clean.startsWith("/api/")) {
    return `${apiBase}${clean}`;
  }

  return clean;
}

export function toProduct(item: ApiProduct, fallback?: Product): Product {
  const categorySlug =
    typeof item.category === "string"
      ? item.category
      : ((item.category as any)?.slug ??
        (item.categoryId === "seed-category-windows"
          ? "windows"
          : item.categoryId === "seed-category-office"
            ? "office"
            : item.categoryId === "seed-category-antivirus"
              ? "antivirus"
              : (item.categoryId ?? fallback?.category ?? "")));

  const brandName =
    typeof item.brand === "string"
      ? item.brand
      : ((item.brand as any)?.name ??
        (item.brand as any)?.slug ??
        item.brandId ??
        fallback?.brand ??
        "");

  const defaultCategoryImages: Record<string, string> = {
    windows:
      "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&auto=format&fit=crop&q=80",
    office:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
    antivirus:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
  };
  const categoryFallback = defaultCategoryImages[categorySlug] || defaultCategoryImages.windows;

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    brand: brandName,
    category: categorySlug,
    categoryId: item.categoryId,
    brandId: item.brandId,
    price: Number(item.salePrice ?? item.price),
    compareAt: item.salePrice ? Number(item.price) : fallback?.compareAt,
    rating: item.rating ?? fallback?.rating ?? 0,
    reviews: item.reviews ?? fallback?.reviews ?? 0,
    sales: fallback?.sales,
    image:
      cleanImageUrl(item.thumbnailUrl) ||
      cleanImageUrl(item.image) ||
      fallback?.image ||
      categoryFallback,
    badge: item.badge ?? fallback?.badge,
    stock: item.stock ?? 0,
    shortDescription: item.shortDescription ?? "",
    description: item.description ?? fallback?.description ?? "",
    platforms: fallback?.platforms ?? [],
    specs: fallback?.specs ?? [],
  } as unknown as Product & { shortDescription?: string };
}

export async function uploadImage(
  file: File,
  folder?: string,
): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) {
    formData.append("folder", folder);
  }
  const endpoint = folder
    ? `/api/admin/upload/image?folder=${encodeURIComponent(folder)}`
    : "/api/admin/upload/image";

  let res = await fetch(endpoint, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const fallbackEndpoint = folder
      ? `/api/upload/image?folder=${encodeURIComponent(folder)}`
      : "/api/upload/image";
    res = await fetch(fallbackEndpoint, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Tải ảnh lên thất bại" }));
    throw new Error(err.message || err.error || `Tải ảnh thất bại (${res.status})`);
  }

  const json = await res.json();
  // Bóc tách linh hoạt từ các cấp data khác nhau
  const rawObj = json.data?.data || json.data || json;
  const rawUrl = rawObj.url || rawObj.imageUrl || rawObj.objectKey || "";
  const fileId = rawObj.id || rawObj.uploadId || "";

  const finalUrl = cleanImageUrl(rawUrl);

  if (!finalUrl) {
    throw new Error("Không nhận được đường dẫn ảnh hợp lệ từ máy chủ");
  }

  return { id: fileId, url: finalUrl };
}

export async function deleteUploadedFile(id: string): Promise<void> {
  await fetch(`/api/admin/upload/${id}`, { method: "DELETE", credentials: "include" });
}
