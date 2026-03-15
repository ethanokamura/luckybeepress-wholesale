"use server";

import { revalidatePath } from "next/cache";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  users,
  orders,
  orderItems,
  products,
  categories,
  refunds,
  platformSettings,
  addresses,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { resend, FROM_EMAIL } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { sendNewOrderNotification } from "@/lib/admin/emails";
import { generateOrderNumber } from "@/lib/utils/order-number";

// ─── Helpers ──────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Application Actions ─────────────────────────────────────

export async function approveApplication(
  id: string,
  options: { taxExempt?: boolean; note?: string } = {},
) {
  try {
    await requireAdmin();

    const [customer] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!customer) return { success: false, error: "Customer not found" };

    await db
      .update(users)
      .set({
        status: "active",
        isTaxExempt: options.taxExempt ?? customer.isTaxExempt,
        internalNotes: options.note
          ? [customer.internalNotes, options.note].filter(Boolean).join("\n")
          : customer.internalNotes,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    const { applicationApprovedEmail } = await import("@/lib/emails/templates");
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://wholesale.luckybeepress.com"}/login`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: "Your Wholesale Application Has Been Approved!",
      html: applicationApprovedEmail(customer.ownerName ?? "there", loginUrl),
    });

    revalidatePath("/admin/applications");
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve application",
    };
  }
}

export async function rejectApplication(id: string, note?: string) {
  try {
    await requireAdmin();

    const [customer] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!customer) return { success: false, error: "Customer not found" };

    await db
      .update(users)
      .set({
        status: "rejected",
        internalNotes: note
          ? [customer.internalNotes, `Rejection note: ${note}`]
              .filter(Boolean)
              .join("\n")
          : customer.internalNotes,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    const { applicationRejectedEmail } = await import("@/lib/emails/templates");
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: "Update on Your Wholesale Application",
      html: applicationRejectedEmail(customer.ownerName ?? "there", note),
    });

    revalidatePath("/admin/applications");
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject application",
    };
  }
}

// ─── Customer Actions ─────────────────────────────────────────

export async function toggleNet30(customerId: string) {
  try {
    await requireAdmin();

    const [customer] = await db
      .select({ isNet30Eligible: users.isNet30Eligible })
      .from(users)
      .where(eq(users.id, customerId))
      .limit(1);

    if (!customer) return { success: false, error: "Customer not found" };

    await db
      .update(users)
      .set({
        isNet30Eligible: !customer.isNet30Eligible,
        updatedAt: new Date(),
      })
      .where(eq(users.id, customerId));

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle Net 30",
    };
  }
}

export async function toggleTaxExempt(customerId: string) {
  try {
    await requireAdmin();

    const [customer] = await db
      .select({ isTaxExempt: users.isTaxExempt })
      .from(users)
      .where(eq(users.id, customerId))
      .limit(1);

    if (!customer) return { success: false, error: "Customer not found" };

    await db
      .update(users)
      .set({
        isTaxExempt: !customer.isTaxExempt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, customerId));

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle tax exempt",
    };
  }
}

export async function setCustomDiscount(customerId: string, percent: number) {
  try {
    await requireAdmin();

    if (percent < 0 || percent > 100) {
      return { success: false, error: "Discount must be between 0 and 100" };
    }

    const [customer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, customerId))
      .limit(1);

    if (!customer) return { success: false, error: "Customer not found" };

    await db
      .update(users)
      .set({
        customDiscountPercent: percent.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(users.id, customerId));

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set discount",
    };
  }
}

