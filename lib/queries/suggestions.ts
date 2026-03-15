import { cache } from "react";
import { db } from "@/lib/db";
import { products, cartItems, categories } from "@/lib/db/schema";
import { eq, and, notInArray, asc } from "drizzle-orm";

/**
 * "Build Your Order" — suggests bestsellers from categories
 * not already represented in the customer's cart.
 */
export const getBuildYourOrderSuggestions = cache(
  async (userId: string, limit = 6) => {
    // Get category IDs already in cart
    const cartCategoryIds = await db
      .select({ categoryId: products.categoryId })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    const excludeIds = cartCategoryIds.map((r) => r.categoryId);

    // Get bestsellers from other categories
    const query = db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        wholesalePrice: products.wholesalePrice,
        images: products.images,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.isAvailable, true),
          eq(products.isBestSeller, true),
          ...(excludeIds.length > 0
            ? [notInArray(products.categoryId, excludeIds)]
            : [])
        )
      )
      .orderBy(asc(products.sortOrder))
      .limit(limit);

    return query;
  }
);
