import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishlistItems, products, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/queries/catalog";
import { WishlistActions } from "./wishlist-actions";
import { EmptyState } from "@/components/shop/empty-state";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await db
    .select({
      id: wishlistItems.id,
      productId: products.id,
      name: products.name,
      slug: products.slug,
      images: products.images,
      wholesalePrice: products.wholesalePrice,
      retailPrice: products.retailPrice,
      isAvailable: products.isAvailable,
      categoryName: categories.name,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(wishlistItems.userId, user.id));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1>Wishlist</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {items.length} saved item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you're interested in for later."
          actionLabel="Browse catalog"
          actionHref="/catalog"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
            >
              <div className="size-20 overflow-hidden rounded-lg bg-muted shrink-0">
                {item.images[0] ? (
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/catalog/${item.slug}`}
                  className="font-medium hover:underline truncate block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  {item.name}
                </Link>
                {item.categoryName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.categoryName}
                  </p>
                )}
                <div className="mt-1">
                  <p className="text-sm font-mono font-medium">
                    {formatCents(item.wholesalePrice)}
                  </p>
                  <p className="text-xs text-muted-foreground">wholesale</p>
                </div>
                {!item.isAvailable && (
                  <Badge variant="secondary" className="mt-1">
                    Currently unavailable
                  </Badge>
                )}
              </div>
              <WishlistActions wishlistItemId={item.id} isAvailable={item.isAvailable} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
