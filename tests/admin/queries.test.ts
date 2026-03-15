import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "../setup";

// Helper: creates a chainable mock that resolves to `data` when awaited
function chainable(data: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "from",
    "where",
    "leftJoin",
    "innerJoin",
    "orderBy",
    "limit",
    "offset",
    "groupBy",
    "having",
    "insert",
    "values",
    "update",
    "set",
    "delete",
    "returning",
    "onConflictDoUpdate",
    "onConflictDoNothing",
    "as",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown) => void) =>
    Promise.resolve(data).then(resolve);
  return chain;
}

// Reset all mocks before each test and re-import queries fresh
beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────
// 1. getPendingApplicationsCount
// ─────────────────────────────────────────────────────────────
describe("getPendingApplicationsCount", () => {
  it("returns the count when pending users exist", async () => {
    mockDb.select.mockReturnValueOnce(chainable([{ count: 5 }]));

    const { getPendingApplicationsCount } = await import(
      "@/lib/admin/queries"
    );
    const result = await getPendingApplicationsCount();
    expect(result).toBe(5);
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("returns 0 when no pending users exist", async () => {
    mockDb.select.mockReturnValueOnce(chainable([{ count: 0 }]));

    const { getPendingApplicationsCount } = await import(
      "@/lib/admin/queries"
    );
    const result = await getPendingApplicationsCount();
    expect(result).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. getPendingApplicationsList
// ─────────────────────────────────────────────────────────────
describe("getPendingApplicationsList", () => {
  it("returns list of pending users", async () => {
    const pending = [
      {
        id: "u1",
        businessName: "Acme",
        ownerName: "Alice",
        email: "alice@acme.com",
        businessType: "retail",
        createdAt: new Date("2025-01-01"),
      },
    ];
    mockDb.select.mockReturnValueOnce(chainable(pending));

    const { getPendingApplicationsList } = await import(
      "@/lib/admin/queries"
    );
    const result = await getPendingApplicationsList();
    expect(result).toEqual(pending);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no pending users", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getPendingApplicationsList } = await import(
      "@/lib/admin/queries"
    );
    const result = await getPendingApplicationsList();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. getNewOrdersSinceLastLogin
// ─────────────────────────────────────────────────────────────
describe("getNewOrdersSinceLastLogin", () => {
  it("returns total order count when lastLoginAt is null", async () => {
    mockDb.select.mockReturnValueOnce(chainable([{ count: 42 }]));

    const { getNewOrdersSinceLastLogin } = await import(
      "@/lib/admin/queries"
    );
    const result = await getNewOrdersSinceLastLogin(null);
    expect(result).toBe(42);
  });

  it("returns order count since date when lastLoginAt is provided", async () => {
    mockDb.select.mockReturnValueOnce(chainable([{ count: 7 }]));

    const { getNewOrdersSinceLastLogin } = await import(
      "@/lib/admin/queries"
    );
    const result = await getNewOrdersSinceLastLogin(
      new Date("2025-06-01"),
    );
    expect(result).toBe(7);
  });

  it("returns 0 when no orders match", async () => {
    mockDb.select.mockReturnValueOnce(chainable([{ count: 0 }]));

    const { getNewOrdersSinceLastLogin } = await import(
      "@/lib/admin/queries"
    );
    const result = await getNewOrdersSinceLastLogin(
      new Date("2099-01-01"),
    );
    expect(result).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. getAtRiskCustomersCount
// ─────────────────────────────────────────────────────────────
describe("getAtRiskCustomersCount", () => {
  it("returns count of at-risk customers", async () => {
    // First call: subquery (.as), second call: main query
    mockDb.select
      .mockReturnValueOnce(chainable([]))          // subquery
      .mockReturnValueOnce(chainable([{ count: 3 }])); // main

    const { getAtRiskCustomersCount } = await import(
      "@/lib/admin/queries"
    );
    const result = await getAtRiskCustomersCount(60);
    expect(result).toBe(3);
  });

  it("returns 0 when no at-risk customers", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([{ count: 0 }]));

    const { getAtRiskCustomersCount } = await import(
      "@/lib/admin/queries"
    );
    const result = await getAtRiskCustomersCount(30);
    expect(result).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. get30DaySummary
// ─────────────────────────────────────────────────────────────
describe("get30DaySummary", () => {
  it("returns summary with orders, revenue, and new accounts", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ ordersCount: 15, revenue: "1234.56" }]))
      .mockReturnValueOnce(chainable([{ count: 4 }]));

    const { get30DaySummary } = await import("@/lib/admin/queries");
    const result = await get30DaySummary();
    expect(result).toEqual({
      ordersCount: 15,
      revenue: "1234.56",
      newAccountsApproved: 4,
    });
  });

  it("returns zero revenue when no orders", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ ordersCount: 0, revenue: null }]))
      .mockReturnValueOnce(chainable([{ count: 0 }]));

    const { get30DaySummary } = await import("@/lib/admin/queries");
    const result = await get30DaySummary();
    expect(result).toEqual({
      ordersCount: 0,
      revenue: "0",
      newAccountsApproved: 0,
    });
  });
});

// ─────────────────────────────────────────────────────────────
// 6. getPendingApplications
// ─────────────────────────────────────────────────────────────
describe("getPendingApplications", () => {
  it("returns full pending applications list", async () => {
    const apps = [
      {
        id: "u1",
        email: "a@b.com",
        businessName: "Shop A",
        ownerName: "Owner A",
        phone: "555-0001",
        businessType: "retail",
        ein: "12-3456789",
        resaleCertificateUrl: "https://example.com/cert.pdf",
        createdAt: new Date("2025-01-15"),
      },
    ];
    mockDb.select.mockReturnValueOnce(chainable(apps));

    const { getPendingApplications } = await import("@/lib/admin/queries");
    const result = await getPendingApplications();
    expect(result).toEqual(apps);
  });

  it("returns empty array when no pending applications", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getPendingApplications } = await import("@/lib/admin/queries");
    const result = await getPendingApplications();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 7. getApplicationDetail
// ─────────────────────────────────────────────────────────────
describe("getApplicationDetail", () => {
  it("returns application detail for existing user", async () => {
    const detail = {
      id: "u1",
      email: "a@b.com",
      businessName: "Shop A",
      ownerName: "Owner A",
      phone: "555-0001",
      businessType: "retail",
      ein: "12-3456789",
      resaleCertificateUrl: null,
      status: "pending",
      isTaxExempt: false,
      isNet30Eligible: false,
      customDiscountPercent: null,
      internalNotes: null,
      lastLoginAt: null,
      approvedAt: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };
    mockDb.select.mockReturnValueOnce(chainable([detail]));

    const { getApplicationDetail } = await import("@/lib/admin/queries");
    const result = await getApplicationDetail("u1");
    expect(result).toEqual(detail);
  });

  it("returns null when user not found", async () => {
    mockDb.select.mockReturnValueOnce(chainable([undefined]));

    const { getApplicationDetail } = await import("@/lib/admin/queries");
    const result = await getApplicationDetail("nonexistent");
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// 8. getCustomerList
// ─────────────────────────────────────────────────────────────
describe("getCustomerList", () => {
  const sampleCustomer = {
    id: "u1",
    email: "a@b.com",
    businessName: "Shop",
    ownerName: "Owner",
    phone: "555-0001",
    businessType: "retail",
    status: "active",
    isNet30Eligible: false,
    customDiscountPercent: null,
    lastLoginAt: null,
    createdAt: new Date("2025-01-01"),
  };

  it("returns paginated data with no filters", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 1 }]))
      .mockReturnValueOnce(chainable([sampleCustomer]));

    const { getCustomerList } = await import("@/lib/admin/queries");
    const result = await getCustomerList({});
    expect(result).toEqual({ data: [sampleCustomer], total: 1 });
  });

  it("returns filtered results by status", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 1 }]))
      .mockReturnValueOnce(chainable([sampleCustomer]));

    const { getCustomerList } = await import("@/lib/admin/queries");
    const result = await getCustomerList({ status: "active" });
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it("returns filtered results by search term", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 1 }]))
      .mockReturnValueOnce(chainable([sampleCustomer]));

    const { getCustomerList } = await import("@/lib/admin/queries");
    const result = await getCustomerList({ search: "Shop" });
    expect(result.total).toBe(1);
  });

  it("handles both search and status filters", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 0 }]))
      .mockReturnValueOnce(chainable([]));

    const { getCustomerList } = await import("@/lib/admin/queries");
    const result = await getCustomerList({
      search: "xyz",
      status: "suspended",
    });
    expect(result).toEqual({ data: [], total: 0 });
  });

  it("supports pagination via page parameter", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 50 }]))
      .mockReturnValueOnce(chainable([]));

    const { getCustomerList } = await import("@/lib/admin/queries");
    const result = await getCustomerList({ page: 3 });
    expect(result.total).toBe(50);
    expect(result.data).toEqual([]);
  });

  it("returns empty result set", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 0 }]))
      .mockReturnValueOnce(chainable([]));

    const { getCustomerList } = await import("@/lib/admin/queries");
    const result = await getCustomerList({});
    expect(result).toEqual({ data: [], total: 0 });
  });
});

