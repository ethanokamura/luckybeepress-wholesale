import Link from "next/link";
import Image from "next/image";
import { formatCents } from "@/lib/queries/catalog";
import { QuickWishlistButton } from "./quick-wishlist-button";
import { ProductBadges } from "@/components/shop/product-badges";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  wholesalePrice: number;
  retailPrice: number;
  hasBoxOption: boolean;
  boxWholesalePrice: number | null;
  boxRetailPrice: number | null;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  seasonalTag: string | null;
  images: string[];
  categoryName: string | null;
};

export function ProductCard({ product, isWishlisted = false }: { product: Product; isWishlisted?: boolean }) {
  const primaryImage = product.images[0];

  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-muted hover-warm-glow">
      {/* Wishlist — top right, always visible if wishlisted, otherwise on hover */}
      <div className={`absolute right-2.5 top-2.5 z-20 transition-opacity duration-200 ${isWishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <QuickWishlistButton productId={product.id} initialWishlisted={isWishlisted} />
      </div>

      {/* Badges — always visible top left */}
      <div className="absolute left-2.5 top-2.5 z-20">
        <ProductBadges
          isAvailable={product.isAvailable}
          isBestSeller={product.isBestSeller}
          isNewArrival={product.isNewArrival}
          seasonalTag={product.seasonalTag}
        />
      </div>

      <Link href={`/catalog/${product.slug}`} className="block size-full">
        {/* Full-bleed image */}
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            width={400}
            height={500}
            className="size-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Info overlay — always visible on mobile, slides up on desktop hover */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-3 pt-16 sm:p-4 sm:pt-20 bg-gradient-to-t from-warm-black/90 via-warm-black/70 to-transparent sm:translate-y-full sm:opacity-0 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          {product.categoryName && (
            <p className="text-[11px] tracking-wider uppercase text-white/60 mb-1">
              {product.categoryName}
            </p>
          )}
          <p className="font-heading text-sm font-semibold leading-tight text-white">
            {product.name}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold tabular-nums text-white">
              {formatCents(product.wholesalePrice)}
            </span>
            <span className="text-xs text-white/50">WSP</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
