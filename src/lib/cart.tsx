import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Product } from "./products";
import { useAuth } from "./auth";
import {
  addCartItem,
  clearCart as clearServerCart,
  getCart,
  removeCartItem,
  updateCartItem,
  getProductBySlug,
  toProduct,
  cleanImageUrl,
  type ApiCart,
} from "./storeApi";
import { products as fallbackProducts } from "./products";

export type CartLine = { product: Product; qty: number };

type CartCtx = {
  lines: CartLine[];
  add: (product: Product, qty?: number) => Promise<{ requiresLogin: boolean }>;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  isLoading: boolean;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "namnguyen_cart_v1";

// ─── Helper: map cart từ server sang CartLine[] ────────────────────────────
function mapServerCartToLines(cart: ApiCart): CartLine[] {
  return cart.items.map((item) => {
    const fallback = fallbackProducts.find((p) => p.slug === item.product?.slug);
    const rawThumb = item.product?.thumbnailUrl ?? "";
    const image = cleanImageUrl(rawThumb) || fallback?.image || "";
    return {
      product: fallback
        ? { ...fallback, id: item.productId, price: Number(item.price), image }
        : {
            id: item.productId,
            slug: item.product?.slug ?? item.productId,
            name: item.product?.name ?? "Sản phẩm",
            brand: "",
            category: "",
            price: Number(item.price),
            rating: 0,
            reviews: 0,
            image,
            stock: 0,
            description: "",
            platforms: [],
            specs: [],
          },
      qty: item.quantity,
    };
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [serverCart, setServerCart] = useState<ApiCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Khôi phục giỏ hàng từ localStorage khi chưa đăng nhập ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // ── Sync giỏ hàng từ server khi đăng nhập ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setServerCart(null);
      // Không clear lines — giữ lại giỏ local nếu chưa đăng nhập
      return;
    }

    setIsLoading(true);
    getCart()
      .then((cart) => {
        setServerCart(cart);
        setLines(mapServerCartToLines(cart));
      })
      .catch(() => setServerCart(null))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  // ── Lưu localStorage khi không đăng nhập ──
  useEffect(() => {
    if (!hydrated || user) return; // Chỉ lưu local khi chưa đăng nhập
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines, hydrated, user]);

  // ── add ───────────────────────────────────────────────────────────────────
  const add = useCallback(
    async (product: Product, qty = 1): Promise<{ requiresLogin: boolean }> => {
      // Chưa đăng nhập → báo caller để redirect
      if (!user) {
        return { requiresLogin: true };
      }

      const isUuid = (id: string) =>
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

      let productId = product.id;
      if (!isUuid(productId) && product.slug) {
        try {
          const api = await getProductBySlug(product.slug);
          if (api) productId = api.id;
        } catch {
          // fallback to given id
        }
      }

      const cart = await addCartItem(productId, qty);
      setServerCart(cart);
      setLines(mapServerCartToLines(cart));
      return { requiresLogin: false };
    },
    [user],
  );

  // ── remove ────────────────────────────────────────────────────────────────
  const remove = useCallback(
    (id: string) => {
      if (user && serverCart) {
        const item = serverCart.items.find((ci) => ci.productId === id);
        if (item) {
          void removeCartItem(item.id).then((cart) => {
            setServerCart(cart);
            setLines(mapServerCartToLines(cart));
          });
          return;
        }
      }
      setLines((prev) => prev.filter((l) => l.product.id !== id));
    },
    [user, serverCart],
  );

  // ── setQty ────────────────────────────────────────────────────────────────
  const setQty = useCallback(
    (id: string, qty: number) => {
      if (user && serverCart) {
        const item = serverCart.items.find((ci) => ci.productId === id);
        if (item) {
          void updateCartItem(item.id, Math.max(1, qty)).then((cart) => {
            setServerCart(cart);
            setLines(mapServerCartToLines(cart));
          });
          return;
        }
      }
      setLines((prev) =>
        prev.map((l) => (l.product.id === id ? { ...l, qty: Math.max(1, qty) } : l)),
      );
    },
    [user, serverCart],
  );

  // ── clear ─────────────────────────────────────────────────────────────────
  const clear = useCallback(() => {
    if (user) {
      void clearServerCart().then(() => {
        setServerCart(null);
        setLines([]);
        localStorage.removeItem(KEY);
      });
      return;
    }
    setLines([]);
    localStorage.removeItem(KEY);
  }, [user]);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      add,
      remove,
      setQty,
      clear,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.qty * l.product.price, 0),
      isLoading,
    }),
    [lines, add, remove, setQty, clear, isLoading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