export async function updateInternalNotes(customerId: string, notes: string) {
  try {
    await requireAdmin();

    const [customer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, customerId))
      .limit(1);

    if (!customer) return { success: false, error: "Customer not found" };

    await db
      .update(users)
      .set({
        internalNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(users.id, customerId));

    revalidatePath(`/admin/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notes",
    };
  }
}

export async function sendReengagementEmail(customerId: string) {
  try {
    await requireAdmin();

    const [customer] = await db
      .select({ email: users.email, ownerName: users.ownerName, businessName: users.businessName })
      .from(users)
      .where(eq(users.id, customerId))
      .limit(1);

    if (!customer) return { success: false, error: "Customer not found" };

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: "We Miss You at Lucky Bee Press!",
      html: `<p>Hi ${customer.ownerName},</p>
<p>We noticed it's been a while since your last order with Lucky Bee Press.</p>
<p>We've been adding new products and would love to have you back! Log in to see what's new.</p>
<p>If you have any questions or need assistance, feel free to reach out.</p>
<p>Best regards,<br/>Lucky Bee Press Team</p>`,
    });

    revalidatePath(`/admin/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// ─── Order Actions ────────────────────────────────────────────

export async function batchUpdateOrderStatus(
  orderIds: string[],
  status: string,
) {
  try {
    await requireAdmin();

    if (orderIds.length === 0) {
      return { success: false, error: "No orders selected" };
    }

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status" };
    }

    const matchedOrders = await db
      .select()
      .from(orders)
      .where(inArray(orders.id, orderIds));

    if (matchedOrders.length === 0) {
      return { success: false, error: "No orders found" };
    }

    const updateData: Record<string, unknown> = {
      status: status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
      updatedAt: new Date(),
    };

    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
    }

    await db
      .update(orders)
      .set(updateData)
      .where(inArray(orders.id, orderIds));

    // Send notification emails for shipped or cancelled
    if (status === "shipped" || status === "cancelled") {
      for (const order of matchedOrders) {
        const [customer] = await db
          .select({ email: users.email, ownerName: users.ownerName })
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);

        if (!customer) continue;

        if (status === "shipped") {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: customer.email,
            subject: `Order ${order.orderNumber} Has Been Shipped`,
            html: `<p>Hi ${customer.ownerName},</p>
<p>Your order <strong>${order.orderNumber}</strong> has been shipped!</p>
${order.trackingNumber ? `<p>Tracking number: <strong>${order.trackingNumber}</strong></p>` : ""}
<p>Thank you for your business!</p>`,
          });
        } else if (status === "cancelled") {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: customer.email,
            subject: `Order ${order.orderNumber} Has Been Cancelled`,
            html: `<p>Hi ${customer.ownerName},</p>
<p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
<p>If you have questions, please contact us.</p>`,
          });
        }
      }
    }

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update orders",
    };
  }
}

export async function setTrackingNumber(orderId: string, trackingNumber: string) {
  try {
    await requireAdmin();

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return { success: false, error: "Order not found" };

    await db
      .update(orders)
      .set({
        trackingNumber,
        status: "shipped",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const [customer] = await db
      .select({ email: users.email, ownerName: users.ownerName })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);

    if (customer) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customer.email,
        subject: `Order ${order.orderNumber} Has Been Shipped`,
        html: `<p>Hi ${customer.ownerName},</p>
<p>Your order <strong>${order.orderNumber}</strong> has been shipped!</p>
<p>Tracking number: <strong>${trackingNumber}</strong></p>
<p>Thank you for your business!</p>`,
      });
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set tracking number",
    };
  }
}

export async function markDelivered(orderId: string) {
  try {
    await requireAdmin();

    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return { success: false, error: "Order not found" };

    await db
      .update(orders)
      .set({
        status: "delivered",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark delivered",
    };
  }
}

export async function issueRefund(
  orderId: string,
  amount: number,
  reason: string,
) {
  try {
    await requireAdmin();

    if (!reason.trim()) {
      return { success: false, error: "Reason is required" };
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return { success: false, error: "Order not found" };

    // amount is already in cents
    let stripeRefundId: string | null = null;

    if (order.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount,
      });
      stripeRefundId = refund.id;
    } else if (order.stripeInvoiceId) {
      const creditNote = await stripe.creditNotes.create({
        invoice: order.stripeInvoiceId,
        lines: [
          {
            type: "custom_line_item",
            description: `Refund: ${reason}`,
            quantity: 1,
            unit_amount: amount,
          },
        ],
      });
      stripeRefundId = creditNote.id;
    }

    // Save refund record
    await db.insert(refunds).values({
      orderId,
      amount: Math.round(amount),
      reason,
      stripeRefundId,
    });

    // Update order payment status
    const totalRefunded = await db
      .select({ total: sql<number>`COALESCE(SUM(${refunds.amount}), 0)` })
      .from(refunds)
      .where(eq(refunds.orderId, orderId));

    const refundedAmount = totalRefunded[0].total;
    const orderTotal = order.total;

    await db
      .update(orders)
      .set({
        paymentStatus:
          refundedAmount >= orderTotal ? "refunded" : "partially_refunded",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Send email
    const [customer] = await db
      .select({ email: users.email, ownerName: users.ownerName })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);

    if (customer) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customer.email,
        subject: `Refund Issued for Order ${order.orderNumber}`,
        html: `<p>Hi ${customer.ownerName},</p>
<p>A refund of <strong>$${(amount / 100).toFixed(2)}</strong> has been issued for order <strong>${order.orderNumber}</strong>.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>Please allow a few business days for the refund to appear.</p>`,
      });
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to issue refund",
    };
  }
}

