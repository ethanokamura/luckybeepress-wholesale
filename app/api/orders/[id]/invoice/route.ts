import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  InvoiceTemplate,
  type InvoiceOrder,
} from "@/components/pdf/InvoiceTemplate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;

    // Fetch order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify access: must be order owner or admin
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (order.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch customer info
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

    // Fetch order items with product details
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

    // Build the invoice data
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

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(
        InvoiceTemplate,
        { order: invoiceOrder }
      ) as React.ReactElement<DocumentProps>
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
