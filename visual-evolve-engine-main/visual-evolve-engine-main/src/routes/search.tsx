import { createFileRoute, Link } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { listProducts, toProduct } from "@/lib/storeApi";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "Tìm kiếm — Công Ty TNHH Công Nghệ Nam Nguyễn" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const query = q.trim().toLowerCase();
  const productsQuery = useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => listProducts(`?keyword=${encodeURIComponent(query)}&pageSize=100`),
    enabled: Boolean(query),
  });
  const results =
    productsQuery.data?.data?.map((item) => toProduct(item)) ?? [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <SearchIcon className="size-5 text-brand" />
          <h1 className="text-2xl font-semibold">Kết quả tìm kiếm</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          {query ? (
            <>
              Hiển thị <b>{results.length}</b> kết quả cho <b>"{q}"</b>
            </>
          ) : (
            "Nhập từ khóa để tìm kiếm."
          )}
        </p>
        {productsQuery.isLoading ? <p className="text-sm text-zinc-500">Đang tìm kiếm...</p> : null}
        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : query && !productsQuery.isLoading ? (
          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-12 text-center">
            <p className="text-zinc-500 mb-4">Không tìm thấy sản phẩm nào.</p>
            <Link to="/" className="text-brand font-semibold hover:underline">
              Về trang chủ
            </Link>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
