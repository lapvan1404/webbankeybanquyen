import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { money, type Product } from "@/lib/products";
import { toast } from "sonner";

function cleanBrandName(rawBrand?: string) {
  if (!rawBrand) return "";
  const b = rawBrand.trim();
  if (b.toLowerCase().includes("microsoft") || b === "seed-brand-microsoft") return "MICROSOFT";
  if (b.toLowerCase().includes("eset") || b === "seed-brand-eset") return "ESET";
  if (b.toLowerCase().includes("kaspersky") || b === "seed-brand-kaspersky") return "KASPERSKY";
  if (b.toLowerCase().includes("bkav") || b === "seed-brand-bkav") return "BKAV";
  if (b.toLowerCase().includes("cmc") || b === "seed-brand-cmc") return "CMC";
  if (b.toLowerCase().includes("bitdefender")) return "BITDEFENDER";
  if (b.toLowerCase().includes("adobe")) return "ADOBE";
  if (b.startsWith("seed-brand-")) return b.replace("seed-brand-", "").toUpperCase();
  if (/^[0-9a-f-]{30,}$/i.test(b)) return "";
  return b.toUpperCase();
}

export function ProductCard({
  product,
  dark = false,
  hideRating = false,
}: {
  product: Product;
  dark?: boolean;
  hideRating?: boolean;
}) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  const brandText = cleanBrandName(product.brand);

  const handleAddToCart = async (e: React.MouseEvent) => {
    // Ngăn click lan ra Link wrapper
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      const result = await add(product, 1);

      if (result.requiresLogin) {
        // Chưa đăng nhập → chuyển hướng sang trang đăng nhập
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
        navigate({
          to: "/login",
          search: { redirect: `/product/${product.slug}` } as any,
        });
        return;
      }

      // Đăng nhập rồi → thông báo thành công
      toast.success(`✅ Đã thêm "${product.name}" vào giỏ hàng!`);
    } catch (err: any) {
      toast.error(err?.message ?? "Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        "group rounded-xl p-4 ring-1 transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between h-full " +
        (dark
          ? "bg-zinc-800/50 ring-white/5 hover:ring-white/20"
          : "bg-white ring-black/5 hover:ring-brand/30")
      }
    >
      <Link to="/product/$slug" params={{ slug: product.slug }} className="flex-1 flex flex-col justify-between block">
        <div>
          <div
            className={
              "relative aspect-square rounded-lg overflow-hidden mb-3 " +
              (dark ? "bg-zinc-800" : "bg-zinc-50")
            }
          >
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {product.badge && (
              <span className="absolute top-2 left-2 bg-accent2 text-[10px] font-bold px-2 py-1 rounded text-ink">
                {product.badge}
              </span>
            )}
            {discount > 0 && !product.badge && (
              <span className="absolute top-2 left-2 bg-accent2 text-[10px] font-bold px-2 py-1 rounded text-ink">
                -{discount}%
              </span>
            )}
          </div>

          <span
            className={
              "text-[10px] uppercase font-bold tracking-wider truncate block h-4 leading-4 " +
              (dark ? "text-zinc-500" : "text-zinc-500")
            }
          >
            {brandText || "\u00A0"}
          </span>

          <h4
            className={
              "text-sm font-medium mt-1 mb-2 line-clamp-2 h-10 leading-tight " +
              (dark ? "text-zinc-100" : "text-ink")
            }
          >
            {product.name}
          </h4>
        </div>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className={"font-semibold " + (dark ? "text-white" : "text-ink")}>
              {money(product.price)}
            </span>
            {product.compareAt && (
              <span
                className={"text-xs line-through " + (dark ? "text-zinc-500" : "text-zinc-400")}
              >
                {money(product.compareAt)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Nút thêm vào giỏ — xử lý đầy đủ login check */}
      <button
        id={`add-cart-${product.id}`}
        disabled={loading}
        onClick={handleAddToCart}
        className="mt-3 w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-brand-foreground text-xs font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Đang thêm...
          </>
        ) : (
          <>
            <ShoppingCart className="size-3.5" /> Thêm vào giỏ
          </>
        )}
      </button>
    </div>
  );
}
