"use server";

import { db } from "@/lib/db";
import {
  cartItems,
  products,
  orders,
  refunds,
  WHOLESALE_PRICING,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, notInArray, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getPlatformSettings } from "@/lib/queries/catalog";

// ─── Add to Cart ─────────────────────────────────────────────

export async function addToCart(
  productId: string,
  lineItemType: "single" | "box_set",
  quantity: number
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Validate product
  const [product] = await db
    .select({
      isAvailable: products.isAvailable,
      hasBoxOption: products.hasBoxOption,
      minimumOrderQuantity: products.minimumOrderQuantity,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product || !product.isAvailable) {
    return { error: "Product is not available" };
  }

  if (lineItemType === "box_set" && !product.hasBoxOption) {
    return { error: "This product is not available as a box set" };
  }

  // Validate increment
  const increment =
    lineItemType === "single"
      ? product.minimumOrderQuantity
      : WHOLESALE_PRICING.BOX_MIN_QTY;

  if (quantity % increment !== 0) {
    return {
      error: `Quantity must be a multiple of ${increment}`,
    };
  }

  // Check for existing cart item
  const existing = await db
    .select({ id: cartItems.id, quantity: cartItems.quantity })
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, user.id),
        eq(cartItems.productId, productId),
        eq(cartItems.lineItemType, lineItemType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(cartItems)
      .set({
        quantity: existing[0].quantity + quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({
      userId: user.id,
      productId,
      lineItemType,
      quantity,
    });
  }

  revalidatePath("/cart");
  return { success: true };
}

// ─── Update Cart Quantity ────────────────────────────────────

export async function updateCartQuantity(
  cartItemId: string,
  quantity: number
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const [item] = await db
    .select({
      id: cartItems.id,
      lineItemType: cartItems.lineItemType,
      productId: cartItems.productId,
    })
    .from(cartItems)
    .where(
      and(eq(cartItems.id, cartItemId), eq(cartItems.userId, user.id))
    )
    .limit(1);

  if (!item) return { error: "Cart item not found" };

  const [product] = await db
    .select({ minimumOrderQuantity: products.minimumOrderQuantity })
    .from(products)
    .where(eq(products.id, item.productId))
    .limit(1);

  const increment =
    item.lineItemType === "single"
      ? (product?.minimumOrderQuantity ?? WHOLESALE_PRICING.SINGLE_MIN_QTY)
      : WHOLESALE_PRICING.BOX_MIN_QTY;

  if (quantity % increment !== 0) {
    return { error: `Quantity must be a multiple of ${increment}` };
  }

  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  } else {
    await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, cartItemId));
  }

  revalidatePath("/cart");
  return { success: true };
}

// ─── Remove from Cart ────────────────────────────────────────

export async function removeFromCart(cartItemId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  await db
    .delete(cartItems)
    .where(
      and(eq(cartItems.id, cartItemId), eq(cartItems.userId, user.id))
    );

  revalidatePath("/cart");
  return { success: true };
}

// ─── Get Cart with Items ─────────────────────────────────────
// NOTE: This is a data fetcher, not a mutation. It's in this file for
// co-location with cart logic but is only called from server components.

export async function getCartWithItems() {
  const user = await getCurrentUser();
  if (!user) return null;

  const items = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      lineItemType: cartItems.lineItemType,
      quantity: cartItems.quantity,
      productName: products.name,
      productSlug: products.slug,
      productImages: products.images,
      wholesalePrice: products.wholesalePrice,
      boxWholesalePrice: products.boxWholesalePrice,
      isAvailable: products.isAvailable,
      minimumOrderQuantity: products.minimumOrderQuantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, user.id));

  let subtotal = 0;
  for (const item of items) {
    const unitPrice =
      item.lineItemType === "box_set"
        ? (item.boxWholesalePrice ?? WHOLESALE_PRICING.BOX_PRICE)
        : item.wholesalePrice;
    subtotal += unitPrice * item.quantity;
  }

  // Fetch returning-customer status and settings in parallel
  const refundedOrderIds = db
    .select({ orderId: refunds.orderId })
    .from(refunds);

  const [completedOrdersResult, settings] = await Promise.all([
    db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.userId, user.id),
          eq(orders.status, "delivered"),
          notInArray(orders.id, refundedOrderIds)
        )
      ),
    getPlatformSettings(),
  ]);

  const isReturning = completedOrdersResult[0].count > 0;
  const minimumCents = isReturning
    ? Math.round(parseFloat(settings.returning_customer_minimum ?? "100") * 100)
    : Math.round(parseFloat(settings.new_customer_minimum ?? "150") * 100);
  const shippingCents = Math.round(
    parseFloat(settings.shipping_rate ?? "15") * 100
  );

  // Apply customer discount
  const discountPercent = user.customDiscountPercent
    ? parseFloat(user.customDiscountPercent)
    : 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));

  return {
    items,
    subtotal,
    discountPercent,
    discountAmount,
    shippingCents,
    taxAmount: user.isTaxExempt ? 0 : 0, // tax not implemented yet
    total: subtotal - discountAmount + shippingCents,
    minimumCents,
    isReturning,
    isBelowMinimum: subtotal < minimumCents,
    isNet30Eligible: user.isNet30Eligible,
    isTaxExempt: user.isTaxExempt,
  };
}
