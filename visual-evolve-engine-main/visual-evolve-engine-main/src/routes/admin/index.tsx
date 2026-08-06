import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/layout";
import { apiFetch, apiPost, ApiError } from "@/lib/apiClient";
import { money } from "@/lib/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { BrandForm } from "@/components/admin/BrandForm";
import { BannerForm } from "@/components/admin/BannerForm";
import { CouponForm } from "@/components/admin/CouponForm";
import { KeyForm } from "@/components/admin/KeyForm";
import { ImageUploader, type ImageItem } from "@/components/admin/ImageUploader";
import { cleanImageUrl } from "@/lib/storeApi";

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore audio failure
  }
}

type DashboardStats = {
  orderCount: number;
  productCount: number;
  categoryCount: number;
  brandCount?: number;
  couponCount: number;
  keyCount?: number;
  availableKeyCount?: number;
  notificationCount: number;
  totalRevenue?: number;
};

type NotificationItem = {
  id: string;
  message: string;
  type: string;
  orderId?: string;
  createdAt: string;
  read: boolean;
};

type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

type OrderData = {
  id: string;
  orderNumber?: string;
  email: string;
  phone: string;
  note: string;
  deliveryMethod: string;
  couponCode?: string;
  total: number;
  status: "pending" | "paid" | "approved" | "cancelled";
  createdAt: string;
  items: OrderItem[];
};

type ProductData = {
  id: string;
  sku?: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categoryId?: string;
  brandId?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  image: string;
  shortDescription?: string;
  description?: string;
  badge?: string;
  status?: string;
};

type CategoryData = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  imageUrl?: string;
};
type BrandData = { id: string; slug: string; name: string; website?: string; logoUrl?: string };
type BannerData = {
  id: string;
  title: string;
  imageUrl: string;
  position: string;
  isActive: boolean;
  link?: string;
};

type CouponData = { id: string; code: string; discountPercent: number; active: boolean };

type KeyData = {
  id: string;
  productId: string;
  productName?: string;
  key: string;
  status: string;
};

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Công Ty TNHH Công Nghệ Nam Nguyễn" }] }),
  component: AdminDashboard,
});

const sections = [
  "dashboard",
  "notifications",
  "orders",
  "analytics",
  "products",
  "categories",
  "brands",
  "banners",
  "featured-images",
  "coupons",
  "keys",
] as const;

type Section = (typeof sections)[number];

