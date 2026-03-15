import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getCategories, type CatalogFilters } from "@/lib/queries/catalog";
import { ProductCard } from "./product-card";
import { CatalogFiltersBar } from "./catalog-filters";
import { EmptyState } from "@/components/shop/empty-state";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Browse the full Lucky Bee Press wholesale catalog. Letterpress greeting cards, coasters, and stationery at wholesale prices.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const filters: CatalogFilters = {
    search: params.search,
    categoryId: params.category,
    type: params.type as CatalogFilters["type"],
    badge: params.badge as CatalogFilters["badge"],
    availableOnly: params.available !== "all",
  };

  const user = await getCurrentUser();

  const [productList, categoryList, wishlisted] = await Promise.all([
    getProducts(filters),
    getCategories(),
    user
      ? db
          .select({ productId: wishlistItems.productId })
          .from(wishlistItems)
          .where(eq(wishlistItems.userId, user.id))
      : Promise.resolve([]),
  ]);

  const wishlistedIds = new Set(wishlisted.map((w) => w.productId));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1>Catalog</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {productList.length} product{productList.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <Suspense>
        <CatalogFiltersBar
          categories={categoryList}
          currentFilters={params}
        />
      </Suspense>

      {productList.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          description="Try adjusting your filters or search term to find what you're looking for."
          actionLabel="Clear filters"
          actionHref="/catalog"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productList.map((product) => (
            <ProductCard key={product.id} product={product} isWishlisted={wishlistedIds.has(product.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
