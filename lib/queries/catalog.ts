import { cache } from "react";
import { db } from "@/lib/db";
import {
  products,
  categories,
  platformSettings,
} from "@/lib/db/schema";
import { eq, and, ilike, or, asc, desc, sql, inArray } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

export type CatalogFilters = {
  search?: string;
  categoryId?: string;
  type?: "singles" | "box_sets";
  badge?: "best_seller" | "new_arrival" | "featured";
  availableOnly?: boolean;
};

/**
 * Search products using a tiered strategy:
 * 1. Exact SKU match
 * 2. Semantic vector search (if embeddings exist and query is descriptive)
 * 3. Fallback to ILIKE text search
 */
async function getSearchProductIds(
  searchTerm: string
): Promise<{ ids: string[]; method: "sku" | "semantic" | "text" } | null> {
  if (!searchTerm) return null;

  // 1. Exact SKU match
  const skuResults = await db
    .select({ id: products.id })
    .from(products)
    .where(ilike(products.sku, searchTerm.trim()))
    .limit(10);

  if (skuResults.length > 0) {
    return { ids: skuResults.map((r) => r.id), method: "sku" };
  }

  // 2. Semantic search via pgvector (if OPENAI_API_KEY is set)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { embed } = await import("ai");
      const { openai } = await import("@ai-sdk/openai");

      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: searchTerm,
      });

      const vectorStr = `[${embedding.join(",")}]`;
      const rawSql = neon(process.env.DATABASE_URL!);

      const results = await rawSql`
        SELECT id, 1 - (embedding <=> ${vectorStr}::vector) as similarity
        FROM products
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT 20
      ` as { id: string; similarity: number }[];

      // Filter by minimum similarity threshold
      const relevant = results.filter((r) => r.similarity > 0.25);

      if (relevant.length > 0) {
        return {
          ids: relevant.map((r) => r.id),
          method: "semantic",
        };
      }
    } catch {
      // Fall through to text search if embedding fails
    }
  }

  // 3. Text search fallback
  return null; // let the caller use ILIKE
}

export const getProducts = cache(async (filters: CatalogFilters = {}) => {
  const conditions = [];

  let searchMethod: string | null = null;
  let orderedSearchIds: string[] | null = null;

  if (filters.search) {
    const searchResult = await getSearchProductIds(filters.search);

    if (searchResult) {
      // Use pre-filtered IDs from SKU or semantic search
      conditions.push(inArray(products.id, searchResult.ids));
      searchMethod = searchResult.method;
      orderedSearchIds = searchResult.ids;
    } else {
      // Fallback: ILIKE on name, sku, tags
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(products.name, term),
          ilike(products.sku, term),
          sql`${products.tags}::text ILIKE ${term}`
        )!
      );
      searchMethod = "text";
    }
  }

  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }

  if (filters.type === "box_sets") {
    conditions.push(eq(products.hasBoxOption, true));
  }

  if (filters.badge === "best_seller") {
    conditions.push(eq(products.isBestSeller, true));
  } else if (filters.badge === "new_arrival") {
    conditions.push(eq(products.isNewArrival, true));
  } else if (filters.badge === "featured") {
    conditions.push(eq(products.isFeatured, true));
  }

  if (filters.availableOnly !== false) {
    conditions.push(eq(products.isAvailable, true));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      wholesalePrice: products.wholesalePrice,
      retailPrice: products.retailPrice,
      hasBoxOption: products.hasBoxOption,
      boxWholesalePrice: products.boxWholesalePrice,
      boxRetailPrice: products.boxRetailPrice,
      isAvailable: products.isAvailable,
      isBestSeller: products.isBestSeller,
      isNewArrival: products.isNewArrival,
      isFeatured: products.isFeatured,
      seasonalTag: products.seasonalTag,
      orderByDate: products.orderByDate,
      images: products.images,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(
      desc(sql`CAST((regexp_match(${products.sku}, '(\d+)'))[1] AS INTEGER)`),
    );

  // For semantic search, preserve the relevance ordering
  if (orderedSearchIds && searchMethod === "semantic") {
    const idOrder = new Map(orderedSearchIds.map((id, i) => [id, i]));
    results.sort(
      (a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999)
    );
  }

  return results;
});

export const getProductBySlug = cache(async (slug: string) => {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      description: products.description,
      shortDescription: products.shortDescription,
      tags: products.tags,
      wholesalePrice: products.wholesalePrice,
      retailPrice: products.retailPrice,
      hasBoxOption: products.hasBoxOption,
      boxWholesalePrice: products.boxWholesalePrice,
      boxRetailPrice: products.boxRetailPrice,
      minimumOrderQuantity: products.minimumOrderQuantity,
      isAvailable: products.isAvailable,
      isBestSeller: products.isBestSeller,
      isNewArrival: products.isNewArrival,
      isFeatured: products.isFeatured,
      seasonalTag: products.seasonalTag,
      orderByDate: products.orderByDate,
      images: products.images,
      weightOz: products.weightOz,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

  return product ?? null;
});

export const getCategories = cache(async () => {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder));
});

export const getPlatformSettings = cache(async () => {
  const rows = await db.select().from(platformSettings);
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
});

// Re-export for backwards compatibility
export { formatCents } from "@/lib/utils/format";
