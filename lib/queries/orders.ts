import { cache } from "react";
import { db } from "@/lib/db";
import { orders, orderItems, products, refunds } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const getCustomerOrders = cache(async (userId: string) => {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      total: orders.total,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(
        select count(*)::int from order_items
        where order_items.order_id = ${orders.id}
      )`,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
});

export const getOrderDetail = cache(async (orderId: string, userId: string) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order || order.userId !== userId) return null;

  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      productName: orderItems.productName,
      lineItemType: orderItems.lineItemType,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      lineTotal: orderItems.lineTotal,
      productSlug: products.slug,
      productImages: products.images,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  const orderRefunds = await db
    .select({
      id: refunds.id,
      amount: refunds.amount,
      reason: refunds.reason,
      createdAt: refunds.createdAt,
    })
    .from(refunds)
    .where(eq(refunds.orderId, orderId))
    .orderBy(desc(refunds.createdAt));

  return { ...order, items, refunds: orderRefunds };
});
