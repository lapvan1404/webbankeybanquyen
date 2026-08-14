import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import logoImg from "../../logo/logo.png";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Truck,
  Shield,
  Phone,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { listProducts, toProduct, cleanImageUrl } from "@/lib/storeApi";
import { money } from "@/lib/products";

export function AnnouncementBar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLookupClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/lookup" } });
    } else {
      navigate({ to: "/lookup" });
    }
  };

  return (
    <div className="bg-brand text-brand-foreground text-xs">
      <div className="max-w-[1536px] mx-auto px-4 lg:px-8 h-9 flex items-center justify-between gap-4">
        <p className="font-medium tracking-wide truncate flex items-center gap-1.5 leading-none">
          <Truck className="size-3.5 shrink-0" />
          <span>Giao key bản quyền qua email trong 5 phút · Hỗ trợ cài đặt miễn phí</span>
        </p>
        <div className="hidden md:flex items-center gap-6 text-white/90 text-xs">
          <a
            href="tel:0383158080"
            className="hover:text-white flex items-center gap-1.5 font-semibold leading-none transition-colors"
          >
            <Phone className="size-3 shrink-0" /> 0383 158 080
          </a>
          <button
            onClick={handleLookupClick}
            className="hover:text-white flex items-center leading-none transition-colors font-medium cursor-pointer"
          >
            TRA CỨU ĐƠN HÀNG
          </button>
          <a
            href="tel:0383158080"
            className="hover:text-white flex items-center leading-none transition-colors font-medium"
          >
            HỖ TRỢ 24/7
          </a>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { count } = useCart();
  const { user } = useAuth();
  const [adminName, setAdminName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim().toLowerCase();

  const searchSuggestionsQuery = useQuery({
    queryKey: ["instant-search", trimmedQuery],
    queryFn: () => listProducts(`?keyword=${encodeURIComponent(trimmedQuery)}&pageSize=6`),
    enabled: trimmedQuery.length >= 1,
  });

  const suggestions = searchSuggestionsQuery.data?.data?.map((item) => toProduct(item)) ?? [];

  useEffect(() => {
    const isAdminArea = location.pathname.startsWith("/admin");
    if (!isAdminArea) {
      setAdminName(null);
      return;
    }

    (async () => {
      try {
        const data = await apiFetch<{ name?: string }>("/api/admin/session", {
          credentials: "same-origin",
        });
        setAdminName(data.name || null);
      } catch (error) {
        setAdminName(null);
      }
    })();
  }, [location.pathname]);

  // Handle click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    navigate({ to: "/search", search: { q: trimmed } });
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-zinc-200/60">
      <div className="max-w-[1536px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 lg:gap-8">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
            <img
              src={logoImg}
              alt="Công Ty TNHH Công Nghệ Nam Nguyễn"
              className="h-8 w-auto rounded-md shrink-0"
            />
            <span className="hidden sm:block text-base lg:text-lg font-semibold tracking-tight truncate">
              Công Ty TNHH Công Nghệ Nam Nguyễn
            </span>
          </Link>

          <div ref={searchRef} className="flex-1 max-w-xl hidden md:block relative">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <input
                type="text"
                value={query}
                onFocus={() => setIsOpen(true)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setIsOpen(true);
                }}
                placeholder="Tìm Windows, Office, Kaspersky, ESET..."
                className="w-full bg-zinc-100/80 border-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-brand/40 focus:bg-white rounded-xl py-2.5 pl-4 pr-10 text-sm transition-all outline-none"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand transition-colors"
              >
                <Search className="size-4" />
              </button>
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {isOpen && trimmedQuery.length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl ring-1 ring-black/10 shadow-2xl overflow-hidden z-50 max-h-[420px] flex flex-col">
                <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs font-semibold text-zinc-600">
                  <span>Gợi ý sản phẩm ({suggestions.length})</span>
                  {searchSuggestionsQuery.isLoading && (
                    <Loader2 className="size-3.5 animate-spin text-brand" />
                  )}
                </div>

                <div className="overflow-y-auto divide-y divide-zinc-100 flex-1">
                  {suggestions.length > 0 ? (
                    suggestions.map((p) => (
                      <Link
                        key={p.id}
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors group"
                      >
                        <img
                          src={cleanImageUrl(p.image)}
                          alt={p.name}
                          className="size-12 object-cover rounded-lg bg-zinc-100 shrink-0 border border-zinc-200/60"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-brand transition-colors">
                            {p.name}
                          </p>
                          <p className="text-xs text-zinc-500 font-semibold">{money(p.price)}</p>
                        </div>
                        <ArrowRight className="size-4 text-zinc-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    ))
                  ) : !searchSuggestionsQuery.isLoading ? (
                    <div className="p-6 text-center text-xs text-zinc-500">
                      Không tìm thấy sản phẩm nào khớp với <b>"{query}"</b>
                    </div>
                  ) : null}
                </div>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate({ to: "/search", search: { q: trimmedQuery } });
                  }}
                  className="p-3 bg-zinc-50 hover:bg-zinc-100 border-t border-zinc-100 text-xs font-semibold text-brand text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Xem tất cả kết quả cho "{query}"</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/search" })}
              className="md:hidden p-2 hover:bg-zinc-100 rounded-full"
              aria-label="Tìm kiếm"
            >
              <Search className="size-5 text-zinc-600" />
            </button>
            <button
              className="hidden sm:grid p-2 hover:bg-zinc-100 rounded-full place-items-center"
              aria-label="Yêu thích"
            >
              <Heart className="size-5 text-zinc-600" />
            </button>
            {!adminName && (
              <Link
                to="/cart"
                className="relative p-2 hover:bg-zinc-100 rounded-full grid place-items-center"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="size-5 text-zinc-600" />
                {count > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-brand text-[10px] font-semibold text-white rounded-full grid place-items-center">
                    {count}
                  </span>
                )}
              </Link>
            )}
            {adminName ? (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-100 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
              >
                <User className="size-4" /> {adminName.split(" ")[0]}
              </Link>
            ) : user ? (
              <Link
                to="/profile"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-100 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
              >
                <User className="size-4" /> {user.name.split(" ")[0]}
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-100 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
              >
                <User className="size-4" /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
