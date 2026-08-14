import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { categories, type Product } from "@/lib/products";
import { cleanImageUrl, getCategoryBySlug, listProducts, toProduct } from "@/lib/storeApi";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const catData = await getCategoryBySlug(params.slug);
    const catId = catData?.id;
    const initialProductsRes = await listProducts(
      catId ? `?categoryId=${catId}&pageSize=100` : `?pageSize=100`,
    );
    const cat = {
      id: catId,
      slug: params.slug,
      name:
        catData?.name ||
        params.slug.charAt(0).toUpperCase() + params.slug.slice(1).replace(/-/g, " "),
    };
    return { cat, catData, initialProducts: initialProductsRes?.data ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.cat.name} bản quyền — Công Ty TNHH Công Nghệ Nam Nguyễn` },
          {
            name: "description",
            content: `Mua ${loaderData.cat.name.toLowerCase()} bản quyền chính hãng tại Công Ty TNHH Công Nghệ Nam Nguyễn. Giao key qua email 5 phút, bảo hành trọn đời.`,
          },
        ]
      : [{ title: "Danh mục — Công Ty TNHH Công Nghệ Nam Nguyễn" }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { cat, catData, initialProducts } = Route.useLoaderData() as {
    cat: { id?: string; slug: string; name: string };
    catData: any;
    initialProducts: any[];
  };
  const categoryQuery = useQuery({
    queryKey: ["category", cat.slug],
    queryFn: () => getCategoryBySlug(cat.slug),
    initialData: catData ?? undefined,
    refetchInterval: 3000,
  });
  const productsQuery = useQuery({
    queryKey: ["products", "category", cat.slug, categoryQuery.data?.id ?? cat.id],
    queryFn: () => {
      const catId = categoryQuery.data?.id ?? cat.id;
      if (catId) {
        return listProducts(`?categoryId=${catId}&pageSize=100`);
      }
      return listProducts(`?pageSize=100`);
    },
    initialData: { data: initialProducts },
    refetchInterval: 3000,
  });
  const apiItems = productsQuery.data?.data?.map((item) => toProduct(item)) ?? [];
  const targetCatId = categoryQuery.data?.id;
  const sourceItems: Product[] = apiItems.filter((p) => {
    if (!p) return false;
    if (targetCatId && (p as any).categoryId) {
      return (p as any).categoryId === targetCatId;
    }
    const pCat = (p.category || "").toLowerCase();
    const pCatId = ((p as any).categoryId || "").toLowerCase();
    const targetSlug = (cat.slug || "").toLowerCase();

    return (
      targetSlug === "all" ||
      pCat === targetSlug ||
      (targetSlug === "windows" && (pCatId.includes("windows") || pCat.includes("windows"))) ||
      (targetSlug === "office" && (pCatId.includes("office") || pCat.includes("office"))) ||
      (targetSlug === "antivirus" && (pCatId.includes("antivirus") || pCat.includes("antivirus")))
    );
  });
  const [sort, setSort] = useState("featured");
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(1000000000);
  const [page, setPage] = useState(1);

  const platformOptions = Array.from(new Set(sourceItems.flatMap((item) => item.platforms))).sort();

  useEffect(() => {
    setBrandFilter([]);
    setPlatformFilter([]);
    setPage(1);
  }, [cat.slug]);

  const filtered = sourceItems
    .filter((p) => {
      if (!brandFilter.length) return true;
      const pBrand = (p.brand || "").toLowerCase();
      const pBrandId = ((p as any).brandId || "").toLowerCase();
      return brandFilter.some((f) => {
        const filterLower = f.toLowerCase();
        return (
          pBrand === filterLower ||
          pBrandId === filterLower ||
          pBrand.includes(filterLower) ||
          pBrandId.includes(filterLower) ||
          (filterLower.includes("microsoft") &&
            (pBrand.includes("microsoft") || pBrandId.includes("microsoft")))
        );
      });
    })
    .filter((p) =>
      platformFilter.length
        ? platformFilter.some((platform) => p.platforms.includes(platform))
        : true,
    )
    .filter((p) => p.price <= maxPrice)
    .sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "rating"
            ? b.rating - a.rating
            : 0,
    );

  useEffect(() => {
    setPage(1);
  }, [sort, brandFilter, platformFilter, maxPrice]);

  const itemsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleBrand = (b: string) =>
    setBrandFilter((f) => (f.includes(b) ? f.filter((x) => x !== b) : [...f, b]));

  const togglePlatform = (p: string) =>
    setPlatformFilter((f) => (f.includes(p) ? f.filter((x) => x !== p) : [...f, p]));

  const posterStyleMap: Record<string, string> = {
    windows: "from-sky-500 to-indigo-700",
    office: "from-blue-500 to-cyan-700",
    antivirus: "from-emerald-500 to-teal-700",
  };

  const posterStyle = posterStyleMap[cat.slug] || "from-zinc-500 to-zinc-700";

  const categoryImage = cleanImageUrl(
    categoryQuery.data?.image ?? (categoryQuery.data as any)?.imageUrl,
  );

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto pl-[5px] pr-4 lg:pr-8 py-6">
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
          <Link to="/" className="hover:text-brand">
            Trang chủ
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-ink font-medium">{cat.name}</span>
        </nav>
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-semibold">{cat.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">{filtered.length} sản phẩm</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-zinc-600">Sắp xếp</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white rounded-lg ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-brand"
            >
              <option value="featured">Nổi bật</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-stretch">
          <aside className="col-span-12 lg:col-span-4 h-full flex flex-col">
            <div className="relative rounded-2xl overflow-hidden ring-1 ring-black/10 shadow-sm bg-white h-full min-h-[460px] flex items-center justify-center">
              {categoryImage ? (
                <img
                  src={categoryImage}
                  alt={cat.name}
                  className="w-full h-full object-cover block rounded-2xl hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div
                  className={`relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden bg-gradient-to-br ${posterStyle}`}
                >
                  <div className="absolute inset-0 p-6 flex items-end">
                    <span className="text-white text-2xl font-bold">{cat.name}</span>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="col-span-12 lg:col-span-8">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl ring-1 ring-black/5 p-12 text-center">
                <p className="text-zinc-500">Không có sản phẩm nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                  {pageItems.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="col-span-12 mt-4 flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl ring-1 ring-black/5 p-5 shadow-sm">
            <div className="text-sm font-medium text-zinc-600">
              Hiển thị{" "}
              <span className="font-semibold text-zinc-900">
                {(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, filtered.length)}
              </span>{" "}
              của <span className="font-semibold text-zinc-900">{filtered.length}</span> sản phẩm
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index + 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    page === index + 1
                      ? "bg-brand text-brand-foreground shadow-sm"
                      : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