export async function cancelOrder(orderId: string, reason: string) {
  try {
    await requireAdmin();

    if (!reason.trim()) {
      return { success: false, error: "Cancel reason is required" };
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return { success: false, error: "Order not found" };

    if (order.status === "cancelled") {
      return { success: false, error: "Order is already cancelled" };
    }

    // Auto-refund or void depending on payment method
    if (order.paymentStatus === "paid") {
      if (order.stripePaymentIntentId) {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          amount: order.total, // already in cents
        });

        await db.insert(refunds).values({
          orderId,
          amount: order.total,
          reason: `Cancelled: ${reason}`,
          stripeRefundId: refund.id,
        });
      }
    } else if (order.stripeInvoiceId && order.paymentStatus === "pending") {
      // Void unpaid invoice
      await stripe.invoices.voidInvoice(order.stripeInvoiceId);
    }

    await db
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus:
          order.paymentStatus === "paid" ? "refunded" : "voided",
        cancelledAt: new Date(),
        cancelReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Send cancellation email
    const [customer] = await db
      .select({ email: users.email, ownerName: users.ownerName })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);

    if (customer) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customer.email,
        subject: `Order ${order.orderNumber} Has Been Cancelled`,
        html: `<p>Hi ${customer.ownerName},</p>
<p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
<p><strong>Reason:</strong> ${reason}</p>
${order.paymentStatus === "paid" ? "<p>A full refund has been issued and will appear in a few business days.</p>" : ""}
<p>If you have questions, please contact us.</p>`,
      });
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
}

// ─── Product Actions ──────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().uuid("Invalid category"),
  wholesalePrice: z.coerce.number().int().min(0, "Invalid price"),
  retailPrice: z.coerce.number().int().min(0, "Invalid price"),
  hasBoxOption: z.coerce.boolean().optional(),
  boxWholesalePrice: z.coerce.number().int().min(0).optional(),
  boxRetailPrice: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  isAvailable: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  seasonalTag: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function createProduct(formData: FormData) {
  try {
    await requireAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = productSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const data = parsed.data;
    const slug = generateSlug(data.name);

    // Parse images from formData
    const imagesJson = formData.get("images");
    const images = imagesJson ? JSON.parse(imagesJson as string) : [];

    const [product] = await db
      .insert(products)
      .values({
        name: data.name,
        slug,
        sku: data.sku || null,
        categoryId: data.categoryId,
        wholesalePrice: data.wholesalePrice,
        retailPrice: data.retailPrice,
        hasBoxOption: data.hasBoxOption ?? false,
        boxWholesalePrice: data.boxWholesalePrice ?? null,
        boxRetailPrice: data.boxRetailPrice ?? null,
        description: data.description || null,
        isAvailable: data.isAvailable ?? true,
        isBestSeller: data.isBestSeller ?? false,
        isNewArrival: data.isNewArrival ?? false,
        isFeatured: data.isFeatured ?? false,
        seasonalTag: data.seasonalTag || null,
        sortOrder: data.sortOrder ?? 0,
        images,
      })
      .returning();

    revalidatePath("/admin/products");
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    await requireAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = productSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const data = parsed.data;
    const slug = generateSlug(data.name);

    const imagesJson = formData.get("images");
    const images = imagesJson ? JSON.parse(imagesJson as string) : undefined;

    const updateData: Record<string, unknown> = {
      name: data.name,
      slug,
      sku: data.sku || null,
      categoryId: data.categoryId,
      wholesalePrice: data.wholesalePrice,
      retailPrice: data.retailPrice,
      hasBoxOption: data.hasBoxOption ?? false,
      boxWholesalePrice: data.boxWholesalePrice ?? null,
      boxRetailPrice: data.boxRetailPrice ?? null,
      description: data.description || null,
      isAvailable: data.isAvailable ?? true,
      isBestSeller: data.isBestSeller ?? false,
      isNewArrival: data.isNewArrival ?? false,
      isFeatured: data.isFeatured ?? false,
      seasonalTag: data.seasonalTag || null,
      sortOrder: data.sortOrder ?? 0,
      updatedAt: new Date(),
    };

    if (images !== undefined) {
      updateData.images = images;
    }

    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    if (!product) return { success: false, error: "Product not found" };

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function toggleAvailability(id: string) {
  try {
    await requireAdmin();

    const [product] = await db
      .select({ isAvailable: products.isAvailable })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) return { success: false, error: "Product not found" };

    await db
      .update(products)
      .set({ isAvailable: !product.isAvailable, updatedAt: new Date() })
      .where(eq(products.id, id));

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle availability",
    };
  }
}

