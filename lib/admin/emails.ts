import { resend, FROM_EMAIL } from "@/lib/email";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getAdminNotificationEmail(): Promise<string | null> {
  const result = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, "admin_notification_email"))
    .limit(1);

  const email = result[0]?.value;
  return email && email.trim().length > 0 ? email.trim() : null;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface OrderForNotification {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  items?: { length: number } | unknown[];
}

interface CustomerForNotification {
  businessName: string | null;
  ownerName: string | null;
}

export async function sendNewOrderNotification(
  order: OrderForNotification,
  customer: CustomerForNotification,
) {
  const adminEmail = await getAdminNotificationEmail();
  if (!adminEmail) return;

  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://wholesale.luckybeepress.com";
  const orderLink = `${baseUrl}/admin/orders/${order.id}`;

  const paymentLabel =
    order.paymentMethod === "net_30" ? "Net 30" : "Credit Card";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `New Order: ${order.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Wholesale Order</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Business Name</td>
            <td style="padding: 8px 0; font-weight: 600;">${customer.businessName || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Owner Name</td>
            <td style="padding: 8px 0; font-weight: 600;">${customer.ownerName || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Order Total</td>
            <td style="padding: 8px 0; font-weight: 600;">${formatCents(order.total)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Payment Method</td>
            <td style="padding: 8px 0; font-weight: 600;">${paymentLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Items</td>
            <td style="padding: 8px 0; font-weight: 600;">${itemCount} line item${itemCount !== 1 ? "s" : ""}</td>
          </tr>
        </table>
        <a href="${orderLink}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Order
        </a>
      </div>
    `,
  });
}

interface AtRiskCustomer {
  businessName: string | null;
  ownerName: string | null;
  email: string;
  lastOrderDate: Date | string | null;
  daysSinceLastOrder: number;
}

export async function sendLowActivityDigest(atRiskCustomers: AtRiskCustomer[]) {
  if (atRiskCustomers.length === 0) return;

  const adminEmail = await getAdminNotificationEmail();
  if (!adminEmail) return;

  const rows = atRiskCustomers
    .map(
      (c) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${c.businessName || "N/A"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${c.ownerName || "N/A"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${c.email}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("en-US") : "Never"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.daysSinceLastOrder}</td>
      </tr>
    `,
    )
    .join("");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `Weekly Low-Activity Digest - ${atRiskCustomers.length} At-Risk Customers`,
    html: `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Weekly Low-Activity Digest</h2>
        <p style="color: #666;">${atRiskCustomers.length} customer${atRiskCustomers.length !== 1 ? "s have" : " has"} not placed an order recently.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Business</th>
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Owner</th>
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Email</th>
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Last Order</th>
              <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Days Inactive</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `,
  });
}