// ─────────────────────────────────────────────────────────────
// 9. getCustomerDetail
// ─────────────────────────────────────────────────────────────
describe("getCustomerDetail", () => {
  it("returns full customer detail with addresses, orders, and lifetime value", async () => {
    const customer = {
      id: "u1",
      email: "a@b.com",
      businessName: "Shop",
      ownerName: "Owner",
      phone: "555-0001",
      businessType: "retail",
      ein: null,
      resaleCertificateUrl: null,
      status: "active",
      isTaxExempt: false,
      isAdmin: false,
      isNet30Eligible: true,
      customDiscountPercent: 10,
      internalNotes: "VIP",
      lastLoginAt: new Date("2025-06-01"),
      approvedAt: new Date("2025-01-15"),
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-06-01"),
    };
    const addrs = [{ id: "a1", userId: "u1", isDefault: true }];
    const orderHistory = [
      {
        id: "o1",
        orderNumber: "ORD-001",
        status: "delivered",
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        total: "100.00",
        createdAt: new Date("2025-03-01"),
      },
    ];
    const lifetime = { totalSpent: "500.00", orderCount: 5 };

    mockDb.select
      .mockReturnValueOnce(chainable([customer]))   // customer
      .mockReturnValueOnce(chainable(addrs))         // addresses
      .mockReturnValueOnce(chainable(orderHistory))  // orders
      .mockReturnValueOnce(chainable([lifetime]));   // lifetime value

    const { getCustomerDetail } = await import("@/lib/admin/queries");
    const result = await getCustomerDetail("u1");
    expect(result).toEqual({
      ...customer,
      addresses: addrs,
      orderHistory,
      lifetimeValue: { totalSpent: "500.00", orderCount: 5 },
    });
  });

  it("returns null when customer not found", async () => {
    mockDb.select.mockReturnValueOnce(chainable([undefined]));

    const { getCustomerDetail } = await import("@/lib/admin/queries");
    const result = await getCustomerDetail("nonexistent");
    expect(result).toBeNull();
  });

  it("defaults totalSpent to '0' when null", async () => {
    const customer = {
      id: "u2",
      email: "b@c.com",
      businessName: "New Shop",
      ownerName: "New Owner",
      phone: null,
      businessType: "wholesale",
      ein: null,
      resaleCertificateUrl: null,
      status: "active",
      isTaxExempt: false,
      isAdmin: false,
      isNet30Eligible: false,
      customDiscountPercent: null,
      internalNotes: null,
      lastLoginAt: null,
      approvedAt: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    mockDb.select
      .mockReturnValueOnce(chainable([customer]))
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([{ totalSpent: null, orderCount: 0 }]));

    const { getCustomerDetail } = await import("@/lib/admin/queries");
    const result = await getCustomerDetail("u2");
    expect(result!.lifetimeValue.totalSpent).toBe("0");
    expect(result!.lifetimeValue.orderCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 10. isReturningCustomer
// ─────────────────────────────────────────────────────────────
describe("isReturningCustomer", () => {
  it("returns true when customer has delivered non-refunded orders", async () => {
    // First select: subquery for refunded order IDs
    // Second select: main count query
    mockDb.select
      .mockReturnValueOnce(chainable([]))              // refundedOrderIds subquery
      .mockReturnValueOnce(chainable([{ count: 2 }])); // main query

    const { isReturningCustomer } = await import("@/lib/admin/queries");
    const result = await isReturningCustomer("u1");
    expect(result).toBe(true);
  });

  it("returns false when customer has no qualifying orders", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([{ count: 0 }]));

    const { isReturningCustomer } = await import("@/lib/admin/queries");
    const result = await isReturningCustomer("u2");
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 11. getAdminOrders
// ─────────────────────────────────────────────────────────────
describe("getAdminOrders", () => {
  const sampleOrder = {
    id: "o1",
    orderNumber: "ORD-001",
    status: "pending",
    paymentMethod: "credit_card",
    paymentStatus: "pending",
    total: "99.99",
    isAdminCreated: false,
    createdAt: new Date("2025-05-01"),
    customerBusinessName: "Shop A",
    customerOwnerName: "Owner A",
  };

  it("returns paginated orders with no filters", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 1 }]))
      .mockReturnValueOnce(chainable([sampleOrder]));

    const { getAdminOrders } = await import("@/lib/admin/queries");
    const result = await getAdminOrders({});
    expect(result).toEqual({ data: [sampleOrder], total: 1 });
  });

  it("filters by status", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 1 }]))
      .mockReturnValueOnce(chainable([sampleOrder]));

    const { getAdminOrders } = await import("@/lib/admin/queries");
    const result = await getAdminOrders({ status: "pending" });
    expect(result.total).toBe(1);
  });

  it("filters by paymentMethod", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 1 }]))
      .mockReturnValueOnce(chainable([sampleOrder]));

    const { getAdminOrders } = await import("@/lib/admin/queries");
    const result = await getAdminOrders({ paymentMethod: "credit_card" });
    expect(result.total).toBe(1);
  });

  it("filters by date range", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 0 }]))
      .mockReturnValueOnce(chainable([]));

    const { getAdminOrders } = await import("@/lib/admin/queries");
    const result = await getAdminOrders({
      dateFrom: "2025-01-01",
      dateTo: "2025-12-31",
    });
    expect(result).toEqual({ data: [], total: 0 });
  });

  it("filters by search term", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 1 }]))
      .mockReturnValueOnce(chainable([sampleOrder]));

    const { getAdminOrders } = await import("@/lib/admin/queries");
    const result = await getAdminOrders({ search: "ORD-001" });
    expect(result.total).toBe(1);
  });

  it("combines multiple filters", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 0 }]))
      .mockReturnValueOnce(chainable([]));

    const { getAdminOrders } = await import("@/lib/admin/queries");
    const result = await getAdminOrders({
      status: "shipped",
      paymentMethod: "net_30",
      dateFrom: "2025-06-01",
      search: "Bee",
      page: 2,
    });
    expect(result).toEqual({ data: [], total: 0 });
  });

  it("returns empty when no orders exist", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([{ count: 0 }]))
      .mockReturnValueOnce(chainable([]));

    const { getAdminOrders } = await import("@/lib/admin/queries");
    const result = await getAdminOrders({});
    expect(result).toEqual({ data: [], total: 0 });
  });
});

