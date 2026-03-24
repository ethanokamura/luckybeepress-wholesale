"use server";

import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  cartItems,
  products,
  addresses,
  refunds,
  WHOLESALE_PRICING,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, notInArray, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformSettings } from "@/lib/queries/catalog";
import { stripe } from "@/lib/stripe";
import { resend, FROM_EMAIL } from "@/lib/email";
import { generateOrderNumber } from "@/lib/utils/order-number";

export async function placeOrderAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (user.status !== "active") return { error: "Account not approved" };

  const paymentMethod = formData.get("paymentMethod") as
    | "credit_card"
    | "net_30";
  const notes = (formData.get("notes") as string) || null;
  const selectedAddressId = formData.get("addressId") as string | null;

  if (paymentMethod === "net_30" && !user.isNet30Eligible) {
    return { error: "You are not eligible for Net 30 payment" };
  }

  // Get cart items
  const cart = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      lineItemType: cartItems.lineItemType,
      quantity: cartItems.quantity,
      productName: products.name,
      wholesalePrice: products.wholesalePrice,
      boxWholesalePrice: products.boxWholesalePrice,
      isAvailable: products.isAvailable,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, user.id));

  if (cart.length === 0) {
    return { error: "Cart is empty" };
  }

  // Check all items available
  const unavailable = cart.filter((i) => !i.isAvailable);
  if (unavailable.length > 0) {
    return {
      error: `Remove unavailable items: ${unavailable.map((i) => i.productName).join(", ")}`,
    };
  }

  // Calculate totals
  let subtotal = 0;
  const itemsToInsert = cart.map((item) => {
    const unitPrice =
      item.lineItemType === "box_set"
        ? (item.boxWholesalePrice ?? WHOLESALE_PRICING.BOX_PRICE)
        : item.wholesalePrice;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    return {
      productId: item.productId,
      productName: item.productName,
      lineItemType: item.lineItemType as "single" | "box_set",
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    };
  });

  // Check minimum
  const settings = await getPlatformSettings();

  const refundedOrderIds = db.select({ orderId: refunds.orderId }).from(refunds);
  const [completedOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.userId, user.id),
        eq(orders.status, "delivered"),
        notInArray(orders.id, refundedOrderIds)
      )
    );

  const isReturning = completedOrders.count > 0;
  const minimumCents = isReturning
    ? Math.round(parseFloat(settings.returning_customer_minimum ?? "100") * 100)
    : Math.round(parseFloat(settings.new_customer_minimum ?? "150") * 100);

  if (subtotal < minimumCents) {
    return { error: "Order does not meet minimum" };
  }

  // Get shipping address — use selected, fall back to default, then first
  let addr;
  if (selectedAddressId) {
    [addr] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, selectedAddressId), eq(addresses.userId, user.id)))
      .limit(1);
  }
  if (!addr) {
    [addr] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.userId, user.id), eq(addresses.isDefault, true)))
      .limit(1);
  }
  if (!addr) {
    [addr] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id))
      .limit(1);
  }

  if (!addr) {
    return { error: "No shipping address on file" };
  }

  // Calculate order totals
  const shippingCents = Math.round(
    parseFloat(settings.shipping_rate ?? "15") * 100
  );
  const discountPercent = user.customDiscountPercent
    ? parseFloat(user.customDiscountPercent)
    : 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const taxAmount = user.isTaxExempt ? 0 : 0;
  const total = subtotal - discountAmount + shippingCents + taxAmount;

  // Create order
  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: user.id,
      status: "pending",
      paymentMethod,
      paymentStatus: "pending",
      subtotal,
      shippingCost: shippingCents,
      taxAmount,
      discountPercent: discountPercent.toFixed(2),
      discountAmount,
      total,
      notes,
      shippingAddressSnapshot: {
        recipientName: addr.recipientName,
        street1: addr.street1,
        street2: addr.street2 ?? undefined,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
      },
    })
    .returning();

  // Insert order items
  await db.insert(orderItems).values(
    itemsToInsert.map((item) => ({ orderId: order.id, ...item }))
  );

  // Process payment
  if (paymentMethod === "credit_card") {
    const lineItems = itemsToInsert.map((item) => ({
      price_data: {
        currency: "usd" as const,
        unit_amount: item.unitPrice,
        product_data: {
          name: `${item.productName} (${item.lineItemType === "box_set" ? "Box Set" : "Singles"})`,
        },
      },
      quantity: item.quantity,
    }));

    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd" as const,
          unit_amount: shippingCents,
          product_data: { name: "Flat Rate Shipping" },
        },
        quantity: 1,
      });
    }

    if (discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd" as const,
          unit_amount: -discountAmount,
          product_data: { name: `Wholesale Discount (${discountPercent}%)` },
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: lineItems,
      metadata: { orderId: order.id, userId: user.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
    });

    if (session.payment_intent) {
      await db
        .update(orders)
        .set({
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent.id,
        })
        .where(eq(orders.id, order.id));
    }

    // Send confirmation email
    const addrString = `${addr.recipientName}, ${addr.street1}${addr.street2 ? `, ${addr.street2}` : ""}, ${addr.city}, ${addr.state} ${addr.zip}`;
    await sendOrderConfirmationEmail(user.email, user.ownerName ?? "Customer", order, itemsToInsert, addrString);

    redirect(session.url!);
  } else {
    // Net 30 — create Stripe invoice
    const stripeCustomer = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (stripeCustomer.data.length > 0) {
      customerId = stripeCustomer.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.businessName ?? user.ownerName ?? undefined,
      });
      customerId = newCustomer.id;
    }

    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 30,
      metadata: { orderId: order.id },
    });

    await Promise.all([
      ...itemsToInsert.map((item) =>
        stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          description: `${item.productName} (${item.lineItemType === "box_set" ? "Box Set" : "Singles"}) x${item.quantity}`,
          amount: item.unitPrice * item.quantity,
          currency: "usd",
        })
      ),
      stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        description: "Flat Rate Shipping",
        amount: shippingCents,
        currency: "usd",
      }),
    ]);

    await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(invoice.id);

    await Promise.all([
      db
        .update(orders)
        .set({ stripeInvoiceId: invoice.id })
        .where(eq(orders.id, order.id)),
      db.delete(cartItems).where(eq(cartItems.userId, user.id)),
    ]);

    const addrString = `${addr.recipientName}, ${addr.street1}${addr.street2 ? `, ${addr.street2}` : ""}, ${addr.city}, ${addr.state} ${addr.zip}`;
    await sendOrderConfirmationEmail(user.email, user.ownerName ?? "Customer", order, itemsToInsert, addrString);

    redirect(`/orders/${order.id}`);
  }
}

