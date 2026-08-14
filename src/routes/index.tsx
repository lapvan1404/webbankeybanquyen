import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  MonitorSmartphone,
  FileText,
  ShieldCheck,
  Palette,
  Briefcase,
  Wrench,
  Zap,
  Mail,
  RotateCcw,
  Headphones as HeadphonesIcon,
  Edit3,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import {
  cleanImageUrl,
  listBanners,
  listBrands,
  listCategories,
  listFeaturedProducts,
  listProducts,
  toProduct,
  unwrapList,
} from "@/lib/storeApi";
import { useQuery } from "@tanstack/react-query";

const slides: Array<{ image: string; title: string }> = [
  {
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    title: "Ưu đãi phần mềm bản quyền chính hãng Microsoft & Antivirus",
  },
  {
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    title: "Flash sale key bản quyền 100% vĩnh viễn - Giá tốt nhất thị trường",
  },
  {
    image:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    title: "Giao key tự động qua email 5 phút - Hỗ trợ kỹ thuật 24/7",
  },
];

// Component 2 khối ảnh nổi bật tự động chuyển động đổi ảnh mượt mà
function FeaturedAnimatedBlock({
  category,
  images,
  index,
  navigate,
}: {
  category: { slug: string; name: string; image: string };
  images: string[];
  index: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Tự động xoay đổi hình ảnh mỗi 3.5 giây (nếu có nhiều hơn 1 ảnh)
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(
      () => {
        setCurrentImgIndex((prev) => (prev + 1) % images.length);
      },
      3500 + index * 500,
    );
    return () => clearInterval(interval);
  }, [images.length, index]);

  const currentImage = images[currentImgIndex] || category.image;

  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="group relative flex-1 h-0 min-h-0 rounded-2xl overflow-hidden ring-1 ring-black/5 hover:ring-brand/40 transition-all shadow-sm"
    >
      {images.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            i === currentImgIndex
              ? "opacity-100 scale-100 z-10"
              : "opacity-0 scale-105 pointer-events-none z-0"
          }`}
        >
          <img
            src={img}
            alt={category.name}
            onError={(e) => {
              const target = e.currentTarget;
              const fallback =
                category.slug === "windows"
                  ? "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80"
                  : "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80";
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ))}

      {!currentImage && (
        <div className="w-full h-full bg-gradient-to-br from-slate-500 to-slate-700 group-hover:scale-105 transition-transform" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-20 pointer-events-none" />

      <div className="absolute inset-0 p-4 flex items-end justify-between z-30">
        <span className="text-white text-sm font-semibold drop-shadow">{category.name}</span>
        {images.length > 1 && (
          <div className="flex gap-1 mb-1">
            {images.map((_, dotIdx) => (
              <span
                key={dotIdx}
                className={`h-1.5 rounded-full transition-all ${
                  dotIdx === currentImgIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: "/category/$slug", params: { slug: category.slug } });
          }}
          className="pointer-events-auto bg-black/40 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all"
          aria-label={`Xem ${category.name}`}
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
    </Link>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Công Ty TNHH Công Nghệ Nam Nguyễn — Phần mềm bản quyền Windows, Office, Antivirus chính hãng",
      },
      {
        name: "description",
        content:
          "Đại lý phân phối phần mềm bản quyền chính hãng Microsoft Windows, Office, Kaspersky, ESET, Bitdefender tại Việt Nam. Giá tốt nhất, giao key 5 phút, hỗ trợ kỹ thuật 24/7.",
      },
    ],
  }),
  component: Index,
});

const catIcons: Record<string, typeof ShieldCheck> = {
  windows: MonitorSmartphone,
  office: FileText,
  antivirus: ShieldCheck,
  "do-hoa": Palette,
  "van-phong": Briefcase,
  "tien-ich": Wrench,
};

