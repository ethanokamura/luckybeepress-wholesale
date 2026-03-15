import Link from "next/link";
import { getAdminProducts, getCategories } from "@/lib/admin/queries";
import { ProductListClient } from "./product-list-client";
import { LineSheetExport } from "./line-sheet-export";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getCategories(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-3">
          <LineSheetExport categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
          <Link
            href="/admin/products/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Product
          </Link>
        </div>
      </div>

      <ProductListClient
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          categoryId: p.categoryId,
          categoryName: p.categoryName,
          wholesalePrice: p.wholesalePrice,
          wholesalePriceFormatted: formatCents(p.wholesalePrice),
          retailPrice: p.retailPrice,
          retailPriceFormatted: formatCents(p.retailPrice),
          isAvailable: p.isAvailable,
          isBestSeller: p.isBestSeller,
          isNewArrival: p.isNewArrival,
          isFeatured: p.isFeatured,
          sortOrder: p.sortOrder,
          images: p.images as string[] | null,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
