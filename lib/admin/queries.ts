import { cache } from "react";
import { db } from "@/lib/db";
import {
  users,
  orders,
  orderItems,
  products,
  categories,
  addresses,
  refunds,
  platformSettings,
} from "@/lib/db/schema";
import {
  eq,
  and,
  or,
  gte,
  lte,
  ilike,
  sql,
  count,
  sum,
  desc,
  asc,
  ne,
  notInArray,
} from "drizzle-orm";

const PAGE_SIZE = 20;

// ─── 1. Pending Applications Count ──────────────────────────

export const getPendingApplicationsCount = cache(async () => {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.status, "pending"));
  return result.count;
});

// ─── 2. Pending Applications List (summary) ────────────────

export const getPendingApplicationsList = cache(async () => {
  return db
    .select({
      id: users.id,
      businessName: users.businessName,
      ownerName: users.ownerName,
      email: users.email,
      businessType: users.businessType,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.status, "pending"))
    .orderBy(asc(users.createdAt));
});

// ─── 3. New Orders Since Last Login ─────────────────────────

export const getNewOrdersSinceLastLogin = cache(
  async (lastLoginAt: Date | null) => {
    if (!lastLoginAt) {
      const [result] = await db.select({ count: count() }).from(orders);
      return result.count;
    }
    const [result] = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, lastLoginAt));
    return result.count;
  },
);

// ─── 4. At-Risk Customers Count ─────────────────────────────

export const getAtRiskCustomersCount = cache(
  async (thresholdDays: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - thresholdDays);

    const lastOrderSubquery = db
      .select({
        userId: orders.userId,
        lastOrderDate: sql<Date>`max(${orders.createdAt})`.as(
          "last_order_date",
        ),
      })
      .from(orders)
      .groupBy(orders.userId)
      .as("last_orders");

    const [result] = await db
      .select({ count: count() })
      .from(users)
      .innerJoin(
        lastOrderSubquery,
        eq(users.id, lastOrderSubquery.userId),
      )
      .where(
        and(
          eq(users.status, "active"),
          lte(lastOrderSubquery.lastOrderDate, cutoff),
        ),
      );
    return result.count;
  },
);

// ─── 5. 30-Day Summary ──────────────────────────────────────

export const get30DaySummary = cache(async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [[orderStats], [accountStats]] = await Promise.all([
    db
      .select({
        ordersCount: count(),
        revenue: sum(orders.total),
      })
      .from(orders)
      .where(gte(orders.createdAt, thirtyDaysAgo)),
    db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.status, "active"),
          gte(users.approvedAt, thirtyDaysAgo),
        ),
      ),
  ]);

  return {
    ordersCount: orderStats.ordersCount,
    revenue: orderStats.revenue ?? "0",
    newAccountsApproved: accountStats.count,
  };
});

// ─── 6. Pending Applications (full list, oldest first) ──────

export const getPendingApplications = cache(async () => {
  return db
    .select({
      id: users.id,
      email: users.email,
      businessName: users.businessName,
      ownerName: users.ownerName,
      phone: users.phone,
      businessType: users.businessType,
      ein: users.ein,
      resaleCertificateUrl: users.resaleCertificateUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.status, "pending"))
    .orderBy(asc(users.createdAt));
});

// ─── 7. Application Detail ──────────────────────────────────

export const getApplicationDetail = cache(async (id: string) => {
  const [result] = await db
    .select({
      id: users.id,
      email: users.email,
      businessName: users.businessName,
      ownerName: users.ownerName,
      phone: users.phone,
      businessType: users.businessType,
      ein: users.ein,
      resaleCertificateUrl: users.resaleCertificateUrl,
      status: users.status,
      isTaxExempt: users.isTaxExempt,
      isNet30Eligible: users.isNet30Eligible,
      customDiscountPercent: users.customDiscountPercent,
      internalNotes: users.internalNotes,
      lastLoginAt: users.lastLoginAt,
      approvedAt: users.approvedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id));
  return result ?? null;
});

// ─── 8. Customer List (searchable, filterable, paginated) ───