// ─────────────────────────────────────────────────────────────
// 12. getAdminOrderDetail
// ─────────────────────────────────────────────────────────────
describe("getAdminOrderDetail", () => {
  it("returns order with items and refunds", async () => {
    const order = {
      id: "o1",
      orderNumber: "ORD-001",
      status: "delivered",
      paymentMethod: "credit_card",
      paymentStatus: "paid",
      subtotal: "90.00",
      shippingCost: "5.00",
      taxAmount: "4.99",
      discountPercent: 0,
      discountAmount: "0.00",
      total: "99.99",
      notes: null,
      trackingNumber: "TRACK123",
      shippingAddressSnapshot: {},
      stripePaymentIntentId: "pi_123",
      stripeInvoiceId: null,
      isAdminCreated: false,
      adminOverrideReason: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: new Date("2025-05-01"),
      updatedAt: new Date("2025-05-02"),
      userId: "u1",
      customerEmail: "a@b.com",
      customerBusinessName: "Shop",
      customerOwnerName: "Owner",
      customerPhone: "555-0001",
    };
    const items = [
      {
        id: "oi1",
        productId: "p1",
        productName: "Widget",
        lineItemType: "product",
        quantity: 2,
        unitPrice: "45.00",
        lineTotal: "90.00",
      },
    ];
    const orderRefunds = [
      {
        id: "r1",
        amount: "10.00",
        reason: "Damaged",
        stripeRefundId: "re_123",
        createdAt: new Date("2025-05-10"),
      },
    ];

    mockDb.select
      .mockReturnValueOnce(chainable([order]))
      .mockReturnValueOnce(chainable(items))
      .mockReturnValueOnce(chainable(orderRefunds));

    const { getAdminOrderDetail } = await import("@/lib/admin/queries");
    const result = await getAdminOrderDetail("o1");
    expect(result).toEqual({ ...order, items, refunds: orderRefunds });
  });

  it("returns null when order not found", async () => {
    mockDb.select.mockReturnValueOnce(chainable([undefined]));

    const { getAdminOrderDetail } = await import("@/lib/admin/queries");
    const result = await getAdminOrderDetail("nonexistent");
    expect(result).toBeNull();
  });

  it("returns order with empty items and refunds", async () => {
    const order = {
      id: "o2",
      orderNumber: "ORD-002",
      status: "pending",
      paymentMethod: "net_30",
      paymentStatus: "unpaid",
      subtotal: "50.00",
      shippingCost: "0.00",
      taxAmount: "0.00",
      discountPercent: 0,
      discountAmount: "0.00",
      total: "50.00",
      notes: null,
      trackingNumber: null,
      shippingAddressSnapshot: {},
      stripePaymentIntentId: null,
      stripeInvoiceId: null,
      isAdminCreated: true,
      adminOverrideReason: "Test",
      cancelledAt: null,
      cancelReason: null,
      createdAt: new Date("2025-06-01"),
      updatedAt: new Date("2025-06-01"),
      userId: "u1",
      customerEmail: "a@b.com",
      customerBusinessName: "Shop",
      customerOwnerName: "Owner",
      customerPhone: "555-0001",
    };

    mockDb.select
      .mockReturnValueOnce(chainable([order]))
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]));

    const { getAdminOrderDetail } = await import("@/lib/admin/queries");
    const result = await getAdminOrderDetail("o2");
    expect(result).toEqual({ ...order, items: [], refunds: [] });
  });
});

