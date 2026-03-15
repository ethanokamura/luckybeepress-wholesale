import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, orders, platformSettings } from "@/lib/db/schema";
import { eq, and, ne, sql, lte, asc } from "drizzle-orm";
import { sendLowActivityDigest } from "@/lib/admin/emails";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read at-risk threshold from platform settings (default 90 days)
    const thresholdResult = await db
      .select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, "at_risk_threshold_days"))
      .limit(1);

    const thresholdDays = thresholdResult[0]?.value
      ? parseInt(thresholdResult[0].value, 10)
      : 90;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

    // Find active customers whose most recent non-cancelled order is older than the threshold
    const atRiskCustomers = await db
      .select({
        businessName: users.businessName,
        ownerName: users.ownerName,
        email: users.email,
        lastOrderDate: sql<string>`MAX(${orders.createdAt})`.as(
          "last_order_date",
        ),
        daysSinceLastOrder:
          sql<number>`EXTRACT(DAY FROM NOW() - MAX(${orders.createdAt}))`.as(
            "days_since_last_order",
          ),
      })
      .from(users)
      .leftJoin(
        orders,
        and(eq(orders.userId, users.id), ne(orders.status, "cancelled")),
      )
      .where(eq(users.status, "active"))
      .groupBy(users.id, users.businessName, users.ownerName, users.email)
      .having(
        lte(sql`MAX(${orders.createdAt})`, sql`${cutoffDate.toISOString()}`),
      )
      .orderBy(asc(sql`MAX(${orders.createdAt})`));

    if (atRiskCustomers.length > 0) {
      await sendLowActivityDigest(
        atRiskCustomers.map((c) => ({
          businessName: c.businessName,
          ownerName: c.ownerName,
          email: c.email,
          lastOrderDate: c.lastOrderDate,
          daysSinceLastOrder: Math.round(c.daysSinceLastOrder),
        })),
      );
    }

    return NextResponse.json({
      success: true,
      atRiskCount: atRiskCustomers.length,
    });
  } catch (error) {
    console.error("Low-activity digest cron failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