export async function toggleBestSeller(id: string) {
  try {
    await requireAdmin();

    const [product] = await db
      .select({ isBestSeller: products.isBestSeller })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) return { success: false, error: "Product not found" };

    await db
      .update(products)
      .set({ isBestSeller: !product.isBestSeller, updatedAt: new Date() })
      .where(eq(products.id, id));

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle best seller",
    };
  }
}

export async function toggleNewArrival(id: string) {
  try {
    await requireAdmin();

    const [product] = await db
      .select({ isNewArrival: products.isNewArrival })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) return { success: false, error: "Product not found" };

    await db
      .update(products)
      .set({ isNewArrival: !product.isNewArrival, updatedAt: new Date() })
      .where(eq(products.id, id));

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle new arrival",
    };
  }
}

export async function toggleFeatured(id: string) {
  try {
    await requireAdmin();

    const [product] = await db
      .select({ isFeatured: products.isFeatured })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) return { success: false, error: "Product not found" };

    // If enabling featured, check max from platform settings
    if (!product.isFeatured) {
      const [maxSetting] = await db
        .select({ value: platformSettings.value })
        .from(platformSettings)
        .where(eq(platformSettings.key, "max_featured_products"))
        .limit(1);

      const maxFeatured = maxSetting ? parseInt(maxSetting.value, 10) : 12;

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.isFeatured, true));

      if (Number(count) >= maxFeatured) {
        return {
          success: false,
          error: `Maximum of ${maxFeatured} featured products allowed`,
        };
      }
    }

    await db
      .update(products)
      .set({ isFeatured: !product.isFeatured, updatedAt: new Date() })
      .where(eq(products.id, id));

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle featured",
    };
  }
}

export async function saveSortOrder(
  items: { id: string; sortOrder: number }[],
) {
  try {
    await requireAdmin();

    for (const item of items) {
      await db
        .update(products)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(products.id, item.id));
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save sort order",
    };
  }
}

export async function batchProductAction(
  ids: string[],
  action: string,
  categoryId?: string,
) {
  try {
    await requireAdmin();

    if (ids.length === 0) {
      return { success: false, error: "No products selected" };
    }

    switch (action) {
      case "enable": {
        await db
          .update(products)
          .set({ isAvailable: true, updatedAt: new Date() })
          .where(inArray(products.id, ids));
        break;
      }
      case "disable": {
        await db
          .update(products)
          .set({ isAvailable: false, updatedAt: new Date() })
          .where(inArray(products.id, ids));
        break;
      }
      case "change_category": {
        if (!categoryId) {
          return { success: false, error: "Category ID is required" };
        }
        await db
          .update(products)
          .set({ categoryId, updatedAt: new Date() })
          .where(inArray(products.id, ids));
        break;
      }
      case "delete": {
        await db.delete(products).where(inArray(products.id, ids));
        break;
      }
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to perform batch action",
    };
  }
}