export const getCustomerList = cache(
  async (params: {
    search?: string;
    status?: string;
    page?: number;
  }) => {
    const { search, status, page = 1 } = params;
    const offset = (page - 1) * PAGE_SIZE;
    const conditions = [];

    if (status) {
      conditions.push(
        eq(
          users.status,
          status as "pending" | "active" | "rejected" | "suspended",
        ),
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.businessName, `%${search}%`),
          ilike(users.ownerName, `%${search}%`),
          ilike(users.email, `%${search}%`),
        )!,
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const data = await db
      .select({
        id: users.id,
        email: users.email,
        businessName: users.businessName,
        ownerName: users.ownerName,
        phone: users.phone,
        businessType: users.businessType,
        status: users.status,
        isNet30Eligible: users.isNet30Eligible,
        customDiscountPercent: users.customDiscountPercent,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return { data, total: totalResult.count };
  },
);

// ─── 9. Customer Detail ─────────────────────────────────────

export const getCustomerDetail = cache(async (id: string) => {
  const [customer] = await db
    .select({
      id: users.id,
      email: users.email,
      businessName: users.businessName,
      ownerName: users.ownerName,
      phone: users.phone,
      businessType: users.businessType,
      ein: users.ein,
      resaleCertificateUrl: users.resaleCertificateUrl,
      status: users.status,
      isTaxExempt: users.isTaxExempt,
      isAdmin: users.isAdmin,
      isNet30Eligible: users.isNet30Eligible,
      customDiscountPercent: users.customDiscountPercent,
      internalNotes: users.internalNotes,
      lastLoginAt: users.lastLoginAt,
      approvedAt: users.approvedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id));

  if (!customer) return null;

  const [customerAddresses, orderHistory, [lifetimeValue]] = await Promise.all([
    db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, id))
      .orderBy(desc(addresses.isDefault), asc(addresses.createdAt)),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, id))
      .orderBy(desc(orders.createdAt)),
    db
      .select({
        totalSpent: sum(orders.total),
        orderCount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, id),
          ne(orders.status, "cancelled"),
        ),
      ),
  ]);

  return {
    ...customer,
    addresses: customerAddresses,
    orderHistory,
    lifetimeValue: {
      totalSpent: lifetimeValue.totalSpent ?? "0",
      orderCount: lifetimeValue.orderCount,
    },
  };
});

// ─── 10. Is Returning Customer ──────────────────────────────

export const isReturningCustomer = cache(async (customerId: string) => {
  const refundedOrderIds = db
    .select({ orderId: refunds.orderId })
    .from(refunds);

  const [result] = await db
    .select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.userId, customerId),
        eq(orders.status, "delivered"),
        notInArray(orders.id, refundedOrderIds),
      ),
    );

  return result.count > 0;
});

// ─── 11. Admin Orders (filterable) ──────────────────────────

export const getAdminOrders = cache(
  async (params: {
    status?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
  }) => {
    const { status, paymentMethod, dateFrom, dateTo, search, page = 1 } =
      params;
    const offset = (page - 1) * PAGE_SIZE;
    const conditions = [];

    if (status) {
      conditions.push(
        eq(
          orders.status,
          status as
            | "pending"
            | "confirmed"
            | "shipped"
            | "delivered"
            | "cancelled",
        ),
      );
    }

    if (paymentMethod) {
      conditions.push(
        eq(
          orders.paymentMethod,
          paymentMethod as "credit_card" | "net_30",
        ),
      );
    }

    if (dateFrom) {
      conditions.push(gte(orders.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(orders.createdAt, new Date(dateTo)));
    }

    if (search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(users.businessName, `%${search}%`),
          ilike(users.ownerName, `%${search}%`),
        )!,
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(whereClause);

    const data = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        isAdminCreated: orders.isAdminCreated,
        createdAt: orders.createdAt,
        customerBusinessName: users.businessName,
        customerOwnerName: users.ownerName,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return { data, total: totalResult.count };
  },
);

// ─── 12. Admin Order Detail ─────────────────────────────────

export const getAdminOrderDetail = cache(async (id: string) => {
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      subtotal: orders.subtotal,
      shippingCost: orders.shippingCost,
      taxAmount: orders.taxAmount,
      discountPercent: orders.discountPercent,
      discountAmount: orders.discountAmount,
      total: orders.total,
      notes: orders.notes,
      trackingNumber: orders.trackingNumber,
      shippingAddressSnapshot: orders.shippingAddressSnapshot,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      stripeInvoiceId: orders.stripeInvoiceId,
      isAdminCreated: orders.isAdminCreated,
      adminOverrideReason: orders.adminOverrideReason,
      cancelledAt: orders.cancelledAt,
      cancelReason: orders.cancelReason,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userId: orders.userId,
      customerEmail: users.email,
      customerBusinessName: users.businessName,
      customerOwnerName: users.ownerName,
      customerPhone: users.phone,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id));

  if (!order) return null;

  const [items, orderRefunds] = await Promise.all([
    db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: orderItems.productName,
        lineItemType: orderItems.lineItemType,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        lineTotal: orderItems.lineTotal,
        images: products.images,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id)),
    db
      .select({
        id: refunds.id,
        amount: refunds.amount,
        reason: refunds.reason,
        stripeRefundId: refunds.stripeRefundId,
        createdAt: refunds.createdAt,
      })
      .from(refunds)
      .where(eq(refunds.orderId, id))
      .orderBy(desc(refunds.createdAt)),
  ]);

  return {
    ...order,
    items,
    refunds: orderRefunds,
  };
});

