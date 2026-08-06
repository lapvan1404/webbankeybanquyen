import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Star,
  Send,
  Loader2,
  Trash2,
  LogIn,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/products";
import { ApiProduct, getProductBySlug, toProduct } from "@/lib/storeApi";
import { apiFetch } from "@/lib/apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────
type ReviewUser = { id: string; name: string; avatar?: string | null };
type Review = {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  user: ReviewUser;
};

// ─── API helpers ─────────────────────────────────────────────────────────────
const fetchReviews = (productId: string): Promise<Review[]> =>
  apiFetch<Review[]>(`/api/products/${productId}/reviews`).catch(() => []);

const postReview = (productId: string, body: string, rating: number) =>
  apiFetch<Review>(`/api/products/${productId}/reviews`, {
    method: "POST",
    body: { body, rating },
    credentials: "include",
  });

const callDeleteReview = (reviewId: string) =>
  apiFetch(`/api/reviews/${reviewId}`, { method: "DELETE", credentials: "include" });

// ─── Route ───────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
    return { slug: params.slug, initialProduct: product };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.initialProduct?.name
          ? `${loaderData.initialProduct.name} — Công Ty TNHH Công Nghệ Nam Nguyễn`
          : "Sản phẩm — Công Ty TNHH Công Nghệ Nam Nguyễn",
      },
    ],
  }),
  component: ProductPage,
});

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const cls = size === "sm" ? "size-3.5" : "size-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => onChange?.(s)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
          aria-label={`${s} sao`}
        >
          <Star
            className={`${cls} transition-colors ${
              s <= active ? "fill-amber-400 text-amber-400" : "text-zinc-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Review Item ──────────────────────────────────────────────────────────────
function ReviewItem({
  review,
  currentUserId,
  onDelete,
}: {
  review: Review;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const isOwner = review.user.id === currentUserId;
  const initials = review.user.name.charAt(0).toUpperCase();
  const date = new Date(review.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/5 p-5 flex gap-4 group">
      {review.user.avatar ? (
        <img
          src={review.user.avatar}
          alt={review.user.name}
          className="size-10 rounded-full object-cover shrink-0 border border-zinc-200"
        />
      ) : (
        <div className="size-10 rounded-full bg-brand/10 text-brand grid place-items-center text-sm font-bold shrink-0">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="font-semibold text-sm text-zinc-900">{review.user.name}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={review.rating} readonly size="sm" />
              <span className="text-[11px] text-zinc-400">{date}</span>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={() => onDelete(review.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
              title="Xóa bình luận của bạn"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{review.body}</p>
      </div>
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────
function ReviewForm({
  productId,
  user,
  onSuccess,
}: {
  productId: string;
  user: { id: string; name?: string; email?: string } | null;
  onSuccess: () => void;
}) {
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const MAX = 1000;

  const mutation = useMutation({
    mutationFn: () => postReview(productId, body.trim(), rating),
    onSuccess: () => {
      toast.success("✅ Cảm ơn bạn đã bình luận!");
      setBody("");
      setRating(5);
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Gửi bình luận thất bại. Vui lòng thử lại.");
    },
  });

  const handleSubmit = () => {
    if (!user) {
      navigate({ to: "/login", search: { redirect: window.location.pathname } as any });
      return;
    }
    if (!body.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận.");
      return;
    }
    if (body.trim().length < 5) {
      toast.error("Bình luận phải có ít nhất 5 ký tự.");
      return;
    }
    if (body.trim().length > MAX) {
      toast.error(`Bình luận không được quá ${MAX} ký tự.`);
      return;
    }
    mutation.mutate();
  };

  // Chưa đăng nhập → prompt đăng nhập
  if (!user) {
    return (
      <div className="bg-zinc-50 rounded-2xl ring-1 ring-zinc-200 p-6 text-center">
        <MessageCircle className="size-8 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-600 mb-4">
          Vui lòng đăng nhập để viết bình luận cho sản phẩm này.
        </p>
        <button
          onClick={() =>
            navigate({ to: "/login", search: { redirect: window.location.pathname } as any })
          }
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-brand-foreground font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
        >
          <LogIn className="size-4" />
          Đăng nhập để bình luận
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-brand/10 text-brand grid place-items-center text-sm font-bold shrink-0">
          {(user.name || user.email || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{user.name || user.email}</p>
          <p className="text-xs text-zinc-400">Đang viết bình luận</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600 font-medium">Đánh giá của bạn:</span>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div className="relative">
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
          maxLength={MAX}
          className="w-full min-h-[120px] rounded-xl border border-zinc-200 p-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 resize-none transition-all"
        />
        <span
          className={`absolute bottom-3 right-3 text-[11px] font-mono ${
            body.length > MAX * 0.9 ? "text-red-400" : "text-zinc-300"
          }`}
        >
          {body.length}/{MAX}
        </span>
      </div>
      <div className="flex justify-end">
        <button
          id="submit-review-btn"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-brand-foreground font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Gửi bình luận
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ProductPage() {
  const { slug, initialProduct } = Route.useLoaderData() as {
    slug: string;
    initialProduct: ApiProduct | null;
  };

  // ✅ TẤT CẢ hooks phải gọi ở đây — TRƯỚC mọi điều kiện return
  const productQuery = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    initialData: initialProduct ?? undefined,
    retry: false,
  });

  const { add } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [addLoading, setAddLoading] = useState(false);

  const apiProduct = productQuery.data ?? initialProduct;

  // Reviews query — dùng id hoặc slug tuỳ vào apiProduct
  const productId = apiProduct?.id ?? "";
  const reviewsQuery = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchReviews(productId),
    enabled: !!productId,
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => callDeleteReview(reviewId),
    onSuccess: () => {
      toast.success("Đã xóa bình luận.");
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: () => toast.error("Không thể xóa bình luận lúc này."),
  });

  // ✅ Early return SAU tất cả hooks
  if (!apiProduct) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-10 text-center">
            <h1 className="text-2xl font-semibold mb-2">Không tìm thấy sản phẩm</h1>
            <p className="text-zinc-500 mb-5">Sản phẩm đã bị xóa hoặc không tồn tại.</p>
            <Link to="/" className="text-brand font-semibold hover:underline">
              Về trang chủ
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const product = toProduct(apiProduct);
  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  const apiImages =
    Array.isArray(apiProduct.images) && apiProduct.images.length > 0
      ? apiProduct.images
          .map((entry) => entry?.url)
          .filter((url): url is string => typeof url === "string" && url.length > 0)
      : [];
  const productImages = apiImages.length > 0 ? apiImages : [product.image].filter(Boolean);
  const currentImage = productImages[imageIndex] ?? product.image;

  const reviews: Review[] = reviewsQuery.data ?? [];
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const handleDeleteReview = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa bình luận này không?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-brand">Trang chủ</Link>
          <ChevronRight className="size-3" />
          <Link
            to="/category/$slug"
            params={{ slug: product.category }}
            className="hover:text-brand capitalize"
          >
            {product.category}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-ink font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* ── Ảnh sản phẩm ── */}
          <div className="col-span-12 lg:col-span-7">
            <div className="relative bg-white rounded-2xl ring-1 ring-black/5 overflow-hidden aspect-square">
              <img
                src={currentImage}
                alt={product.name}
                width={800}
                height={800}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <button
                onClick={() =>
                  setImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow-lg ring-1 ring-black/10 hover:bg-white"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="size-5 text-zinc-800" />
              </button>
              <button
                onClick={() => setImageIndex((prev) => (prev + 1) % productImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow-lg ring-1 ring-black/10 hover:bg-white"
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight className="size-5 text-zinc-800" />
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 mt-4">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={
                    "aspect-square rounded-xl overflow-hidden ring-2 transition-all relative " +
                    (i === imageIndex
                      ? "ring-brand shadow-sm scale-95"
                      : "ring-black/5 hover:ring-brand/50 opacity-75 hover:opacity-100")
                  }
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute top-1 left-1 bg-brand text-white text-[9px] font-extrabold px-1 py-0.2 rounded shadow-sm">
                      Chính
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* ── Thông tin sản phẩm ── */}
          <div className="col-span-12 lg:col-span-5">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              {product.brand}
            </span>
            <h1 className="text-2xl lg:text-3xl font-semibold mt-2 mb-3">{product.name}</h1>

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <span className="text-sm font-semibold text-zinc-800">{avgRating}</span>
                <span className="text-sm text-zinc-400">({reviews.length} bình luận)</span>
              </div>
            )}

            {apiProduct.shortDescription && (
              <p className="text-sm text-zinc-600 mb-4 leading-relaxed">{apiProduct.shortDescription}</p>
            )}

            <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6 mb-5">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-semibold">{money(product.price)}</span>
                {product.compareAt && (
                  <>
                    <span className="text-lg text-zinc-400 line-through">{money(product.compareAt)}</span>
                    <span className="text-xs font-bold text-white bg-accent2 px-2 py-1 rounded">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-brand mb-5">
                <Check className="size-4" /> Còn {product.stock} key · Giao qua email trong 5 phút
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center bg-zinc-100 rounded-lg">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="size-10 grid place-items-center text-lg hover:text-brand">−</button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="size-10 grid place-items-center text-lg hover:text-brand">+</button>
                </div>
                <button
                  id="add-to-cart-btn"
                  disabled={addLoading}
                  onClick={async () => {
                    setAddLoading(true);
                    try {
                      const result = await add(product, qty);
                      if (result.requiresLogin) {
                        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
                        navigate({
                          to: "/login",
                          search: { redirect: window.location.pathname } as any,
                        });
                        return;
                      }
                      toast.success(`✅ Đã thêm ${qty} × ${product.name} vào giỏ hàng!`);
                    } catch (err: any) {
                      toast.error(err?.message ?? "Không thể thêm vào giỏ hàng.");
                    } finally {
                      setAddLoading(false);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-brand-foreground font-semibold py-3 rounded-lg transition-colors"
                >
                  {addLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="size-4" /> Thêm vào giỏ
                    </>
                  )}
                </button>
                <button className="size-11 grid place-items-center rounded-lg ring-1 ring-black/10 hover:ring-brand hover:text-brand" aria-label="Yêu thích">
                  <Heart className="size-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  navigate({
                    to: user ? "/checkout" : "/login",
                    search: { buyNowProductId: product.id, buyNowQuantity: String(qty) },
                  });
                }}
                className="w-full bg-accent2 hover:brightness-95 text-ink font-semibold py-3 rounded-lg transition-all"
              >
                Mua ngay
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs mb-6">
              {([
                [Truck, "Giao key qua email"],
                [ShieldCheck, "Bản quyền chính hãng"],
                [RotateCcw, "Bảo hành trọn đời"],
              ] as const).map(([I, t]) => {
                const Icon = I as typeof Truck;
                return (
                  <div key={t} className="bg-white rounded-lg ring-1 ring-black/5 p-3 text-center">
                    <Icon className="size-4 text-brand mx-auto mb-1" />
                    <span className="text-zinc-600 font-medium">{t}</span>
                  </div>
                );
              })}
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-base text-zinc-900">Mô tả sản phẩm</h3>
              <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line bg-zinc-50/70 p-4 rounded-xl ring-1 ring-black/5">
                {apiProduct.shortDescription || (product as any).shortDescription || "Chưa có mô tả ngắn."}
              </div>
            </div>
          </div>
        </div>

        {/* ── Chi tiết & Cài đặt ── */}
        <section className="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-xl font-semibold mb-6">Hướng dẫn cài đặt</h2>
            <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6 space-y-4">
              {[
                ["Bước 1: Nhận key", "Key sẽ được gửi vào email trong vòng 5 phút sau khi thanh toán."],
                ["Bước 2: Tải phần mềm", "Tải về từ trang chủ nhà sản xuất hoặc dùng link tải được cung cấp trong email."],
                ["Bước 3: Kích hoạt", "Mở phần mềm, nhập key và làm theo hướng dẫn để hoàn tất kích hoạt."],
                ["Bước 4: Hỗ trợ", "Nếu có lỗi, liên hệ fanpage hoặc hotline để được hỗ trợ cài đặt từ xa."],
              ].map(([title, desc]) => (
                <div key={title}>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-zinc-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-6">Thông tin chi tiết</h2>
            <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6 space-y-4">
              {apiProduct.description || product.description ? (
                <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                  {apiProduct.description || product.description}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">Chưa có thông tin chi tiết cho sản phẩm này.</p>
              )}
              {product.specs && product.specs.length > 0 && (
                <div className="pt-4 border-t border-zinc-100">
                  <dl>
                    {product.specs.map((s, i) => (
                      <div key={s.label} className={"grid grid-cols-3 px-4 py-3 text-sm rounded-xl " + (i % 2 ? "bg-zinc-50" : "")}>
                        <dt className="text-zinc-500 col-span-1">{s.label}</dt>
                        <dd className="col-span-2 font-medium">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══ BÌNH LUẬN ══ */}
        <section className="mt-16" id="reviews">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Bình luận & Đánh giá</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={Math.round(avgRating)} readonly size="sm" />
                  <span className="text-sm text-zinc-500">
                    <strong className="text-zinc-800">{avgRating}/5</strong> từ {reviews.length} bình luận
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Form — truyền user như prop, không dùng hook bên trong */}
            <ReviewForm
              productId={productId}
              user={user}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["reviews", productId] })}
            />

            {/* Danh sách bình luận */}
            {reviewsQuery.isLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="size-6 animate-spin text-brand" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-zinc-50 rounded-2xl ring-1 ring-zinc-200 py-10 text-center">
                <MessageCircle className="size-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              </div>
            ) : (
              reviews.map((r) => (
                <ReviewItem
                  key={r.id}
                  review={r}
                  currentUserId={user?.id}
                  onDelete={handleDeleteReview}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