// ─── Category Actions ─────────────────────────────────────────

export async function createCategory(
  name: string,
  supportsBoxSet: boolean = false,
) {
  try {
    await requireAdmin();

    if (!name.trim()) {
      return { success: false, error: "Name is required" };
    }

    const slug = generateSlug(name);

    // Check uniqueness
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) {
      return { success: false, error: "A category with this name already exists" };
    }

    // Get max sort order
    const [maxSort] = await db
      .select({ max: sql<number>`COALESCE(MAX(${categories.sortOrder}), 0)` })
      .from(categories);

    const [category] = await db
      .insert(categories)
      .values({
        name: name.trim(),
        slug,
        supportsBoxSet,
        sortOrder: Number(maxSort.max) + 1,
      })
      .returning();

    revalidatePath("/admin/categories");
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export async function renameCategory(id: string, name: string) {
  try {
    await requireAdmin();

    if (!name.trim()) {
      return { success: false, error: "Name is required" };
    }

    const slug = generateSlug(name);

    // Check uniqueness (exclude self)
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.slug, slug), sql`${categories.id} != ${id}`))
      .limit(1);

    if (existing) {
      return { success: false, error: "A category with this name already exists" };
    }

    const [category] = await db
      .update(categories)
      .set({ name: name.trim(), slug, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    if (!category) return { success: false, error: "Category not found" };

    revalidatePath("/admin/categories");
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to rename category",
    };
  }
}