function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 8, minutes: 42, seconds: 19 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts("?pageSize=100"),
    staleTime: 10000,
    refetchInterval: 15000,
  });
  const featuredQuery = useQuery({
    queryKey: ["products", "featured"],
    queryFn: listFeaturedProducts,
    staleTime: 10000,
    refetchInterval: 15000,
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 10000,
    refetchInterval: 15000,
  });
  const bannersQuery = useQuery({
    queryKey: ["banners"],
    queryFn: listBanners,
    staleTime: 10000,
    refetchInterval: 15000,
  });
  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: listBrands,
    staleTime: 10000,
    refetchInterval: 15000,
  });

  const products = useMemo(
    () => productsQuery.data?.data?.map((item) => toProduct(item)) ?? [],
    [productsQuery.data],
  );
  const featured = useMemo(
    () => (featuredQuery.data ?? []).map((item) => toProduct(item)).slice(0, 4),
    [featuredQuery.data],
  );
  const bestSellers = useMemo(
    () => [...products].sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0)).slice(0, 6),
    [products],
  );
  const queryClient = useQueryClient();

  const categories = useMemo(
    () =>
      unwrapList(categoriesQuery.data ?? []).map((item) => ({
        slug: item.slug,
        name: item.name,
        image: cleanImageUrl(item.image ?? item.imageUrl),
      })),
    [categoriesQuery.data],
  );

  const heroBanners = useMemo(
    () =>
      (bannersQuery.data ?? []).filter((b) => {
        if (!b.isActive || !b.imageUrl || b.imageUrl.includes("example.com")) return false;
        const pos = ((b as any).position || b.subtitle || "").toLowerCase();
        const title = (b.title || "").toLowerCase();
        if (pos.startsWith("promo_") || pos === "side" || title.includes("nổi bật")) return false;
        return true;
      }),
    [bannersQuery.data],
  );

  const bannerSlides = useMemo(
    () =>
      heroBanners.length
        ? heroBanners.map((banner) => ({
            image: cleanImageUrl(banner.imageUrl),
            title: banner.title,
          }))
        : slides,
    [heroBanners],
  );

  const brandNames = unwrapList(brandsQuery.data ?? []).map((brand) => brand.name.toUpperCase());
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  useEffect(() => {
    const source = new EventSource("/api/store/stream");
    source.addEventListener("message", () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    });
    source.addEventListener("error", () => {
      source.close();
    });
    return () => {
      source.close();
    };
  }, [queryClient]);

  const featuredCategorySlugs = ["windows", "antivirus"];
  const featuredCategories = featuredCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is { slug: string; name: string; image: string } =>
      Boolean(category),
    );

  return (
    <Layout>
      <section className="py-6 px-4 lg:px-8">
        <div className="max-w-[1536px] mx-auto grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="relative aspect-[16/9] lg:aspect-auto lg:h-[515px] rounded-2xl overflow-hidden ring-1 ring-black/5 bg-zinc-100 shadow-sm">
              {bannerSlides.map((slide, index) => {
                const fallbackImage = slides[index % slides.length].image;
                const displayImg = slide.image || fallbackImage;

                return (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      index === activeSlide
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img
                      src={displayImg}
                      alt={slide.title ?? `Banner ${index + 1}`}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== fallbackImage) {
                          target.src = fallbackImage;
                        }
                      }}
                      className="w-full h-full object-cover object-center"
                    />
                    {slide.title &&
                      !["banner", "hero", "promo", "side", "test"].includes(
                        slide.title.trim().toLowerCase(),
                      ) && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-6 left-6 right-6 text-white pointer-events-none">
                            <h2 className="text-xl lg:text-3xl font-bold drop-shadow-md leading-tight max-w-2xl">
                              {slide.title}
                            </h2>
                          </div>
                        </>
                      )}
                  </div>
                );
              })}

              {bannerSlides.length > 1 && (
                <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
                  {bannerSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === activeSlide ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:h-[515px]">
            {featuredCategories.length > 0 ? (
              featuredCategories.map((category, idx) => {
                // Ưu tiên lấy từ Banners mà Admin quản lý ở mục Chỉnh Sửa 2 Ảnh Nổi Bật
                const matchedBanner = (bannersQuery.data ?? []).find(
                  (b) =>
                    b.isActive &&
                    (b.position === `promo_${category.slug}` ||
                      (category.slug === "windows" &&
                        (b.position === "promo_windows" || b.position === "side")) ||
                      (category.slug === "antivirus" && b.position === "promo_antivirus") ||
                      b.title.toLowerCase().includes(category.slug)),
                );

                const bannerImgString = matchedBanner?.imageUrl || category.image || "";
                const uploadedImages = bannerImgString
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s) => cleanImageUrl(s))
                  .filter((url) => Boolean(url) && !url.includes(","));

                const defaultFallback =
                  category.slug === "windows"
                    ? "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80"
                    : "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80";

                const finalImages = uploadedImages.length > 0 ? uploadedImages : [defaultFallback];

                return (
                  <FeaturedAnimatedBlock
                    key={category.slug}
                    category={category}
                    images={finalImages}
                    index={idx}
                    navigate={navigate}
                  />
                );
              })
            ) : (
              <>
                <Link
                  to="/category/$slug"
                  params={{ slug: "windows" }}
                  className="group relative flex-1 min-h-40 rounded-2xl overflow-hidden ring-1 ring-black/5 hover:ring-brand/40 transition-all"
                >
                  <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-700 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 p-4 flex items-end">
                    <span className="text-white text-sm font-semibold">Windows</span>
                  </div>
                </Link>
                <Link
                  to="/category/$slug"
                  params={{ slug: "antivirus" }}
                  className="group relative flex-1 min-h-40 rounded-2xl overflow-hidden ring-1 ring-black/5 hover:ring-brand/40 transition-all"
                >
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-700 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 p-4 flex items-end">
                    <span className="text-white text-sm font-semibold">Antivirus</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 lg:px-8 mt-4">
        <div className="max-w-[1536px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {[
            { icon: Mail, title: "Giao key 5 phút", sub: "Nhận key qua email tự động" },
            { icon: ShieldCheck, title: "Bản quyền chính hãng", sub: "100% key retail vĩnh viễn" },
            { icon: RotateCcw, title: "Bảo hành trọn đời", sub: "1 đổi 1 nếu key lỗi" },
            { icon: HeadphonesIcon, title: "Hỗ trợ cài đặt", sub: "Kỹ thuật viên online 24/7" },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl ring-1 ring-black/5 p-4 flex items-center gap-3"
            >
              <div className="size-10 rounded-lg bg-brand-soft grid place-items-center shrink-0">
                <f.icon className="size-5 text-brand" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-zinc-500">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 px-4 lg:px-8">
        <div className="max-w-[1536px] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-brand text-[10px] font-bold tracking-[0.3em] uppercase">
                Mua sắm theo
              </span>
              <h2 className="text-2xl lg:text-3xl font-semibold mt-1">Danh mục phần mềm</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 lg:gap-4">
            {categories.map((c) => {
              return (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="group flex flex-col items-center gap-2 bg-white rounded-xl ring-1 ring-black/5 hover:ring-brand/40 hover:-translate-y-0.5 transition-all overflow-hidden"
                >
                  <div className="w-full aspect-square bg-zinc-100 flex items-center justify-center overflow-hidden">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400 px-2 text-center">{c.name}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-700 text-center pb-2 px-2">
                    {c.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 lg:px-8 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden border-y border-red-900/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1536px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  🔥 SIÊU SỰ KIỆN 8/8
                </span>
                <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">
                  ƯU ĐÃI KHỦNG NHẤT NĂM
                </span>
              </div>
              <h2 className="text-white text-2xl lg:text-3xl font-extrabold flex flex-wrap items-center gap-3">
                <span className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white font-black px-3.5 py-1 rounded-xl text-xl shadow-lg shadow-red-600/30 animate-pulse">
                  ⚡ FLASH SALE 8/8
                </span>
                <span>kết thúc sau</span>
              </h2>
            </div>
            <div className="flex gap-3">
              {[
                [String(timeLeft.hours).padStart(2, "0"), "Giờ"],
                [String(timeLeft.minutes).padStart(2, "0"), "Phút"],
                [String(timeLeft.seconds).padStart(2, "0"), "Giây"],
              ].map(([n, l]) => (
                <div
                  key={l}
                  className="bg-zinc-800/90 px-4 py-2.5 rounded-xl border border-amber-500/30 text-center min-w-16 shadow-inner"
                >
                  <span className="text-amber-400 text-2xl font-black tabular-nums block">{n}</span>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {productsQuery.isLoading ? (
              <p className="col-span-full text-center text-zinc-400">Đang tải sản phẩm...</p>
            ) : null}
            {featured.map((p) => (
              <ProductCard key={p.id} product={{ ...p, badge: p.badge || "SALE 8/8" }} dark />
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 lg:px-8">
        <div className="max-w-[1536px] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-brand text-[10px] font-bold tracking-[0.3em] uppercase">
                Được yêu thích
              </span>
              <h2 className="text-2xl lg:text-3xl font-semibold mt-1">Bán chạy trong tuần</h2>
            </div>
            <Link
              to="/category/$slug"
              params={{ slug: "windows" }}
              className="text-xs font-semibold border-b border-ink hover:text-brand hover:border-brand pb-0.5"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {productsQuery.isError ? (
              <p className="col-span-full text-center text-red-500">Không thể tải sản phẩm.</p>
            ) : null}
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} hideRating />
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 border-y border-zinc-200 bg-white">
        <div className="max-w-[1536px] mx-auto px-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-around gap-8 opacity-50 text-zinc-500">
            {(brandNames.length
              ? brandNames
              : ["MICROSOFT", "KASPERSKY", "ESET", "BITDEFENDER", "ADOBE", "AUTODESK"]
            ).map((b) => (
              <span key={b} className="text-lg font-bold tracking-tighter">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="py-16 px-4 lg:px-8">
          <div className="max-w-[1536px] mx-auto bg-zinc-100 rounded-3xl p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <h2 className="text-2xl lg:text-3xl font-semibold text-balance mb-3">
                Đăng ký nhận ưu đãi
              </h2>
              <p className="text-zinc-600 text-sm lg:text-base">
                Nhận mã giảm giá độc quyền, thông tin sản phẩm mới và giá thành viên sớm nhất.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newsletterEmail.trim()) return;
                navigate({
                  to: "/register",
                  search: { email: newsletterEmail.trim() },
                });
              }}
              className="w-full max-w-sm flex flex-col gap-3"
            >
              <input
                type="email"
                required
                placeholder="Địa chỉ email của bạn"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-white rounded-full ring-1 ring-black/5 focus:ring-brand outline-none transition-all text-sm"
              />
              <button
                type="submit"
                className="w-full bg-brand hover:bg-brand-hover text-brand-foreground font-medium py-3.5 rounded-full shadow-lg shadow-brand/20 text-sm transition-colors cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </form>
          </div>
        </section>
      )}
    </Layout>
  );
}
