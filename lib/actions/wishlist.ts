"use server";

import { db } from "@/lib/db";
import { wishlistItems, products, cartItems } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { WHOLESALE_PRICING } from "@/lib/db/schema";

export async function toggleWishlist(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const existing = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, user.id),
        eq(wishlistItems.productId, productId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, existing[0].id));
    revalidatePath("/wishlist");
    return { added: false };
  }

  await db.insert(wishlistItems).values({
    userId: user.id,
    productId,
  });

  revalidatePath("/wishlist");
  return { added: true };
}

export async function removeFromWishlist(wishlistItemId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  await db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.id, wishlistItemId),
        eq(wishlistItems.userId, user.id)
      )
    );

  revalidatePath("/wishlist");
  return { success: true };
}

export async function moveToCart(wishlistItemId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const [item] = await db
    .select({
      id: wishlistItems.id,
      productId: wishlistItems.productId,
    })
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.id, wishlistItemId),
        eq(wishlistItems.userId, user.id)
      )
    )
    .limit(1);

  if (!item) return { error: "Wishlist item not found" };

  // Check product availability
  const [product] = await db
    .select({
      isAvailable: products.isAvailable,
      minimumOrderQuantity: products.minimumOrderQuantity,
    })
    .from(products)
    .where(eq(products.id, item.productId))
    .limit(1);

  if (!product || !product.isAvailable) {
    return { error: "Product is currently unavailable" };
  }

  // Add to cart with minimum quantity
  const existingCart = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, user.id),
        eq(cartItems.productId, item.productId),
        eq(cartItems.lineItemType, "single")
      )
    )
    .limit(1);

  if (existingCart.length === 0) {
    await db.insert(cartItems).values({
      userId: user.id,
      productId: item.productId,
      lineItemType: "single",
      quantity: product.minimumOrderQuantity,
    });
  }

  // Remove from wishlist
  await db.delete(wishlistItems).where(eq(wishlistItems.id, item.id));

  revalidatePath("/wishlist");
  revalidatePath("/cart");
  return { success: true };
}