// ─── 13. Approved Customers for Dropdown ────────────────────

export const getApprovedCustomersForDropdown = cache(async () => {
  return db
    .select({
      id: users.id,
      businessName: users.businessName,
      customDiscountPercent: users.customDiscountPercent,
      isNet30Eligible: users.isNet30Eligible,
    })
    .from(users)
    .where(eq(users.status, "active"))
    .orderBy(asc(users.businessName));
});

// ─── 14. Admin Products ─────────────────────────────────────

export const getAdminProducts = cache(async () => {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      wholesalePrice: products.wholesalePrice,
      retailPrice: products.retailPrice,
      hasBoxOption: products.hasBoxOption,
      boxWholesalePrice: products.boxWholesalePrice,
      boxRetailPrice: products.boxRetailPrice,
      description: products.description,
      isAvailable: products.isAvailable,
      isBestSeller: products.isBestSeller,
      isNewArrival: products.isNewArrival,
      isFeatured: products.isFeatured,
      featuredOrder: products.featuredOrder,
      seasonalTag: products.seasonalTag,
      orderByDate: products.orderByDate,
      sortOrder: products.sortOrder,
      images: products.images,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(categories.sortOrder), asc(products.sortOrder));
});

// ─── 14b. Product Detail ────────────────────────────────────

export const getProductDetail = cache(async (id: string) => {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));
  return product ?? null;
});

// ─── 15. Categories with Product Counts ─────────────────────

export const getCategories = cache(async () => {
  const productCountSubquery = db
    .select({
      categoryId: products.categoryId,
      productCount: count().as("product_count"),
    })
    .from(products)
    .groupBy(products.categoryId)
    .as("product_counts");

  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      supportsBoxSet: categories.supportsBoxSet,
      sortOrder: categories.sortOrder,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productCount: sql<number>`coalesce(${productCountSubquery.productCount}, 0)`.mapWith(
        Number,
      ),
    })
    .from(categories)
    .leftJoin(
      productCountSubquery,
      eq(categories.id, productCountSubquery.categoryId),
    )
    .orderBy(asc(categories.sortOrder));
});

// ─── 16. Platform Settings ──────────────────────────────────

export const getPlatformSettings = cache(async () => {
  return db.select().from(platformSettings).orderBy(asc(platformSettings.key));
});

// ─── 17. Best Sellers ───────────────────────────────────────

export const getBestSellers = cache(async (days: number) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      totalUnits: sum(orderItems.quantity).mapWith(Number),
      totalRevenue: sum(orderItems.lineTotal),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        gte(orders.createdAt, cutoff),
        ne(orders.status, "cancelled"),
      ),
    )
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sum(orderItems.quantity)));
});

// ─── 18. Category Performance ───────────────────────────────

export const getCategoryPerformance = cache(async (days: number) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return db
    .select({
      categoryId: products.categoryId,
      categoryName: categories.name,
      totalRevenue: sum(orderItems.lineTotal),
      totalUnits: sum(orderItems.quantity).mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        gte(orders.createdAt, cutoff),
        ne(orders.status, "cancelled"),
      ),
    )
    .groupBy(products.categoryId, categories.name)
    .orderBy(desc(sum(orderItems.lineTotal)));
});

// ─── 19. Customer Lifetime Value ────────────────────────────

