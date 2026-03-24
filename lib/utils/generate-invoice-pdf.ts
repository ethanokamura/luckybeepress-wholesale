import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  InvoiceTemplate,
  type InvoiceOrder,
} from "@/components/pdf/InvoiceTemplate";

export async function generateInvoicePdf(orderId: string): Promise<{
  buffer: Buffer;
  orderNumber: string;
}> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) throw new Error("Order not found");

  const [customer] = await db
    .select({
      businessName: users.businessName,
      ownerName: users.ownerName,
      email: users.email,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, order.userId))
    .limit(1);

  const items = await db
    .select({
      productName: orderItems.productName,
      lineItemType: orderItems.lineItemType,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      lineTotal: orderItems.lineTotal,
      productId: orderItems.productId,
      sku: products.sku,
      images: products.images,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  const addr = order.shippingAddressSnapshot as {
    recipientName: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  const invoiceOrder: InvoiceOrder = {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    taxAmount: order.taxAmount,
    discountAmount: order.discountAmount,
    discountPercent: order.discountPercent,
    total: order.total,
    notes: order.notes,
    createdAt: order.createdAt,
    shippingAddress: addr,
    customer: customer ?? {
      businessName: null,
      ownerName: null,
      email: "unknown",
      phone: null,
    },
    items: items.map((item) => ({
      productName: item.productName,
      sku: item.sku ?? null,
      image: (item.images as string[] | null)?.[0] ?? null,
      lineItemType: item.lineItemType,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(
      InvoiceTemplate,
      { order: invoiceOrder },
    ) as React.ReactElement<DocumentProps>,
  );

  return {
    buffer: Buffer.from(pdfBuffer),
    orderNumber: order.orderNumber,
  };
}