function AdminDashboard() {
  const navigate = useNavigate();
  const prevOrdersMap = useRef<Map<string, string>>(new Map());
  const isFirstLoadRef = useRef(true);
  const [active, setActive] = useState<Section>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandData | null>(null);
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);
  const [isKeyFormOpen, setIsKeyFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<KeyData | null>(null);
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showFeaturedMenu, setShowFeaturedMenu] = useState(false);

  const [modalOrder, setModalOrder] = useState<OrderData | null>(null);
  const [modalOrderKeys, setModalOrderKeys] = useState<{ productName: string; key: string }[]>([]);
  const [loadingModalKeys, setLoadingModalKeys] = useState(false);
  const [orderFilterTab, setOrderFilterTab] = useState<"all" | "pending" | "paid" | "approved" | "cancelled">("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  const openOrderDetailModal = async (order: OrderData) => {
    setModalOrder(order);
    setLoadingModalKeys(true);
    setModalOrderKeys([]);
    try {
      const res = await apiFetch<any>(`/api/admin/orders/${order.id}/license-keys`, {
        credentials: "include",
      });
      const keyList = Array.isArray(res) ? res : res?.data || [];
      setModalOrderKeys(keyList);
    } catch {
      // fallback
    } finally {
      setLoadingModalKeys(false);
    }
  };

  const analyticsDayTotal = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return orders
      .filter((order) => order.status === "approved" && new Date(order.createdAt) >= startOfDay)
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [orders]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const tabLabel = useMemo(
    () =>
      ({
        dashboard: "Tổng quan",
        notifications: "Thông báo",
        orders: "Đơn hàng",
        analytics: "Thống Kê",
        products: "Sản phẩm",
        categories: "Danh mục",
        brands: "Thương hiệu",
        banners: "Banners",
        "featured-images": "Quản lý Ảnh nổi bật",
        coupons: "Mã giảm giá",
        keys: "Khoá",
      }) as const,
    [],
  );

  function getStatusLabel(status: string) {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "paid":
        return "Đã thanh toán";
      case "approved":
        return "Đã duyệt";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  }

  function getOrderLabel(order: OrderData) {
    const names = order.items.map((item) => item.name).filter(Boolean);
    if (names.length === 0) return order.id;
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1} sản phẩm`;
  }

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch<DashboardStats>("/api/admin/dashboard", {
        credentials: "include",
      });
      setStats(data);
    } catch {
      // ignore failed dashboard fetch
    }
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const editSlug = params.get("editCategory");
      if (!editSlug) return;
      (async () => {
        try {
          const data = await apiFetch<CategoryData[]>("/api/admin/categories", { credentials: "include" });
          setCategories(data);
          const found = data.find((c) => c.slug === editSlug || c.id === editSlug);
          if (found) {
            setEditingCategory(found);
            setIsCategoryFormOpen(true);
            setActive("categories");
          }
        } catch (e) {
          // ignore
        }
      })();
    } catch {
      // ignore
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/api/admin/notifications", {
        credentials: "include",
      });
      const data = Array.isArray(res) ? res : res?.data || [];
      setNotifications(data);
    } catch {
      // ignore notification failure
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/api/admin/orders", {
        credentials: "include",
      });
      const rawList = Array.isArray(res) ? res : res?.data || [];
      const normalized: OrderData[] = rawList.map((o: any) => {
        const statusMap: Record<string, "pending" | "paid" | "approved" | "cancelled"> = {
          PENDING: "pending",
          UNPAID: "pending",
          PAID: "paid",
          APPROVED: "approved",
          CANCELLED: "cancelled",
        };
        const status =
          statusMap[o.status] ||
          statusMap[o.paymentStatus] ||
          (typeof o.status === "string" ? o.status.toLowerCase() : "pending");

        return {
          id: o.id,
          orderNumber: o.orderNumber || o.id,
          email: o.user?.email || o.customerEmail || o.email || "Khách mua hàng",
          phone: o.user?.phone || o.customerPhone || o.phone || "0383158080",
          note: o.note || "Không có",
          deliveryMethod: o.deliveryMethod || "email",
          couponCode: o.couponCode,
          total: Number(o.totalAmount ?? o.total ?? 0),
          status: status as "pending" | "paid" | "approved" | "cancelled",
          createdAt: o.createdAt || new Date().toISOString(),
          items: (o.items || o.orderitem || []).map((it: any) => ({
            productId: it.productId || it.id,
            name: it.productName || it.name || "Sản phẩm bản quyền",
            qty: Number(it.quantity ?? it.qty ?? 1),
            price: Number(it.unitPrice ?? it.price ?? 0),
          })),
        };
      });

      if (!isFirstLoadRef.current) {
        for (const order of normalized) {
          const prevStatus = prevOrdersMap.current.get(order.id);
          if (!prevStatus) {
            playNotificationSound();
            toast.success(
              `🔔 ĐƠN HÀNG MỚI: #${order.orderNumber || order.id.slice(0, 8)} (${money(order.total || 0)})`,
              { duration: 6000 },
            );
          } else if (
            prevStatus !== order.status &&
            (order.status === "paid" || order.status === "approved")
          ) {
            playNotificationSound();
            toast.success(
              `✅ Đơn hàng #${order.orderNumber || order.id.slice(0, 8)} vừa THANH TOÁN THÀNH CÔNG!`,
              { duration: 6000 },
            );
          }
        }
      }
      const nextMap = new Map<string, string>();
      for (const order of normalized) {
        nextMap.set(order.id, order.status);
      }
      prevOrdersMap.current = nextMap;
      isFirstLoadRef.current = false;
      setOrders(normalized);
    } catch {
      // ignore order fetch failure
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      let res = await apiFetch<any>("/api/admin/products", { credentials: "include" }).catch(() => null);
      if (!res) {
        res = await apiFetch<any>("/api/products?pageSize=100").catch(() => null);
      }
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];
      const normalized: ProductData[] = rawList.map((p: any) => ({
        id: p.id,
        sku: p.sku || "",
        slug: p.slug || p.id,
        name: p.name,
        brand: typeof p.brand === "string" ? p.brand : p.brand?.name || p.brandId || "",
        category: typeof p.category === "string" ? p.category : p.category?.name || p.categoryId || "",
        categoryId: p.categoryId || (typeof p.category === "object" ? p.category?.id : ""),
        brandId: p.brandId || (typeof p.brand === "object" ? p.brand?.id : ""),
        price: Number(p.price ?? 0),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        stock: Number(p.stock ?? 10),
        image: p.thumbnailUrl || p.image || (p.images && p.images[0]?.url) || "",
        shortDescription: p.shortDescription || "",
        description: p.description || "",
        status: p.status || "active",
      }));
      setProducts(normalized);
    } catch {
      // ignore product fetch failure
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      let res = await apiFetch<any>("/api/admin/categories", { credentials: "include" }).catch(() => null);
      if (!res) {
        res = await apiFetch<any>("/api/categories?pageSize=100").catch(() => null);
      }
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];
      setCategories(rawList);
    } catch {
      // ignore category fetch failure
    }
  }, []);

  const loadBrands = useCallback(async () => {
    try {
      let res = await apiFetch<any>("/api/admin/brands", { credentials: "include" }).catch(() => null);
      if (!res) {
        res = await apiFetch<any>("/api/brands?pageSize=100").catch(() => null);
      }
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];
      setBrands(rawList);
    } catch {
      // ignore
    }
  }, []);

  const loadBanners = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/api/admin/banners", {
        credentials: "include",
      });
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];
      const normalized = rawList
        .filter((item: any) => item && typeof item === "object")
        .map((item: Record<string, any>) => {
          const position =
            item.position ||
            item.subtitle ||
            item.tieu_de_phu ||
            (item.type === "poster" ? "sidebar" : "hero");
          const active =
            item.isActive !== undefined
              ? Boolean(item.isActive)
              : item.active !== undefined
                ? Boolean(item.active)
                : item.hoat_dong !== undefined
                  ? Boolean(item.hoat_dong)
                  : true;
          return {
            id: String(item.id ?? ""),
            title: String(item.title ?? item.tieu_de ?? "Banner"),
            imageUrl: String(item.imageUrl ?? item.url_hinh_anh ?? item.image ?? ""),
            position: String(position),
            isActive: active,
            link: typeof item.linkUrl === "string" ? item.linkUrl : typeof item.link === "string" ? item.link : "",
          } satisfies BannerData;
        });
      setBanners(normalized);
    } catch {
      // ignore
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/api/admin/coupons", {
        credentials: "include",
      });
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];
      setCoupons(rawList);
    } catch {
      // ignore coupon fetch failure
    }
  }, []);

  const loadKeys = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/api/admin/keys", {
        credentials: "include",
      });
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];
      setKeys(rawList);
    } catch {
      // ignore key fetch failure
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        await apiFetch("/api/admin/session", { credentials: "include" });
      } catch {
        navigate({ to: "/admin/login" });
        return;
      }
      await Promise.all([
        loadStats(),
        loadNotifications(),
        loadOrders(),
        loadProducts(),
        loadCategories(),
        loadBrands(),
        loadBanners(),
        loadCoupons(),
        loadKeys(),
      ]);
      setLoading(false);
    };
    loadSession();
    const source = new EventSource("/api/admin/notifications/stream", {
      withCredentials: true,
    } as EventSourceInit);
    source.onopen = () => setSseConnected(true);
    source.onerror = () => setSseConnected(false);
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as NotificationItem;
      setNotifications((current) => [payload, ...current]);
      setStats((current) =>
        current ? { ...current, notificationCount: current.notificationCount + 1 } : current,
      );
    };
    setEventSource(source);

    const pollTimer = setInterval(() => {
      loadNotifications();
      loadOrders();
      loadStats();
    }, 3000);

    return () => {
      source.close();
      clearInterval(pollTimer);
    };
  }, [
    navigate,
    loadStats,
    loadNotifications,
    loadOrders,
    loadProducts,
    loadCategories,
    loadBrands,
    loadBanners,
    loadCoupons,
    loadKeys,
  ]);

  useEffect(() => {
    const pollId = window.setInterval(() => {
      loadOrders();
      loadNotifications();
      loadStats();
    }, 2500);
    return () => window.clearInterval(pollId);
  }, [loadOrders, loadNotifications, loadStats]);

  const markNotificationRead = async (id: string) => {
    try {
      await apiPost(`/api/admin/notifications/${id}/read`, {}, { credentials: "include" });
    } catch {
      // fallback
    }
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
    setStats((current) =>
      current
        ? { ...current, notificationCount: Math.max(0, current.notificationCount - 1) }
        : current,
    );
    toast.success("Đã đánh dấu đã đọc!");
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiPost(`/api/admin/notifications/read-all`, {}, { credentials: "include" });
    } catch {
      // fallback
    }
    setNotifications((current) =>
      current.map((n) => ({ ...n, read: true })),
    );
    setStats((current) =>
      current ? { ...current, notificationCount: 0 } : current,
    );
    toast.success("Đã đánh dấu TẤT CẢ thông báo là đã đọc!");
  };

  const viewOrderFromNotification = async (orderId?: string, notificationId?: string) => {
    if (!orderId) return;
    if (notificationId) await markNotificationRead(notificationId);
    let order = orders.find((o) => o.id === orderId) as OrderData | undefined;
    if (!order) {
      await loadOrders();
      order = orders.find((o) => o.id === orderId);
    }
    if (order) setSelectedOrder(order);
    setActive("orders");
  };

  const updateOrderStatus = async (id: string, newStatus: OrderData["status"]) => {
    try {
      const statusMap: Record<string, string> = {
        approved: "APPROVED",
        paid: "PAID",
        cancelled: "CANCELLED",
        pending: "PENDING",
      };
      const apiStatus = statusMap[newStatus] || newStatus.toUpperCase();
      await apiFetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        credentials: "same-origin",
        body: { status: apiStatus },
      });
      toast.success("Cập nhật trạng thái đơn hàng thành công!");
      await loadOrders();
      loadStats();
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const handleLogout = async () => {
    try {
      await apiPost("/api/admin/logout", null, { credentials: "same-origin" });
    } catch {
      // ignore logout failures
    }
    navigate({ to: "/admin/login" });
  };

  const createItem = async (path: string, body: unknown, reload: () => Promise<void>): Promise<boolean> => {
    try {
      await apiPost(path, body);
      toast.success("Thêm mới thành công");
      await reload();
      loadStats();
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Thêm mới thất bại");
      return false;
    }
  };

  const updateItem = async (path: string, body: unknown, reload: () => Promise<void>): Promise<boolean> => {
    try {
      await apiFetch(path, { method: "PUT", body });
      toast.success("Cập nhật thành công");
      await reload();
      loadStats();
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật thất bại");
      return false;
    }
  };

  const deleteItem = async (path: string, reload: () => Promise<void>): Promise<boolean> => {
    try {
      await apiFetch(path, { method: "DELETE" });
      toast.success("Xóa thành công");
      await reload();
      loadStats();
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Xóa thất bại");
      return false;
    }
  };

  if (loading) {
    return (
      <Layout hideHeaderFooter>
        <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-white">
          <div className="flex items-center gap-3">
            <Loader2 className="size-6 animate-spin text-emerald-500" />
            <span className="text-sm font-medium">Đang tải dữ liệu Bảng Điều Khiển Admin...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideHeaderFooter>
      {/* ── TOP HEADER ADMIN PORTAL ĐỘC LẬP NỀN MÃ MÀU #35B7BC ──────────── */}
      <header className="bg-[#35B7BC] text-white sticky top-0 z-50 shadow-lg border-b border-black/10">
        <div className="max-w-[1536px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-white text-[#35B7BC] flex items-center justify-center font-extrabold shadow-md text-lg">
              N
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                ADMIN PORTAL
                <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/30">
                  v2.0
                </span>
              </span>
              <span className="text-[11px] text-white/80 block -mt-0.5 font-medium">Công Ty TNHH Công Nghệ Nam Nguyễn</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white bg-white/15 px-3.5 py-1.5 rounded-full border border-white/25">
              <span className={`size-2 rounded-full ${sseConnected ? "bg-emerald-300 animate-pulse" : "bg-amber-300"}`} />
              <span className="font-mono font-semibold">{sseConnected ? "SSE REALTIME LIVE" : "SSE CONNECTING..."}</span>
            </div>

            <Link
              to="/"
              className="text-xs font-semibold text-white hover:bg-white hover:text-[#35B7BC] transition px-3.5 py-2 rounded-xl bg-white/15 border border-white/25 flex items-center gap-1.5 shadow-sm"
            >
              <span>🌐</span> Xem Màn Khách Hàng
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold transition duration-200 shadow-md"
            >
              Đăng xuất Admin
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-zinc-500">
              Bảng điều khiển Admin
            </p>
            <h1 className="text-3xl font-bold text-zinc-900">Quản trị Công Ty TNHH Công Nghệ Nam Nguyễn</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {sections.map((section) => {
            const isNotifications = section === "notifications";
            const hasUnread = isNotifications && unreadNotificationCount > 0;

            return (
              <button
                key={section}
                onClick={() => {
                  setActive(section);
                  if (isNotifications && hasUnread) {
                    markAllNotificationsRead();
                  }
                }}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition cursor-pointer ${
                  active === section
                    ? "bg-[#35B7BC] text-white shadow-md shadow-[#35B7BC]/20 font-semibold"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                <span>{tabLabel[section]}</span>
                {hasUnread && (
                  <span className="inline-flex items-center justify-center bg-red-500 text-white font-extrabold text-[10px] h-5 min-w-[20px] px-1.5 rounded-full shadow-md animate-pulse">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {active === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { key: "orders", label: "Đơn hàng", value: stats?.orderCount ?? orders.length },
              {
                key: "analytics",
                label: "Doanh Thu Thực",
                value: money(stats?.totalRevenue ?? orders.filter((o) => o.status === "paid" || o.status === "approved").reduce((s, o) => s + (o.total || 0), 0)),
                isMoney: true,
              },
              { key: "products", label: "Sản phẩm", value: stats?.productCount ?? products.length },
              { key: "categories", label: "Danh mục", value: stats?.categoryCount ?? categories.length },
              { key: "brands", label: "Thương hiệu", value: stats?.brandCount ?? brands.length },
              { key: "coupons", label: "Mã giảm giá", value: stats?.couponCount ?? coupons.length },
              { key: "keys", label: "Khoá bản quyền", value: stats?.keyCount ?? keys.length },
              {
                key: "notifications",
                label: "Thông báo chưa đọc",
                value: stats?.notificationCount ?? notifications.filter((n) => !n.read).length,
              },
            ].map((card) => (
              <div
                key={card.key}
                onClick={() => setActive(card.key as Section)}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-3xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md hover:border-brand/40 transition group"
              >
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-3 group-hover:text-brand transition flex items-center justify-between">
                  <span>{card.label}</span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-brand font-medium">Xem ➔</span>
                </p>
                <p className="text-3xl font-bold text-zinc-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {active === "analytics" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Thống Kê</h2>
            <AnalyticsView orders={orders} />
          </div>
        )}

        {active === "notifications" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Quản lý Thông Báo</h2>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  {notifications.some((n) => !n.read) && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-2 text-xs font-semibold transition cursor-pointer"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await apiFetch("/api/admin/notifications", { method: "DELETE" });
                      } catch {}
                      setNotifications([]);
                      toast.success("Đã xóa sạch tất cả thông báo!");
                    }}
                    className="rounded-full bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 text-xs font-semibold transition cursor-pointer"
                  >
                    Xóa tất cả thông báo
                  </button>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Chưa đọc</h3>
              <div className="space-y-4">
                {notifications
                  .filter((n) => !n.read)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-3xl border p-4 ${notification.read ? "border-zinc-200 bg-zinc-50" : "border-brand bg-white"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{notification.message}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => markNotificationRead(notification.id)}
                            className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white"
                          >
                            Đã đọc
                          </button>
                          {notification.orderId && (
                            <button
                              onClick={() =>
                                viewOrderFromNotification(notification.orderId, notification.id)
                              }
                              className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                            >
                              Xem đơn
                            </button>
                          )}
                        </div>
                      </div>
                      {selectedOrder && notification.orderId === selectedOrder.id && (
                        <div className="mt-4 rounded-2xl border p-4 bg-zinc-50">
                          <p className="font-semibold">Sản phẩm: {getOrderLabel(selectedOrder)}</p>
                          <p className="text-sm">
                            Khách: {selectedOrder.email} · {selectedOrder.phone}
                          </p>
                          <div className="mt-2 space-y-2 text-sm text-zinc-700">
                            {selectedOrder.items.map((it) => (
                              <div key={it.productId} className="flex justify-between">
                                <span>
                                  {it.name} x{it.qty}
                                </span>
                                <span>
                                  {new Intl.NumberFormat("vi-VN").format(it.price * it.qty)}₫
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between font-semibold mt-2">
                              <span>Tổng</span>
                              <span>
                                {new Intl.NumberFormat("vi-VN").format(selectedOrder.total)}₫
                              </span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              {selectedOrder.status !== "approved" &&
                              selectedOrder.status !== "cancelled" ? (
                                <>
                                  <button
                                    onClick={() => updateOrderStatus(selectedOrder.id, "approved")}
                                    className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                                    className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600"
                                  >
                                    Hủy
                                  </button>
                                </>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-sm font-semibold text-zinc-700">
                                  Trạng thái:{" "}
                                  {selectedOrder.status === "approved" ? "Đã duyệt" : "Đã hủy"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Đã đọc</h3>
              <div className="space-y-4">
                {notifications
                  .filter((n) => n.read)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-3xl border p-4 border-zinc-200 bg-zinc-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{notification.message}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {notification.orderId && (
                          <button
                            onClick={() =>
                              viewOrderFromNotification(notification.orderId, notification.id)
                            }
                            className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                          >
                            Xem đơn
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {active === "orders" && (
          <div className="space-y-6">
            {/* Header & Filter Controls */}
            <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Quản lý Đơn hàng ({orders.length})</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Click vào từng đơn hàng để xem chi tiết thông tin mua & mã key bản quyền</p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Tìm theo Mã đơn, Email, SĐT..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="bg-zinc-50 ring-1 ring-zinc-200 focus:ring-brand rounded-full px-4 py-2 text-xs w-full md:w-72 outline-none transition"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                {[
                  { id: "all", label: `Tất cả (${orders.length})` },
                  { id: "pending", label: `Cần duyệt / Chờ (${orders.filter((o) => o.status === "pending").length})` },
                  { id: "paid", label: `Đã thanh toán (${orders.filter((o) => o.status === "paid").length})` },
                  { id: "approved", label: `Đã duyệt (${orders.filter((o) => o.status === "approved").length})` },
                  { id: "cancelled", label: `Đã hủy (${orders.filter((o) => o.status === "cancelled").length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderFilterTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      orderFilterTab === tab.id
                        ? "bg-zinc-900 text-white shadow"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table List */}
            <div className="bg-white rounded-3xl ring-1 ring-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200">
                      <th className="py-3.5 px-4">Mã đơn hàng</th>
                      <th className="py-3.5 px-4">Khách hàng (Gmail / SĐT)</th>
                      <th className="py-3.5 px-4">Sản phẩm</th>
                      <th className="py-3.5 px-4">Tổng tiền</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4">Ngày đặt</th>
                      <th className="py-3.5 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {orders
                      .filter((o) => {
                        if (orderFilterTab !== "all" && o.status !== orderFilterTab) return false;
                        if (!orderSearchQuery.trim()) return true;
                        const q = orderSearchQuery.toLowerCase();
                        return (
                          (o.orderNumber || "").toLowerCase().includes(q) ||
                          (o.email || "").toLowerCase().includes(q) ||
                          (o.phone || "").toLowerCase().includes(q)
                        );
                      })
                      .map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => openOrderDetailModal(order)}
                          className="hover:bg-zinc-50/80 cursor-pointer transition"
                        >
                          <td className="py-3.5 px-4 font-bold text-zinc-900">
                            #{order.orderNumber || order.id.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-zinc-900">{order.email}</p>
                            <p className="text-[11px] text-zinc-500">{order.phone || "Chưa có SĐT"}</p>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-zinc-800 max-w-xs truncate">
                            {getOrderLabel(order)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">
                            {money(order.total || 0)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-block ${
                                order.status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : order.status === "approved"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                            {new Date(order.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openOrderDetailModal(order);
                              }}
                              className="bg-brand/10 hover:bg-brand/20 text-brand font-semibold px-3 py-1 rounded-full text-[11px] transition cursor-pointer"
                            >
                              👁️ Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {active === "products" && (
          <AdminCollection<ProductData>
            items={products}
            fields={["name", "brand", "category", "price", "stock"]}
            onCreate={async () => {
              setEditingProduct(null);
              setIsProductFormOpen(true);
            }}
            onEdit={async (item) => {
              setEditingProduct(item);
              setIsProductFormOpen(true);
            }}
            onDelete={async (item) => {
              await deleteItem(`/api/admin/products/${item.id}`, loadProducts);
            }}
          />
        )}

        {active === "categories" && (
          <AdminCollection<CategoryData>
            items={categories}
            fields={["name", "slug"]}
            onCreate={async () => {
              setEditingCategory(null);
              setIsCategoryFormOpen(true);
            }}
            onEdit={async (item) => {
              setEditingCategory(item);
              setIsCategoryFormOpen(true);
            }}
            onDelete={async (item) => {
              await deleteItem(`/api/admin/categories/${item.id}`, loadCategories);
            }}
          />
        )}

        {active === "brands" && (
          <AdminCollection<BrandData>
            items={brands}
            fields={["name", "slug", "website"]}
            onCreate={async () => {
              setEditingBrand(null);
              setIsBrandFormOpen(true);
            }}
            onEdit={async (item) => {
              setEditingBrand(item);
              setIsBrandFormOpen(true);
            }}
            onDelete={async (item) => {
              await deleteItem(`/api/admin/brands/${item.id}`, loadBrands);
            }}
          />
        )}

        {active === "banners" && (
          <HeroBannerAdminManager
            banners={banners}
            loadBanners={loadBanners}
            updateItem={updateItem}
            createItem={createItem}
            onOpenForm={() => {
              setEditingBanner(null);
              setIsBannerFormOpen(true);
            }}
            onEdit={(item) => {
              setEditingBanner(item);
              setIsBannerFormOpen(true);
            }}
            onDelete={async (item) => {
              await deleteItem(`/api/admin/banners/${item.id}`, loadBanners);
            }}
          />
        )}

        {active === "featured-images" && (
          <FeaturedImagesAdminManager
            banners={banners}
            loadBanners={loadBanners}
            updateItem={updateItem}
            createItem={createItem}
          />
        )}

        {active === "coupons" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Quản lý Mã Giảm Giá ({coupons.length})</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Tạo và kích hoạt các mã ưu đãi chiết khấu % cho khách hàng</p>
              </div>
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setIsCouponFormOpen(true);
                }}
                className="bg-brand hover:bg-brand-hover text-white font-bold px-4 py-2.5 rounded-full text-xs transition shadow-md cursor-pointer"
              >
                + Thêm Mã Giảm Giá
              </button>
            </div>

            <div className="bg-white rounded-3xl ring-1 ring-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200">
                      <th className="py-3.5 px-4">Mã Coupon</th>
                      <th className="py-3.5 px-4">Mức giảm (%)</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-sm text-zinc-900 tracking-wider">
                          🏷️ {c.code}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-600">
                          {c.discountPercent}%
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-block ${
                              c.active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {c.active ? "✓ Đang kích hoạt" : "Tắt / Tạm ngưng"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingCoupon(c);
                              setIsCouponFormOpen(true);
                            }}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold px-3 py-1 rounded-full text-[11px] transition cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={async () => {
                              await updateItem(`/api/admin/coupons/${c.id}`, { active: !c.active }, loadCoupons);
                            }}
                            className={`font-semibold px-3 py-1 rounded-full text-[11px] transition cursor-pointer ${
                              c.active ? "bg-amber-100 hover:bg-amber-200 text-amber-800" : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                            }`}
                          >
                            {c.active ? "Tắt" : "Bật"}
                          </button>
                          <button
                            onClick={async () => {
                              await deleteItem(`/api/admin/coupons/${c.id}`, loadCoupons);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-full text-[11px] transition cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {active === "keys" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Kho Key Bản Quyền ({keys.length})</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Quản lý các mã key được tự động trả về cho khách hàng khi hoàn tất đơn hàng</p>
              </div>
              <button
                onClick={() => {
                  setEditingKey(null);
                  setIsKeyFormOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-full text-xs transition shadow-md cursor-pointer"
              >
                + Thêm Key Bản Quyền
              </button>
            </div>

            <div className="bg-white rounded-3xl ring-1 ring-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200">
                      <th className="py-3.5 px-4">Mã Key Bản Quyền</th>
                      <th className="py-3.5 px-4">Sản phẩm áp dụng</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {keys.map((k) => (
                      <tr key={k.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-zinc-900 text-emerald-400 px-3 py-1.5 rounded-xl tracking-wider">
                              {k.key}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(k.key);
                                toast.success(`Đã sao chép: ${k.key}`);
                              }}
                              className="text-[11px] text-zinc-500 hover:text-zinc-900 font-semibold cursor-pointer underline"
                            >
                              Sao chép
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-800">
                          {k.productName || products.find((p) => p.id === k.productId)?.name || k.productId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-block ${
                              k.status === "AVAILABLE" || k.status === "available"
                                ? "bg-emerald-100 text-emerald-800"
                                : k.status === "SOLD" || k.status === "used"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {k.status === "AVAILABLE" || k.status === "available"
                              ? "✓ Sẵn sàng (Chưa bán)"
                              : k.status === "SOLD" || k.status === "used"
                                ? "Đã bán / Đã cấp"
                                : "Khóa / Đã hủy"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingKey(k);
                              setIsKeyFormOpen(true);
                            }}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold px-3 py-1 rounded-full text-[11px] transition cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={async () => {
                              await deleteItem(`/api/admin/keys/${k.id}`, loadKeys);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-full text-[11px] transition cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {isProductFormOpen && (
          <ProductForm
            product={
              editingProduct
                ? {
                    ...editingProduct,
                    categoryId:
                      categories.find((item) => item.slug === editingProduct.category)?.id || "",
                    brandId:
                      brands.find((item) => item.name === editingProduct.brand)?.id || "",
                  }
                : undefined
            }
            categories={categories.map((item) => ({ id: item.id, name: item.name }))}
            brands={brands.map((item) => ({ id: item.id, name: item.name }))}
            onSave={async (data) => {
              const payload = {
                ...data,
                status:
                  typeof data.status === "string"
                    ? data.status.toUpperCase()
                    : "ACTIVE",
                categoryId:
                  typeof data.categoryId === "string" && data.categoryId
                    ? data.categoryId
                    : null,
                brandId:
                  typeof data.brandId === "string" && data.brandId
                    ? data.brandId
                    : null,
              };

              let ok = false;
              if (editingProduct) {
                ok = await updateItem(`/api/admin/products/${editingProduct.id}`, payload, loadProducts);
              } else {
                ok = await createItem("/api/admin/products", payload, loadProducts);
              }

              if (ok) {
                setIsProductFormOpen(false);
                setEditingProduct(null);
              }
            }}
            onClose={() => {
              setIsProductFormOpen(false);
              setEditingProduct(null);
            }}
          />
        )}

        {isBrandFormOpen && (
          <BrandForm
            brand={editingBrand ?? undefined}
            onSave={async (data) => {
              const payload = {
                name: typeof data.name === "string" ? data.name : "",
                slug: typeof data.slug === "string" ? data.slug : "",
                website: typeof data.website === "string" ? data.website : "",
                description: typeof data.description === "string" ? data.description : "",
                logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
              };

              let ok = false;
              if (editingBrand) {
                ok = await updateItem(`/api/admin/brands/${editingBrand.id}`, payload, loadBrands);
              } else {
                ok = await createItem("/api/admin/brands", payload, loadBrands);
              }

              if (ok) {
                setIsBrandFormOpen(false);
                setEditingBrand(null);
              }
            }}
            onClose={() => {
              setIsBrandFormOpen(false);
              setEditingBrand(null);
            }}
          />
        )}

        {isBannerFormOpen && (
          <BannerForm
            banner={editingBanner ?? undefined}
            onSave={async (data) => {
              const title = typeof data.title === "string" ? data.title : "";
              const link = typeof data.link === "string" ? data.link : "";
              const position = typeof data.position === "string" ? data.position : "hero";
              const isActive = Boolean(data.isActive);
              const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl : "";

              const payload = {
                title,
                link,
                position,
                isActive,
                imageUrl,
                image: imageUrl,
                type: position === "hero" ? "banner" : "poster",
                active: isActive,
              };

              let ok = false;
              if (editingBanner) {
                ok = await updateItem(`/api/admin/banners/${editingBanner.id}`, payload, loadBanners);
              } else {
                ok = await createItem("/api/admin/banners", payload, loadBanners);
              }

              if (ok) {
                setIsBannerFormOpen(false);
                setEditingBanner(null);
              }
            }}
            onClose={() => {
              setIsBannerFormOpen(false);
              setEditingBanner(null);
            }}
          />
        )}

        {isCategoryFormOpen && (
          <CategoryForm
            category={editingCategory ?? undefined}
            onSave={async (data) => {
              const payload = {
                name: typeof data.name === "string" ? data.name : "",
                slug: typeof data.slug === "string" ? data.slug : "",
                description: typeof data.description === "string" ? data.description : "",
                image: typeof data.image === "string" ? data.image : null,
              };

              let ok = false;
              if (editingCategory) {
                ok = await updateItem(`/api/admin/categories/${editingCategory.id}`, payload, loadCategories);
              } else {
                ok = await createItem("/api/admin/categories", payload, loadCategories);
              }

              if (ok) {
                setIsCategoryFormOpen(false);
                setEditingCategory(null);
              }
            }}
            onClose={() => {
              setIsCategoryFormOpen(false);
              setEditingCategory(null);
            }}
          />
        )}
        {/* Order Details Modal Popup */}
        {modalOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-150">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-zinc-900">
                      Chi tiết đơn hàng #{modalOrder.orderNumber || modalOrder.id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                        modalOrder.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : modalOrder.status === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : modalOrder.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {getStatusLabel(modalOrder.status)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Ngày đặt: {new Date(modalOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setModalOrder(null)}
                  className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 grid place-items-center text-zinc-600 font-bold text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Thông tin người mua & Thanh toán */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-50 p-4 rounded-2xl ring-1 ring-black/5 space-y-2">
                  <h4 className="font-bold text-zinc-900 text-sm border-b pb-1">👤 Thông tin khách hàng</h4>
                  <p><span className="text-zinc-500">Email nhận key:</span> <span className="font-semibold text-zinc-900">{modalOrder.email}</span></p>
                  <p><span className="text-zinc-500">Số điện thoại:</span> <span className="font-semibold text-zinc-900">{modalOrder.phone || "Không có"}</span></p>
                  <p><span className="text-zinc-500">Phương thức giao:</span> <span className="font-semibold text-zinc-900">{modalOrder.deliveryMethod}</span></p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-2xl ring-1 ring-black/5 space-y-2">
                  <h4 className="font-bold text-zinc-900 text-sm border-b pb-1">💳 Chi tiết thanh toán</h4>
                  <p><span className="text-zinc-500">Tổng thanh toán:</span> <span className="font-bold text-emerald-600 text-sm">{money(modalOrder.total)}</span></p>
                  <p><span className="text-zinc-500">Trạng thái:</span> <span className="font-semibold text-zinc-900">{getStatusLabel(modalOrder.status)}</span></p>
                  <p><span className="text-zinc-500">Ghi chú:</span> <span className="font-semibold text-zinc-900">{modalOrder.note || "Không có"}</span></p>
                </div>
              </div>

              {/* Sản phẩm mua */}
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-900 text-sm">🛒 Sản phẩm đã mua</h4>
                <div className="bg-zinc-50 rounded-2xl ring-1 ring-black/5 p-3 space-y-2 text-xs">
                  {modalOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-zinc-200/60 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-zinc-900">{it.name}</p>
                        <p className="text-[11px] text-zinc-500">Đơn giá: {money(it.price)} x {it.qty}</p>
                      </div>
                      <span className="font-bold text-zinc-900">{money(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mã Key Bản Quyền Cấp Cho Đơn Này */}
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-900 text-sm flex items-center justify-between">
                  <span>🔑 Mã Key bản quyền của đơn này</span>
                  {loadingModalKeys && <span className="text-xs text-zinc-400 font-normal">Đang tải key...</span>}
                </h4>
                <div className="bg-zinc-900 text-white rounded-2xl p-4 space-y-3">
                  {modalOrderKeys.length > 0 ? (
                    modalOrderKeys.map((k, idx) => (
                      <div key={idx} className="bg-zinc-800 p-3 rounded-xl flex items-center justify-between gap-3 ring-1 ring-white/10">
                        <div>
                          <p className="text-[11px] text-zinc-400 font-medium">{k.productName}</p>
                          <p className="font-mono text-emerald-400 font-bold text-sm tracking-wider mt-0.5">{k.key}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(k.key);
                            toast.success(`Đã sao chép mã Key: ${k.key}`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0"
                        >
                          Sao chép Key
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400 italic text-center py-2">
                      {modalOrder.status === "approved" || modalOrder.status === "paid"
                        ? "Mã key bản quyền đã được kích hoạt và gửi tự động qua Gmail của khách."
                        : "Duyệt thanh toán đơn hàng này để tự động cấp mã Key bản quyền."}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
                {modalOrder.status !== "approved" && (
                  <button
                    onClick={async () => {
                      await updateOrderStatus(modalOrder.id, "approved");
                      setModalOrder(null);
                    }}
                    className="bg-brand hover:bg-brand-hover text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
                  >
                    ✓ Duyệt thanh toán & Gửi Key
                  </button>
                )}
                {modalOrder.status !== "cancelled" && (
                  <button
                    onClick={async () => {
                      await updateOrderStatus(modalOrder.id, "cancelled");
                      setModalOrder(null);
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    ✕ Hủy đơn hàng
                  </button>
                )}
                <button
                  onClick={() => setModalOrder(null)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Coupon Form Modal */}
        {isCouponFormOpen && (
          <CouponForm
            coupon={editingCoupon ?? undefined}
            onSave={async (data) => {
              let ok = false;
              if (editingCoupon) {
                ok = await updateItem(`/api/admin/coupons/${editingCoupon.id}`, data, loadCoupons);
              } else {
                ok = await createItem("/api/admin/coupons", data, loadCoupons);
              }
              if (ok) {
                setIsCouponFormOpen(false);
                setEditingCoupon(null);
              }
            }}
            onClose={() => {
              setIsCouponFormOpen(false);
              setEditingCoupon(null);
            }}
          />
        )}

        {/* Key Form Modal */}
        {isKeyFormOpen && (
          <KeyForm
            keyData={editingKey ?? undefined}
            products={products.map((p) => ({ id: p.id, name: p.name }))}
            onSave={async (data) => {
              let ok = false;
              if (editingKey) {
                ok = await updateItem(`/api/admin/keys/${editingKey.id}`, data, loadKeys);
              } else {
                ok = await createItem("/api/admin/keys", data, loadKeys);
              }
              if (ok) {
                setIsKeyFormOpen(false);
                setEditingKey(null);
              }
            }}
            onClose={() => {
              setIsKeyFormOpen(false);
              setEditingKey(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

function AnalyticsView({ orders }: { orders: OrderData[] }) {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"paid_only" | "all_orders">("paid_only");

  const analyticsData = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - (startOfDay.getDay() === 0 ? 6 : startOfDay.getDay() - 1)); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter by period
    let timeFiltered = orders;
    if (period === "day") {
      timeFiltered = orders.filter((o) => new Date(o.createdAt) >= startOfDay);
    } else if (period === "week") {
      timeFiltered = orders.filter((o) => new Date(o.createdAt) >= startOfWeek);
    } else if (period === "month") {
      timeFiltered = orders.filter((o) => new Date(o.createdAt) >= startOfMonth);
    }

    // Revenue orders (PAID or APPROVED)
    const validPaidOrders = timeFiltered.filter(
      (o) => o.status === "paid" || o.status === "approved",
    );

    const targetOrders = statusFilter === "paid_only" ? validPaidOrders : timeFiltered;

    const totalRevenue = targetOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = targetOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const conversionRate = timeFiltered.length > 0 ? ((validPaidOrders.length / timeFiltered.length) * 100).toFixed(1) : "0";

    // Top selling products breakdown
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of validPaidOrders) {
      for (const item of order.items) {
        const key = item.productId || item.name;
        const existing = productMap.get(key) || { name: item.name, qty: 0, revenue: 0 };
        existing.qty += item.qty;
        existing.revenue += item.price * item.qty;
        productMap.set(key, existing);
      }
    }

    const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    const maxRevenue = topProducts[0]?.revenue || 1;

    return {
      totalRevenue,
      orderCount,
      avgOrderValue,
      conversionRate,
      paidCount: validPaidOrders.length,
      totalCount: timeFiltered.length,
      topProducts,
      maxRevenue,
    };
  }, [orders, period, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Controls & Filter Header */}
      <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Báo cáo & Thống kê doanh thu</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Dữ liệu doanh thu thực tế được tự động tổng hợp từ đơn hàng MySQL</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="bg-zinc-100 p-1 rounded-full flex gap-1 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("paid_only")}
              className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                statusFilter === "paid_only" ? "bg-emerald-600 text-white shadow" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              ✓ Thực nhận (Đã thanh toán)
            </button>
            <button
              onClick={() => setStatusFilter("all_orders")}
              className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                statusFilter === "all_orders" ? "bg-zinc-900 text-white shadow" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Tất cả đơn đặt
            </button>
          </div>

          {/* Time Period Filter */}
          <div className="bg-zinc-100 p-1 rounded-full flex gap-1 text-xs font-semibold">
            {[
              { id: "day", label: "Hôm nay" },
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "all", label: "Tất cả" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setPeriod(t.id as any)}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  period === t.id ? "bg-brand text-white shadow" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm relative overflow-hidden">
          <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center mb-3 font-bold text-lg">
            💵
          </div>
          <span className="text-xs text-zinc-500 font-medium block">
            {statusFilter === "paid_only" ? "Tổng Doanh Thu Thực Nhận" : "Tổng Doanh Thu Dự Kiến"}
          </span>
          <span className="text-2xl font-black text-emerald-600 tracking-tight mt-1 block">
            {money(analyticsData.totalRevenue)}
          </span>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm">
          <div className="size-10 rounded-2xl bg-blue-100 text-blue-700 grid place-items-center mb-3 font-bold text-lg">
            🛒
          </div>
          <span className="text-xs text-zinc-500 font-medium block">Đơn Hàng Thành Công</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-zinc-900">{analyticsData.paidCount}</span>
            <span className="text-xs text-zinc-400">/ tổng {analyticsData.totalCount} đơn</span>
          </div>
        </div>

        {/* Card 3: Average Order Value (AOV) */}
        <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm">
          <div className="size-10 rounded-2xl bg-purple-100 text-purple-700 grid place-items-center mb-3 font-bold text-lg">
            📈
          </div>
          <span className="text-xs text-zinc-500 font-medium block">Giá Trị Đơn Trung Bình (AOV)</span>
          <span className="text-2xl font-black text-zinc-900 tracking-tight mt-1 block">
            {money(analyticsData.avgOrderValue)}
          </span>
        </div>

        {/* Card 4: Payment Conversion Rate */}
        <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm">
          <div className="size-10 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center mb-3 font-bold text-lg">
            🎯
          </div>
          <span className="text-xs text-zinc-500 font-medium block">Tỷ Lệ Chuyển Đổi Thanh Toán</span>
          <span className="text-2xl font-black text-amber-600 tracking-tight mt-1 block">
            {analyticsData.conversionRate}%
          </span>
        </div>
      </div>

      {/* Top Selling Products Breakdown */}
      <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <span>🏆 Top Sản Phẩm Bán Chạy Nhất</span>
          <span className="text-xs font-normal text-zinc-500">(Theo tổng doanh thu thực tế)</span>
        </h3>

        {analyticsData.topProducts.length > 0 ? (
          <div className="space-y-4 pt-2">
            {analyticsData.topProducts.map((p, idx) => {
              const percent = Math.round((p.revenue / analyticsData.maxRevenue) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-5 rounded-full grid place-items-center text-[10px] font-bold text-white ${
                          idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-zinc-400" : idx === 2 ? "bg-amber-700" : "bg-zinc-300 text-zinc-700"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-zinc-900">{p.name}</span>
                      <span className="text-zinc-400 font-normal">({p.qty} lượt mua)</span>
                    </div>
                    <span className="font-bold text-emerald-600">{money(p.revenue)}</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-brand h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-zinc-400 italic">
            Chưa có dữ liệu giao dịch thành công trong khoảng thời gian đã chọn.
          </div>
        )}
      </div>
    </div>
  );
}

function AdminCollection<T extends { id: string }>({
  items,
  fields,
  onCreate,
  onEdit,
  onDelete,
}: {
  items: T[];
  fields: Array<Extract<keyof T, string>>;
  onCreate: () => Promise<void>;
  onEdit: (item: T) => Promise<void>;
  onDelete: (item: T) => Promise<void>;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-xl font-semibold">Danh sách ({items.length})</h2>
        <button
          onClick={onCreate}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover transition"
        >
          Thêm mới
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-zinc-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
          >
            <div>
              {fields.map((field) => {
                const val = item[field];
                let displayVal = "-";
                if (typeof val === "boolean") {
                  displayVal = val ? "✅ Đang kích hoạt" : "❌ Đã tắt";
                } else if (field === ("position" as any) && typeof val === "string") {
                  const posMap: Record<string, string> = {
                    hero: "Trang chủ (Banner Chính)",
                    promo_windows: "Nổi Bật Windows",
                    promo_antivirus: "Nổi Bật Antivirus",
                    sidebar: "Sidebar",
                    footer: "Footer",
                  };
                  displayVal = posMap[val] || val || "Trang chủ (Hero)";
                } else if (typeof val === "string" || typeof val === "number") {
                  displayVal = String(val);
                }
                return (
                  <p key={field} className="text-sm text-zinc-600">
                    <span className="font-semibold capitalize">{String(field)}:</span>{" "}
                    {displayVal}
                  </p>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Sửa
              </button>
              <button
                onClick={() => onDelete(item)}
                className="rounded-full border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedImagesAdminManager({
  banners = [],
  loadBanners,
  updateItem,
  createItem,
}: {
  banners?: BannerData[];
  loadBanners: () => Promise<void>;
  updateItem: (path: string, payload: any, reload: () => Promise<void>) => Promise<boolean>;
  createItem: (path: string, payload: any, reload: () => Promise<void>) => Promise<boolean>;
}) {
  const safeBanners = Array.isArray(banners) ? banners : [];

  const winBanner = safeBanners.find(
    (b) =>
      b.id === "promo-banner-windows" ||
      b.position === "promo_windows" ||
      (b.title && typeof b.title === "string" && b.title.toLowerCase().includes("windows"))
  );

  const antiBanner = safeBanners.find(
    (b) =>
      b.id === "promo-banner-antivirus" ||
      b.position === "promo_antivirus" ||
      (b.title && typeof b.title === "string" && b.title.toLowerCase().includes("antivirus"))
  );

  const parseImages = (imgStr?: string): ImageItem[] => {
    if (!imgStr || typeof imgStr !== "string") return [];
    return imgStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((url) => ({ url }));
  };

  const [winImages, setWinImages] = useState<ImageItem[]>(() => parseImages(winBanner?.imageUrl));
  const [antiImages, setAntiImages] = useState<ImageItem[]>(() => parseImages(antiBanner?.imageUrl));

  const [savingWin, setSavingWin] = useState(false);
  const [savingAnti, setSavingAnti] = useState(false);

  useEffect(() => {
    setWinImages(parseImages(winBanner?.imageUrl));
  }, [winBanner]);

  useEffect(() => {
    setAntiImages(parseImages(antiBanner?.imageUrl));
  }, [antiBanner]);

  const handleSaveWindows = async (customImgs?: ImageItem[]) => {
    const targetImgs = customImgs ?? winImages;
    const imgStr = targetImgs.map((i) => i.url).filter(Boolean).join(",");
    if (!imgStr) {
      toast.error("Vui lòng tải lên ít nhất 1 hình ảnh nổi bật cho Windows");
      return;
    }
    setSavingWin(true);
    try {
      const payload = {
        title: "Banner Nổi Bật Windows",
        subtitle: "promo_windows",
        position: "promo_windows",
        imageUrl: imgStr,
        isActive: true,
      };
      if (winBanner?.id) {
        await updateItem(`/api/admin/banners/${winBanner.id}`, payload, loadBanners);
      } else {
        await createItem("/api/admin/banners", payload, loadBanners);
      }
      await loadBanners();
      toast.success("Cập nhật Ảnh nổi bật 1 (Windows) thành công!");
    } finally {
      setSavingWin(false);
    }
  };

  const handleSaveAntivirus = async (customImgs?: ImageItem[]) => {
    const targetImgs = customImgs ?? antiImages;
    const imgStr = targetImgs.map((i) => i.url).filter(Boolean).join(",");
    if (!imgStr) {
      toast.error("Vui lòng tải lên ít nhất 1 hình ảnh nổi bật cho Antivirus");
      return;
    }
    setSavingAnti(true);
    try {
      const payload = {
        title: "Banner Nổi Bật Antivirus",
        subtitle: "promo_antivirus",
        position: "promo_antivirus",
        imageUrl: imgStr,
        isActive: true,
      };
      if (antiBanner?.id) {
        await updateItem(`/api/admin/banners/${antiBanner.id}`, payload, loadBanners);
      } else {
        await createItem("/api/admin/banners", payload, loadBanners);
      }
      await loadBanners();
      toast.success("Cập nhật Ảnh nổi bật 2 (Antivirus) thành công!");
    } finally {
      setSavingAnti(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">🖼️ Quản lý 2 Ảnh Nổi Bật</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Quản lý và thay đổi 2 hình ảnh banner nổi bật nằm bên phải banner chính trên Trang Chủ. Ảnh được lưu bảo mật lên Cloudflare R2.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: ẢNH NỔI BẬT 1 (WINDOWS) */}
        <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-brand text-[10px] font-bold tracking-widest uppercase bg-brand/10 px-2.5 py-1 rounded-full">
                  VỊ TRÍ 1
                </span>
                <h3 className="text-lg font-bold text-zinc-900 mt-1.5">Ảnh nổi bật 1 (Windows)</h3>
              </div>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
                ● Đang hiển thị
              </span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl ring-1 ring-zinc-200/60">
              <ImageUploader
                images={winImages}
                onChange={(imgs) => setWinImages(imgs)}
                maxImages={5}
                label="Danh sách hình ảnh (Tải từ 1 đến 5 ảnh)"
                folder="promo_banner"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">Tự động cập nhật lên Trang chủ</span>
            <button
              type="button"
              disabled={savingWin}
              onClick={() => handleSaveWindows()}
              className="bg-brand hover:bg-brand-hover text-white font-semibold text-xs px-5 py-2.5 rounded-full transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {savingWin ? "Đang lưu..." : "Lưu thay đổi 1"}
            </button>
          </div>
        </div>

        {/* CARD 2: ẢNH NỔI BẬT 2 (ANTIVIRUS) */}
        <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-brand text-[10px] font-bold tracking-widest uppercase bg-brand/10 px-2.5 py-1 rounded-full">
                  VỊ TRÍ 2
                </span>
                <h3 className="text-lg font-bold text-zinc-900 mt-1.5">Ảnh nổi bật 2 (Antivirus)</h3>
              </div>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
                ● Đang hiển thị
              </span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl ring-1 ring-zinc-200/60">
              <ImageUploader
                images={antiImages}
                onChange={(imgs) => setAntiImages(imgs)}
                maxImages={5}
                label="Danh sách hình ảnh (Tải từ 1 đến 5 ảnh)"
                folder="promo_banner"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">Tự động cập nhật lên Trang chủ</span>
            <button
              type="button"
              disabled={savingAnti}
              onClick={() => handleSaveAntivirus()}
              className="bg-brand hover:bg-brand-hover text-white font-semibold text-xs px-5 py-2.5 rounded-full transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {savingAnti ? "Đang lưu..." : "Lưu thay đổi 2"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroBannerAdminManager({
  banners = [],
  loadBanners,
  updateItem,
  createItem,
  onOpenForm,
  onEdit,
  onDelete,
}: {
  banners?: BannerData[];
  loadBanners: () => Promise<void>;
  updateItem: (path: string, payload: any, reload: () => Promise<void>) => Promise<boolean>;
  createItem: (path: string, payload: any, reload: () => Promise<void>) => Promise<boolean>;
  onOpenForm: () => void;
  onEdit: (banner: BannerData) => void;
  onDelete: (banner: BannerData) => Promise<void>;
}) {
  const safeBanners = Array.isArray(banners) ? banners : [];

  const heroBanner = safeBanners.find(
    (b) =>
      b.id === "hero-banner-main" ||
      b.position === "hero" ||
      (b.title && typeof b.title === "string" && b.title.toLowerCase().includes("hero"))
  );

  const parseImages = (imgStr?: string): ImageItem[] => {
    if (!imgStr || typeof imgStr !== "string") return [];
    return imgStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((url) => ({ url }));
  };

  const [images, setImages] = useState<ImageItem[]>(() => parseImages(heroBanner?.imageUrl));
  const [redirectUrl, setRedirectUrl] = useState(() => heroBanner?.link || "/products");
  const [title, setTitle] = useState(() => heroBanner?.title || "Banner Slide Trang Chủ");
  const [saving, setSaving] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    setImages(parseImages(heroBanner?.imageUrl));
    if (heroBanner?.link) setRedirectUrl(heroBanner.link);
    if (heroBanner?.title) setTitle(heroBanner.title);
  }, [heroBanner]);

  const activeUrls = useMemo(() => {
    return images.map((i) => cleanImageUrl(i.url)).filter(Boolean);
  }, [images]);

  const handleSaveHero = async () => {
    const imgStr = images.map((i) => i.url).filter(Boolean).join(",");
    if (!imgStr) {
      toast.error("Vui lòng tải lên ít nhất 1 hình ảnh Banner Slide cho Trang Chủ");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title || "Banner Slide Trang Chủ",
        subtitle: "hero",
        position: "hero",
        imageUrl: imgStr,
        linkUrl: redirectUrl,
        isActive: true,
      };

      if (heroBanner?.id) {
        await updateItem(`/api/admin/banners/${heroBanner.id}`, payload, loadBanners);
      } else {
        await createItem("/api/admin/banners", payload, loadBanners);
      }
      await loadBanners();
      toast.success("Cập nhật Banner Slide Trang Chủ thành công!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-brand text-[10px] font-bold tracking-widest uppercase bg-brand/10 px-2.5 py-1 rounded-full">
            QUẢN LÝ SLIDE CHÍNH
          </span>
          <h2 className="text-xl font-bold text-zinc-900 mt-1.5">🖼️ Quản lý Banner Trang Chủ</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Thay đổi danh sách ảnh Banner Slide chuyển động, chỉnh sửa liên kết khi click và xem trước trực tiếp. Ảnh được lưu trên Cloudflare R2.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenForm}
            className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            + Thêm Banner Khác
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: EDIT & UPLOAD BANNER */}
        <div className="lg:col-span-2 space-y-6">
          {/* UPLOAD & CHANGE BANNER IMAGES */}
          <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>📁 Thay đổi Banner (Tối đa 5 ảnh slide)</span>
              </h3>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
                ● Tự động xoay 3.5s
              </span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl ring-1 ring-zinc-200/60">
              <ImageUploader
                images={images}
                onChange={(newImgs) => setImages(newImgs)}
                maxImages={5}
                label="Chọn ảnh từ máy tính (Hỗ trợ JPG, PNG, WEBP - Upload Cloudflare R2)"
                folder="hero_banner"
              />
            </div>

            {/* LINK REDIRECT EDITING */}
            <div className="space-y-3 pt-3 border-t border-zinc-100">
              <label className="block text-xs font-bold text-zinc-700">
                🔗 Chỉnh sửa liên kết chuyển hướng (Redirect Link URL):
              </label>
              <input
                type="text"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="Ví dụ: /products?category=windows hoặc https://..."
                className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand bg-zinc-50 font-mono"
              />
              <p className="text-[11px] text-zinc-400">
                Khi khách hàng nhấn vào Banner trên Trang chủ, hệ thống sẽ mở liên kết này.
              </p>
            </div>

            {/* SAVE BUTTON */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-zinc-500 italic">
                Lưu vào Database & Cập nhật Trang chủ lập tức
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveHero}
                className="bg-brand hover:bg-brand-hover text-white font-bold text-xs px-6 py-3 rounded-full transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <span>Đang lưu lên R2 & DB...</span>
                ) : (
                  <span>✓ Lưu thay đổi Banner</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COL: LIVE BANNER PREVIEW */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 ring-1 ring-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">👁️ Xem trước Banner</h3>
              <span className="text-[10px] text-zinc-400 font-mono">
                {activeUrls.length} ảnh
              </span>
            </div>

            {/* PREVIEW DISPLAY BOX */}
            <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-[16/8] ring-1 ring-black/10 flex items-center justify-center group">
              {activeUrls.length > 0 ? (
                <>
                  <img
                    src={activeUrls[previewIndex % activeUrls.length]}
                    alt="Banner Preview"
                    className="w-full h-full object-cover transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-[11px] font-bold line-clamp-1">{title}</p>
                    <p className="text-[9px] text-zinc-300 font-mono line-clamp-1">{redirectUrl}</p>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <p className="text-xs text-zinc-400 italic">Chưa chọn ảnh banner nào</p>
                </div>
              )}
            </div>

            {/* CAROUSEL CONTROLS PREVIEW */}
            {activeUrls.length > 1 && (
              <div className="flex justify-center items-center gap-1.5 pt-1">
                {activeUrls.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPreviewIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      previewIndex % activeUrls.length === idx ? "w-6 bg-brand" : "w-2 bg-zinc-200"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="p-3 bg-brand/5 rounded-2xl text-xs text-brand space-y-1">
              <p className="font-semibold">💡 Mẹo chuẩn kích thước:</p>
              <p className="text-[11px] text-zinc-600">
                Kích thước khuyến nghị: <strong>1200 x 500 px</strong> (hoặc tỉ lệ 21:9). Ảnh định dạng JPG, PNG, WEBP được tối ưu tốt nhất trên Cloudflare R2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