// ─────────────────────────────────────────────────────────────
// 13. getApprovedCustomersForDropdown
// ─────────────────────────────────────────────────────────────
describe("getApprovedCustomersForDropdown", () => {
  it("returns active customers for dropdown", async () => {
    const customers = [
      {
        id: "u1",
        businessName: "Alpha Corp",
        customDiscountPercent: 10,
        isNet30Eligible: true,
      },
      {
        id: "u2",
        businessName: "Beta LLC",
        customDiscountPercent: null,
        isNet30Eligible: false,
      },
    ];
    mockDb.select.mockReturnValueOnce(chainable(customers));

    const { getApprovedCustomersForDropdown } = await import(
      "@/lib/admin/queries"
    );
    const result = await getApprovedCustomersForDropdown();
    expect(result).toEqual(customers);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no active customers", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getApprovedCustomersForDropdown } = await import(
      "@/lib/admin/queries"
    );
    const result = await getApprovedCustomersForDropdown();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 14. getAdminProducts
// ─────────────────────────────────────────────────────────────
describe("getAdminProducts", () => {
  it("returns all products with category name", async () => {
    const products = [
      {
        id: "p1",
        name: "Widget",
        slug: "widget",
        sku: "W-001",
        wholesalePrice: "10.00",
        retailPrice: "20.00",
        hasBoxOption: false,
        boxWholesalePrice: null,
        boxRetailPrice: null,
        description: "A widget",
        isAvailable: true,
        isBestSeller: false,
        isNewArrival: true,
        isFeatured: false,
        featuredOrder: null,
        seasonalTag: null,
        orderByDate: null,
        sortOrder: 1,
        images: [],
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        categoryId: "c1",
        categoryName: "Gadgets",
      },
    ];
    mockDb.select.mockReturnValueOnce(chainable(products));

    const { getAdminProducts } = await import("@/lib/admin/queries");
    const result = await getAdminProducts();
    expect(result).toEqual(products);
    expect(result[0].categoryName).toBe("Gadgets");
  });

  it("returns empty array when no products", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getAdminProducts } = await import("@/lib/admin/queries");
    const result = await getAdminProducts();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 15. getProductDetail
// ─────────────────────────────────────────────────────────────
describe("getProductDetail", () => {
  it("returns product when found", async () => {
    const product = { id: "p1", name: "Widget", slug: "widget" };
    mockDb.select.mockReturnValueOnce(chainable([product]));

    const { getProductDetail } = await import("@/lib/admin/queries");
    const result = await getProductDetail("p1");
    expect(result).toEqual(product);
  });

  it("returns null when product not found", async () => {
    mockDb.select.mockReturnValueOnce(chainable([undefined]));

    const { getProductDetail } = await import("@/lib/admin/queries");
    const result = await getProductDetail("nonexistent");
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// 16. getCategories
// ─────────────────────────────────────────────────────────────
describe("getCategories", () => {
  it("returns categories with product counts", async () => {
    // First select: subquery; second select: main query
    const categoriesData = [
      {
        id: "c1",
        name: "Gadgets",
        slug: "gadgets",
        sortOrder: 1,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        productCount: 5,
      },
    ];
    mockDb.select
      .mockReturnValueOnce(chainable([]))            // subquery
      .mockReturnValueOnce(chainable(categoriesData)); // main

    const { getCategories } = await import("@/lib/admin/queries");
    const result = await getCategories();
    expect(result).toEqual(categoriesData);
  });

  it("returns empty array when no categories", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]));

    const { getCategories } = await import("@/lib/admin/queries");
    const result = await getCategories();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 17. getPlatformSettings
// ─────────────────────────────────────────────────────────────
describe("getPlatformSettings", () => {
  it("returns all settings", async () => {
    const settings = [
      { key: "min_order", value: "100" },
      { key: "tax_rate", value: "0.08" },
    ];
    mockDb.select.mockReturnValueOnce(chainable(settings));

    const { getPlatformSettings } = await import("@/lib/admin/queries");
    const result = await getPlatformSettings();
    expect(result).toEqual(settings);
  });

  it("returns empty array when no settings", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getPlatformSettings } = await import("@/lib/admin/queries");
    const result = await getPlatformSettings();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 18. getBestSellers
// ─────────────────────────────────────────────────────────────
describe("getBestSellers", () => {
  it("returns ranked products by units sold", async () => {
    const bestSellers = [
      {
        productId: "p1",
        productName: "Widget",
        totalUnits: 100,
        totalRevenue: "5000.00",
      },
      {
        productId: "p2",
        productName: "Gadget",
        totalUnits: 50,
        totalRevenue: "2500.00",
      },
    ];
    mockDb.select.mockReturnValueOnce(chainable(bestSellers));

    const { getBestSellers } = await import("@/lib/admin/queries");
    const result = await getBestSellers(30);
    expect(result).toEqual(bestSellers);
    expect(result[0].totalUnits).toBeGreaterThan(result[1].totalUnits);
  });

  it("returns empty array when no sales in period", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getBestSellers } = await import("@/lib/admin/queries");
    const result = await getBestSellers(7);
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 19. getCategoryPerformance
// ─────────────────────────────────────────────────────────────
describe("getCategoryPerformance", () => {
  it("returns revenue by category", async () => {
    const performance = [
      {
        categoryId: "c1",
        categoryName: "Gadgets",
        totalRevenue: "8000.00",
        totalUnits: 200,
      },
    ];
    mockDb.select.mockReturnValueOnce(chainable(performance));

    const { getCategoryPerformance } = await import("@/lib/admin/queries");
    const result = await getCategoryPerformance(90);
    expect(result).toEqual(performance);
  });

  it("returns empty array when no data", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getCategoryPerformance } = await import("@/lib/admin/queries");
    const result = await getCategoryPerformance(30);
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 20. getCustomerLifetimeValue
// ─────────────────────────────────────────────────────────────
describe("getCustomerLifetimeValue", () => {
  it("returns total spend per customer", async () => {
    const data = [
      {
        userId: "u1",
        businessName: "Shop A",
        ownerName: "Owner A",
        email: "a@a.com",
        totalSpent: "10000.00",
        orderCount: 20,
      },
      {
        userId: "u2",
        businessName: "Shop B",
        ownerName: "Owner B",
        email: "b@b.com",
        totalSpent: "5000.00",
        orderCount: 10,
      },
    ];
    mockDb.select.mockReturnValueOnce(chainable(data));

    const { getCustomerLifetimeValue } = await import(
      "@/lib/admin/queries"
    );
    const result = await getCustomerLifetimeValue();
    expect(result).toEqual(data);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no orders", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getCustomerLifetimeValue } = await import(
      "@/lib/admin/queries"
    );
    const result = await getCustomerLifetimeValue();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 21. getSeasonalTrends
// ─────────────────────────────────────────────────────────────
describe("getSeasonalTrends", () => {
  it("returns category volume by month", async () => {
    const trends = [
      {
        month: "2025-01",
        categoryName: "Gadgets",
        orderCount: 10,
        totalUnits: 50,
      },
      {
        month: "2025-02",
        categoryName: "Gadgets",
        orderCount: 15,
        totalUnits: 75,
      },
    ];
    mockDb.select.mockReturnValueOnce(chainable(trends));

    const { getSeasonalTrends } = await import("@/lib/admin/queries");
    const result = await getSeasonalTrends();
    expect(result).toEqual(trends);
  });

  it("returns empty array when no trends data", async () => {
    mockDb.select.mockReturnValueOnce(chainable([]));

    const { getSeasonalTrends } = await import("@/lib/admin/queries");
    const result = await getSeasonalTrends();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 22. getAtRiskCustomers
// ─────────────────────────────────────────────────────────────
describe("getAtRiskCustomers", () => {
  it("returns full list of at-risk customers with last order date", async () => {
    const atRisk = [
      {
        id: "u1",
        businessName: "Old Shop",
        ownerName: "Owner",
        email: "old@shop.com",
        lastOrderDate: new Date("2024-06-01"),
        orderCount: 5,
        totalSpent: "2500.00",
      },
    ];
    mockDb.select
      .mockReturnValueOnce(chainable([]))        // subquery
      .mockReturnValueOnce(chainable(atRisk));   // main

    const { getAtRiskCustomers } = await import("@/lib/admin/queries");
    const result = await getAtRiskCustomers(90);
    expect(result).toEqual(atRisk);
  });

  it("returns empty when no at-risk customers", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]));

    const { getAtRiskCustomers } = await import("@/lib/admin/queries");
    const result = await getAtRiskCustomers(30);
    expect(result).toEqual([]);
  });

  it("works with different threshold days", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]));

    const { getAtRiskCustomers } = await import("@/lib/admin/queries");
    const result = await getAtRiskCustomers(180);
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 23. getRevenueForecast
// ─────────────────────────────────────────────────────────────
describe("getRevenueForecast", () => {
  it("returns forecast with returning customer stats, monthly revenue, and active count", async () => {
    const returningStats = [
      {
        userId: "u1",
        avgOrderValue: "250.00",
        orderCount: 5,
        firstOrder: new Date("2024-01-01"),
        lastOrder: new Date("2025-06-01"),
      },
    ];
    const monthly = [
      { month: "2025-01", revenue: "3000.00", orderCount: 12 },
      { month: "2025-02", revenue: "3500.00", orderCount: 15 },
    ];

    mockDb.select
      .mockReturnValueOnce(chainable(returningStats))        // returningCustomerStats
      .mockReturnValueOnce(chainable(monthly))                // monthlyRevenue
      .mockReturnValueOnce(chainable([{ count: 25 }]));       // activeCustomers

    const { getRevenueForecast } = await import("@/lib/admin/queries");
    const result = await getRevenueForecast();
    expect(result).toEqual({
      returningCustomerStats: returningStats,
      monthlyRevenue: monthly,
      activeCustomerCount: 25,
    });
  });

  it("returns empty stats when no data", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([{ count: 0 }]));

    const { getRevenueForecast } = await import("@/lib/admin/queries");
    const result = await getRevenueForecast();
    expect(result).toEqual({
      returningCustomerStats: [],
      monthlyRevenue: [],
      activeCustomerCount: 0,
    });
  });
});

// ─────────────────────────────────────────────────────────────
// 24. getSeasonalPlanner
// ─────────────────────────────────────────────────────────────
describe("getSeasonalPlanner", () => {
  it("returns historical peaks and availability counts", async () => {
    const peaks = [
      {
        month: "12",
        categoryName: "Holiday",
        categoryId: "c1",
        totalRevenue: "15000.00",
        totalUnits: 300,
      },
    ];
    const availability = [
      { categoryId: "c1", categoryName: "Holiday", availableCount: 20 },
    ];

    mockDb.select
      .mockReturnValueOnce(chainable(peaks))
      .mockReturnValueOnce(chainable(availability));

    const { getSeasonalPlanner } = await import("@/lib/admin/queries");
    const result = await getSeasonalPlanner();
    expect(result).toEqual({
      historicalPeaks: peaks,
      availabilityCounts: availability,
    });
  });

  it("returns empty arrays when no data", async () => {
    mockDb.select
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]));

    const { getSeasonalPlanner } = await import("@/lib/admin/queries");
    const result = await getSeasonalPlanner();
    expect(result).toEqual({
      historicalPeaks: [],
      availabilityCounts: [],
    });
  });
});
