import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, users, platformSettings } from "@/lib/db/schema";
import { eq, and, sql, ne } from "drizzle-orm";
import { resend, FROM_EMAIL } from "@/lib/email";
import { reorderWindowEmail } from "@/lib/emails/templates";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get reorder delay from settings
  const [delaySetting] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, "reorder_email_delay_days"));

  const delayDays = parseInt(delaySetting?.value ?? "35");

  // Target date: customers whose last order was exactly delayDays ago (±1 day window)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - delayDays);
  const windowStart = new Date(targetDate);
  windowStart.setDate(windowStart.getDate() - 1);

  // Find customers with last order in the window
  const customersToNotify = await db
    .select({
      userId: orders.userId,
      lastOrderId: sql<string>`(array_agg(${orders.id} ORDER BY ${orders.createdAt} DESC))[1]`.as("last_order_id"),
      lastOrderDate: sql<Date>`max(${orders.createdAt})`.as("last_order_date"),
      email: users.email,
      ownerName: users.ownerName,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(
      and(
        eq(users.status, "active"),
        ne(orders.status, "cancelled")
      )
    )
    .groupBy(orders.userId, users.email, users.ownerName)
    .having(
      and(
        sql`max(${orders.createdAt}) >= ${windowStart}`,
        sql`max(${orders.createdAt}) <= ${targetDate}`
      )
    );

  let sent = 0;
  for (const customer of customersToNotify) {
    // Get top items from last order
    const topItems = await db
      .select({ productName: orderItems.productName })
      .from(orderItems)
      .where(eq(orderItems.orderId, customer.lastOrderId))
      .limit(5);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wholesale.luckybeepress.com";

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: "Time to restock? Your reorder window is open",
      html: reorderWindowEmail({
        name: customer.ownerName ?? "there",
        lastOrderDate: new Date(customer.lastOrderDate).toLocaleDateString(),
        reorderUrl: `${appUrl}/orders`,
        topItems: topItems.map((i) => i.productName),
      }),
    });

    sent++;
  }

  return NextResponse.json({ sent, checked: customersToNotify.length });
}