export async function reorderCategories(
  items: { id: string; sortOrder: number }[],
) {
  try {
    await requireAdmin();

    for (const item of items) {
      await db
        .update(categories)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(categories.id, item.id));
    }

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder categories",
    };
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireAdmin();

    // Check for products in this category
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, id));

    if (Number(count) > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${count} product(s). Reassign products first.`,
      };
    }

    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (!deleted) return { success: false, error: "Category not found" };

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

export async function reassignProducts(
  fromCategoryId: string,
  toCategoryId: string,
) {
  try {
    await requireAdmin();

    // Verify target category exists
    const [target] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, toCategoryId))
      .limit(1);

    if (!target) {
      return { success: false, error: "Target category not found" };
    }

    await db
      .update(products)
      .set({ categoryId: toCategoryId, updatedAt: new Date() })
      .where(eq(products.categoryId, fromCategoryId));

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reassign products",
    };
  }
}

export async function toggleBoxSetSupport(categoryId: string) {
  try {
    await requireAdmin();

    const [category] = await db
      .select({ supportsBoxSet: categories.supportsBoxSet })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) return { success: false, error: "Category not found" };

    await db
      .update(categories)
      .set({ supportsBoxSet: !category.supportsBoxSet, updatedAt: new Date() })
      .where(eq(categories.id, categoryId));

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle box set support",
    };
  }
}

// ─── Invoice Actions ──────────────────────────────────────────

export async function markInvoicePaid(invoiceId: string) {
  try {
    await requireAdmin();

    await stripe.invoices.pay(invoiceId, { paid_out_of_band: true });

    // Update order payment status if linked
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.stripeInvoiceId, invoiceId))
      .limit(1);

    if (order) {
      await db
        .update(orders)
        .set({ paymentStatus: "paid", updatedAt: new Date() })
        .where(eq(orders.id, order.id));

      revalidatePath(`/admin/orders/${order.id}`);
    }

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark invoice paid",
    };
  }
}

export async function voidInvoice(invoiceId: string) {
  try {
    await requireAdmin();

    await stripe.invoices.voidInvoice(invoiceId);

    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.stripeInvoiceId, invoiceId))
      .limit(1);

    if (order) {
      await db
        .update(orders)
        .set({ paymentStatus: "voided", updatedAt: new Date() })
        .where(eq(orders.id, order.id));

      revalidatePath(`/admin/orders/${order.id}`);
    }

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to void invoice",
    };
  }
}

export async function creditInvoice(invoiceId: string, amount: number) {
  try {
    await requireAdmin();

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    // amount is already in cents
    await stripe.creditNotes.create({
      invoice: invoiceId,
      lines: [
        {
          type: "custom_line_item",
          description: "Refund",
          quantity: 1,
          unit_amount: amount,
        },
      ],
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to credit invoice",
    };
  }
}

// ─── Settings Actions ─────────────────────────────────────────

const settingsSchema = z.record(z.string(), z.string());

export async function updateSettings(settings: Record<string, string>) {
  try {
    await requireAdmin();

    const parsed = settingsSchema.safeParse(settings);
    if (!parsed.success) {
      return { success: false, error: "Invalid settings format" };
    }

    const entries = Object.entries(parsed.data);

    for (const [key, value] of entries) {
      await db
        .insert(platformSettings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: { value, updatedAt: new Date() },
        });
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

// ─── Manual Order Action ──────────────────────────────────────

export async function createManualOrder(data: {
  userId: string;
  items: {
    productId: string;
    quantity: number;
    lineItemType: "single" | "box_set";
  }[];
  paymentMethod: string;
  notes?: string;
  overrideReason?: string;
}) {
  try {
    await requireAdmin();

    if (data.items.length === 0) {
      return { success: false, error: "Order must have at least one item" };
    }

    // Fetch customer
    const [customer] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);

    if (!customer) return { success: false, error: "Customer not found" };

    // Fetch all products
    const productIds = data.items.map((i) => i.productId);
    const productList = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(productList.map((p) => [p.id, p]));

    // Build order items and calculate subtotal (all amounts in cents)
    const itemsToInsert: {
      productId: string;
      productName: string;
      lineItemType: "single" | "box_set";
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    let subtotal = 0;

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return { success: false, error: `Product not found: ${item.productId}` };
      }

      const isBox = item.lineItemType === "box_set";
      const unitPrice = isBox
        ? (product.boxWholesalePrice ?? product.wholesalePrice)
        : product.wholesalePrice;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      itemsToInsert.push({
        productId: item.productId,
        productName: isBox ? `${product.name} (Box of 6)` : product.name,
        lineItemType: item.lineItemType,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });
    }

    // Apply customer discount (amounts in cents)
    const discountPercent = parseFloat(customer.customDiscountPercent ?? "0");
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    const taxAmount = 0;
    const shippingCost = 1500; // $15.00 flat shipping in cents
    const total = subtotal - discountAmount + taxAmount + shippingCost;

    const orderNumber = generateOrderNumber();

    // Fetch default shipping address
    const [address] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, data.userId))
      .limit(1);

    const shippingSnapshot = address
      ? {
          recipientName: address.recipientName,
          street1: address.street1,
          street2: address.street2 || undefined,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
        }
      : {
          recipientName: customer.ownerName ?? customer.businessName ?? "Unknown",
          street1: "TBD",
          city: "TBD",
          state: "TBD",
          zip: "00000",
          country: "US",
        };

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: data.userId,
        status: "confirmed",
        paymentMethod: data.paymentMethod as "credit_card" | "net_30",
        paymentStatus: "pending",
        subtotal,
        shippingCost,
        taxAmount,
        discountPercent: discountPercent.toFixed(2),
        discountAmount,
        total,
        notes: data.notes || null,
        shippingAddressSnapshot: shippingSnapshot,
        isAdminCreated: true,
        adminOverrideReason: data.overrideReason || null,
      })
      .returning();

    // Insert order items
    await db.insert(orderItems).values(
      itemsToInsert.map((item) => ({
        orderId: order.id,
        ...item,
      })),
    );

    // Send confirmation email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: `Order Confirmation - ${orderNumber}`,
      html: `<p>Hi ${customer.ownerName},</p>
<p>An order has been placed on your behalf by Lucky Bee Press.</p>
<p><strong>Order Number:</strong> ${orderNumber}</p>
<p><strong>Total:</strong> $${(total / 100).toFixed(2)}</p>
<p>You can view the details in your account.</p>
<p>Thank you!</p>`,
    });

    // Send admin notification
    await sendNewOrderNotification(
      { id: order.id, orderNumber, total, paymentMethod: data.paymentMethod, items: itemsToInsert },
      { businessName: customer.businessName, ownerName: customer.ownerName },
    );

    revalidatePath("/admin/orders");
    return { success: true, data: order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
}