export const getCustomerLifetimeValue = cache(async () => {
  return db
    .select({
      userId: orders.userId,
      businessName: users.businessName,
      ownerName: users.ownerName,
      email: users.email,
      totalSpent: sum(orders.total),
      orderCount: count(),
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(ne(orders.status, "cancelled"))
    .groupBy(
      orders.userId,
      users.businessName,
      users.ownerName,
      users.email,
    )
    .orderBy(desc(sum(orders.total)));
});

// ─── 20. Seasonal Trends ────────────────────────────────────

export const getSeasonalTrends = cache(async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  return db
    .select({
      month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`.as("month"),
      categoryName: categories.name,
      orderCount: count(),
      totalUnits: sum(orderItems.quantity).mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        gte(orders.createdAt, twelveMonthsAgo),
        ne(orders.status, "cancelled"),
      ),
    )
    .groupBy(
      sql`to_char(${orders.createdAt}, 'YYYY-MM')`,
      categories.name,
    )
    .orderBy(
      asc(sql`to_char(${orders.createdAt}, 'YYYY-MM')`),
      asc(categories.name),
    );
});

// ─── 21. At-Risk Customers (full list) ──────────────────────

export const getAtRiskCustomers = cache(async (thresholdDays: number) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);

  const lastOrderSubquery = db
    .select({
      userId: orders.userId,
      lastOrderDate: sql<Date>`max(${orders.createdAt})`.as(
        "last_order_date",
      ),
      orderCount: count().as("order_count"),
      totalSpent: sum(orders.total).as("total_spent"),
    })
    .from(orders)
    .where(ne(orders.status, "cancelled"))
    .groupBy(orders.userId)
    .as("last_orders");

  return db
    .select({
      id: users.id,
      businessName: users.businessName,
      ownerName: users.ownerName,
      email: users.email,
      lastOrderDate: lastOrderSubquery.lastOrderDate,
      orderCount: lastOrderSubquery.orderCount,
      totalSpent: lastOrderSubquery.totalSpent,
    })
    .from(users)
    .innerJoin(
      lastOrderSubquery,
      eq(users.id, lastOrderSubquery.userId),
    )
    .where(
      and(
        eq(users.status, "active"),
        lte(lastOrderSubquery.lastOrderDate, cutoff),
      ),
    )
    .orderBy(asc(lastOrderSubquery.lastOrderDate));
});

// ─── 22. Revenue Forecast ───────────────────────────────────

export const getRevenueForecast = cache(async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [returningCustomerStats, monthlyRevenue, [activeCustomers]] =
    await Promise.all([
      db
        .select({
          userId: orders.userId,
          avgOrderValue:
            sql<string>`avg(${orders.total}::numeric)`.as("avg_order_value"),
          orderCount: count().as("order_count"),
          firstOrder: sql<Date>`min(${orders.createdAt})`.as("first_order"),
          lastOrder: sql<Date>`max(${orders.createdAt})`.as("last_order"),
        })
        .from(orders)
        .where(ne(orders.status, "cancelled"))
        .groupBy(orders.userId)
        .having(sql`count(*) > 1`),
      db
        .select({
          month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`.as(
            "month",
          ),
          revenue: sum(orders.total),
          orderCount: count(),
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, twelveMonthsAgo),
            ne(orders.status, "cancelled"),
          ),
        )
        .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
        .orderBy(asc(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)),
      db
        .select({ count: count() })
        .from(users)
        .where(eq(users.status, "active")),
    ]);

  return {
    returningCustomerStats,
    monthlyRevenue,
    activeCustomerCount: activeCustomers.count,
  };
});

// ─── 23. Seasonal Planner ───────────────────────────────────

export const getSeasonalPlanner = cache(async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Historical category peaks by month
  const historicalPeaks = await db
    .select({
      month: sql<string>`to_char(${orders.createdAt}, 'MM')`.as("month"),
      categoryName: categories.name,
      categoryId: products.categoryId,
      totalRevenue: sum(orderItems.lineTotal),
      totalUnits: sum(orderItems.quantity).mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        gte(orders.createdAt, twelveMonthsAgo),
        ne(orders.status, "cancelled"),
      ),
    )
    .groupBy(
      sql`to_char(${orders.createdAt}, 'MM')`,
      categories.name,
      products.categoryId,
    )
    .orderBy(
      asc(sql`to_char(${orders.createdAt}, 'MM')`),
      desc(sum(orderItems.lineTotal)),
    );

  // Current availability counts per category
  const availabilityCounts = await db
    .select({
      categoryId: products.categoryId,
      categoryName: categories.name,
      availableCount: count(),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isAvailable, true))
    .groupBy(products.categoryId, categories.name);

  return {
    historicalPeaks,
    availabilityCounts,
  };
});