async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: { id: string; orderNumber: string; total: number; subtotal: number; shippingCost: number; discountAmount: number },
  items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[],
  shippingAddress: string
) {
  const { orderConfirmationEmail } = await import("@/lib/emails/templates");
  const { generateInvoicePdf } = await import("@/lib/utils/generate-invoice-pdf");

  let attachments: { filename: string; content: Buffer }[] | undefined;
  try {
    const { buffer, orderNumber } = await generateInvoicePdf(order.id);
    attachments = [{ filename: `Invoice-${orderNumber}.pdf`, content: buffer }];
  } catch {
    // If PDF generation fails, still send the email without the attachment
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html: orderConfirmationEmail({
      name,
      orderNumber: order.orderNumber,
      items,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      total: order.total,
      shippingAddress,
    }),
    attachments,
  });
}

// ─── Cancel Order ────────────────────────────────────────────

export async function cancelOrderAction(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .limit(1);

  if (!order) return { error: "Order not found" };

  if (order.status !== "pending" && order.status !== "confirmed") {
    return { error: "Order cannot be cancelled at this stage" };
  }

  await db
    .update(orders)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: "Cancelled by customer",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Auto-refund credit card / void Net 30 invoice
  if (order.paymentStatus === "paid" && order.stripePaymentIntentId) {
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });
    await db.insert(refunds).values({
      orderId,
      amount: order.total,
      reason: "Cancelled by customer",
      stripeRefundId: refund.id,
    });
  } else if (order.stripeInvoiceId) {
    await stripe.invoices.voidInvoice(order.stripeInvoiceId);
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: true };
}

// ─── Reorder ─────────────────────────────────────────────────

export async function reorderAction(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (user.status !== "active") return { error: "Account not approved" };

  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .limit(1);

  if (!order) return { error: "Order not found" };

  const items = await db
    .select({
      productId: orderItems.productId,
      lineItemType: orderItems.lineItemType,
      quantity: orderItems.quantity,
      isAvailable: products.isAvailable,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  // Fetch all existing cart items in one query
  const existingCartItems = await db
    .select({ id: cartItems.id, productId: cartItems.productId, lineItemType: cartItems.lineItemType, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.userId, user.id));

  const cartMap = new Map(
    existingCartItems.map((ci) => [`${ci.productId}:${ci.lineItemType}`, ci])
  );

  // Add available items to cart
  for (const item of items) {
    if (!item.isAvailable) continue;

    const existing = cartMap.get(`${item.productId}:${item.lineItemType}`);

    if (existing) {
      await db
        .update(cartItems)
        .set({ quantity: existing.quantity + item.quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        userId: user.id,
        productId: item.productId,
        lineItemType: item.lineItemType,
        quantity: item.quantity,
      });
    }
  }

  revalidatePath("/cart");
  redirect("/cart");
}
