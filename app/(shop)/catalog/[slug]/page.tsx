import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProductBySlug, formatCents } from "@/lib/queries/catalog";
import { WHOLESALE_PRICING } from "@/lib/db/schema";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";
import { ProductBadges } from "@/components/shop/product-badges";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Check, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} — Lucky Bee Press Wholesale`,
    description:
      product.shortDescription ??
      `Wholesale ${product.name} letterpress card. ${formatCents(product.wholesalePrice)} WSP.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, user] = await Promise.all([
    getProductBySlug(slug),
    getCurrentUser(),
  ]);

  if (!product) notFound();

  const isWishlisted = user
    ? (await db
        .select({ id: wishlistItems.id })
        .from(wishlistItems)
        .where(
          and(
            eq(wishlistItems.userId, user.id),
            eq(wishlistItems.productId, product.id),
          ),
        )
        .limit(1)).length > 0
    : false;

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/catalog" className="hover:text-foreground transition-colors">
          Catalog
        </Link>
        <ChevronRight className="size-3.5" />
        {product.categoryName && (
          <>
            <Link
              href={`/catalog?category=${product.categoryId}`}
              className="hover:text-foreground transition-colors"
            >
              {product.categoryName}
            </Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      {/* Images */}
      <div className="flex flex-col gap-3">
        {product.images.length > 0 ? (
          <>
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <Image
                src={product.images[0]}
                alt={product.name}
                width={600}
                height={600}
                className="size-full object-cover"
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1).map((img, i) => (
                  <div
                    key={i}
                    className="group/thumb aspect-square overflow-hidden rounded-md bg-muted cursor-pointer"
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 2}`}
                      width={150}
                      height={150}
                      className="size-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover/thumb:scale-110"
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground">
            No image available
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs tracking-wide uppercase text-muted-foreground">{product.categoryName}</p>
          <h1 className="mt-2">{product.name}</h1>

          {/* Badges */}
          <div className="mt-3">
            <ProductBadges
              isAvailable={product.isAvailable}
              isBestSeller={product.isBestSeller}
              isNewArrival={product.isNewArrival}
              seasonalTag={product.seasonalTag}
            />
          </div>

          {product.orderByDate && (
            <p className="mt-2 text-sm text-accent font-medium">
              Order by {product.orderByDate.toLocaleDateString()} for seasonal delivery
            </p>
          )}
        </div>

        {/* Pricing */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-semibold font-mono">
                {formatCents(product.wholesalePrice)} WSP
              </span>
              <span className="text-sm text-muted-foreground font-mono">
                {formatCents(product.retailPrice)} SRP
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Singles — sold in sets of {product.minimumOrderQuantity} cards
            </p>

            {product.hasBoxOption && product.boxWholesalePrice && (
              <>
                <Separator />
                <div className="flex items-baseline gap-3">
                  <span className="text-lg font-semibold font-mono">
                    {formatCents(product.boxWholesalePrice)} WSP
                  </span>
                  {product.boxRetailPrice && (
                    <span className="text-sm text-muted-foreground font-mono">
                      {formatCents(product.boxRetailPrice)} SRP
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Box set of {WHOLESALE_PRICING.CARDS_PER_BOX} — sold in sets of {WHOLESALE_PRICING.BOX_MIN_QTY} boxes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {product.isAvailable ? (
            <AddToCartButton
              productId={product.id}
              hasBoxOption={product.hasBoxOption}
              singlesIncrement={product.minimumOrderQuantity}
              boxIncrement={WHOLESALE_PRICING.BOX_MIN_QTY}
              singlesPrice={product.wholesalePrice}
              boxPrice={product.boxWholesalePrice ?? undefined}
            />
          ) : (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                This product is currently unavailable
              </AlertDescription>
            </Alert>
          )}
          <WishlistButton productId={product.id} initialWishlisted={isWishlisted} />
        </div>

        {/* Specs */}
        <div className="flex flex-col gap-2 text-sm">
          <h3 className="font-medium">Product Details</h3>
          <ul className="flex flex-col gap-1.5 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-primary-text" />
              <span>Letterpress printed on 100% cotton cardstock</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-primary-text" />
              <span>Hand-mixed inks</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-primary-text" />
              <span>Recycled envelope included</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-primary-text" />
              <span>A2 size — 5.5&quot;W &times; 4.25&quot;H</span>
            </li>
            {product.sku && (
              <li className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0 text-primary-text" />
                <span>SKU: {product.sku}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Description */}
        {product.description && (
          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>{product.description}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
