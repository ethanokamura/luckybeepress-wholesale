import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "../setup";

// ─── Helpers ────────────────────────────────────────────────────

function chain(data: unknown = []) {
  const c: Record<string, unknown> = {};
  const methods = [
    "select", "from", "where", "leftJoin", "innerJoin", "orderBy",
    "limit", "offset", "groupBy", "having", "insert", "values",
    "update", "set", "delete", "returning", "onConflictDoUpdate",
    "onConflictDoNothing", "as",
  ];
  for (const m of methods) c[m] = vi.fn().mockReturnValue(c);
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve);
  return c;
}

function mockSelect(data: unknown) {
  mockDb.select.mockReturnValueOnce(chain(data) as ReturnType<typeof mockDb.select>);
}

// ─── Mock @neondatabase/serverless ──────────────────────────────

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => vi.fn()),
}));

// ─── Reset ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// getProducts (catalog.ts)
// ═══════════════════════════════════════════════════════════════

describe("getProducts", () => {
  it("returns all products with no filters", async () => {
    const productList = [
      {
        id: "p1",
        name: "Sticker A",
        slug: "sticker-a",
        sku: "STK-001",
        wholesalePrice: 500,
        retailPrice: 1000,
        hasBoxOption: false,
        boxWholesalePrice: null,
        boxRetailPrice: null,
        isAvailable: true,
        isBestSeller: false,
        isNewArrival: true,
        isFeatured: false,
        seasonalTag: null,
        orderByDate: null,
        images: [],
        categoryId: "c1",
        categoryName: "Stickers",
      },
    ];
    mockSelect(productList);

    const { getProducts } = await import("@/lib/queries/catalog");
    const result = await getProducts();
    expect(result).toEqual(productList);
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("filters by categoryId", async () => {
    const filtered = [
      {
        id: "p2",
        name: "Card B",
        slug: "card-b",
        sku: "CRD-001",
        wholesalePrice: 300,
        retailPrice: 600,
        hasBoxOption: true,
        boxWholesalePrice: 1500,
        boxRetailPrice: 3000,
        isAvailable: true,
        isBestSeller: true,
        isNewArrival: false,
        isFeatured: false,
        seasonalTag: null,
        orderByDate: null,
        images: [],
        categoryId: "c2",
        categoryName: "Cards",
      },
    ];
    mockSelect(filtered);

    const { getProducts } = await import("@/lib/queries/catalog");
    const result = await getProducts({ categoryId: "c2" });
    expect(result).toEqual(filtered);
  });

  it("returns empty array when no products", async () => {
    mockSelect([]);

    const { getProducts } = await import("@/lib/queries/catalog");
    const result = await getProducts();
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// getProductBySlug (catalog.ts)
// ═══════════════════════════════════════════════════════════════

describe("getProductBySlug", () => {
  it("returns product when found", async () => {
    const product = {
      id: "p1",
      name: "Sticker A",
      slug: "sticker-a",
      sku: "STK-001",
      description: "A great sticker",
      shortDescription: "Sticker",
      tags: ["sticker"],
      wholesalePrice: 500,
      retailPrice: 1000,
      hasBoxOption: false,
      boxWholesalePrice: null,
      boxRetailPrice: null,
      minimumOrderQuantity: 6,
      isAvailable: true,
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: false,
      seasonalTag: null,
      orderByDate: null,
      images: [],
      weightOz: 2,
      categoryId: "c1",
      categoryName: "Stickers",
    };
    mockSelect([product]);

    const { getProductBySlug } = await import("@/lib/queries/catalog");
    const result = await getProductBySlug("sticker-a");
    expect(result).toEqual(product);
  });

  it("returns null when not found", async () => {
    mockSelect([undefined]);

    const { getProductBySlug } = await import("@/lib/queries/catalog");
    const result = await getProductBySlug("nonexistent");
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// getCategories (catalog.ts)
// ═══════════════════════════════════════════════════════════════

describe("getCategories", () => {
  it("returns categories sorted by sortOrder", async () => {
    const cats = [
      { id: "c1", name: "Stickers", slug: "stickers" },
      { id: "c2", name: "Cards", slug: "cards" },
    ];
    mockSelect(cats);

    const { getCategories } = await import("@/lib/queries/catalog");
    const result = await getCategories();
    expect(result).toEqual(cats);
    expect(result).toHaveLength(2);
  });

  it("returns empty array", async () => {
    mockSelect([]);

    const { getCategories } = await import("@/lib/queries/catalog");
    const result = await getCategories();
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// getPlatformSettings (catalog.ts)
// ═══════════════════════════════════════════════════════════════

describe("getPlatformSettings", () => {
  it("returns key-value map", async () => {
    mockSelect([
      { key: "min_order", value: "100" },
      { key: "tax_rate", value: "0.08" },
    ]);

    const { getPlatformSettings } = await import("@/lib/queries/catalog");
    const result = await getPlatformSettings();
    expect(result).toEqual({
      min_order: "100",
      tax_rate: "0.08",
    });
  });

  it("returns empty object when no settings", async () => {
    mockSelect([]);

    const { getPlatformSettings } = await import("@/lib/queries/catalog");
    const result = await getPlatformSettings();
    expect(result).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════
// formatCents (catalog.ts)
// ═══════════════════════════════════════════════════════════════

describe("formatCents", () => {
  it("formats correctly", async () => {
    const { formatCents } = await import("@/lib/queries/catalog");
    expect(formatCents(1000)).toBe("$10.00");
    expect(formatCents(50)).toBe("$0.50");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(1)).toBe("$0.01");
    expect(formatCents(9999)).toBe("$99.99");
  });
});

// ═══════════════════════════════════════════════════════════════
// getCustomerOrders (orders.ts)
// ═══════════════════════════════════════════════════════════════

describe("getCustomerOrders", () => {
  it("returns orders for user", async () => {
    const userOrders = [
      {
        id: "o1",
        orderNumber: "ORD-001",
        status: "delivered",
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        total: "99.99",
        createdAt: new Date("2025-05-01"),
      },
      {
        id: "o2",
        orderNumber: "ORD-002",
        status: "pending",
        paymentMethod: "net_30",
        paymentStatus: "unpaid",
        total: "50.00",
        createdAt: new Date("2025-06-01"),
      },
    ];
    mockSelect(userOrders);

    const { getCustomerOrders } = await import("@/lib/queries/orders");
    const result = await getCustomerOrders("user-1");
    expect(result).toEqual(userOrders);
    expect(result).toHaveLength(2);
  });

  it("returns empty array", async () => {
    mockSelect([]);

    const { getCustomerOrders } = await import("@/lib/queries/orders");
    const result = await getCustomerOrders("user-no-orders");
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// getOrderDetail (orders.ts)
// ═══════════════════════════════════════════════════════════════

describe("getOrderDetail", () => {
  it("returns order with items and refunds", async () => {
    const order = {
      id: "o1",
      userId: "user-1",
      orderNumber: "ORD-001",
      status: "delivered",
      paymentMethod: "credit_card",
      paymentStatus: "paid",
      subtotal: "90.00",
      shippingCost: "5.00",
      taxAmount: "4.99",
      total: "99.99",
      createdAt: new Date("2025-05-01"),
    };
    const items = [
      {
        id: "oi1",
        productId: "p1",
        productName: "Widget",
        lineItemType: "product",
        quantity: 6,
        unitPrice: "15.00",
        lineTotal: "90.00",
        productSlug: "widget",
      },
    ];
    const orderRefunds = [
      {
        id: "r1",
        amount: "10.00",
        reason: "Damaged",
        createdAt: new Date("2025-05-10"),
      },
    ];

    mockSelect([order]);          // order lookup
    mockSelect(items);             // order items
    mockSelect(orderRefunds);      // refunds

    const { getOrderDetail } = await import("@/lib/queries/orders");
    const result = await getOrderDetail("o1", "user-1");
    expect(result).toEqual({ ...order, items, refunds: orderRefunds });
  });

  it("returns null when order not found", async () => {
    mockSelect([undefined]);

    const { getOrderDetail } = await import("@/lib/queries/orders");
    const result = await getOrderDetail("nonexistent", "user-1");
    expect(result).toBeNull();
  });

  it("returns null when userId doesn't match", async () => {
    const order = {
      id: "o1",
      userId: "user-1",
      orderNumber: "ORD-001",
      status: "delivered",
      paymentMethod: "credit_card",
      paymentStatus: "paid",
      total: "99.99",
      createdAt: new Date("2025-05-01"),
    };
    mockSelect([order]);

    const { getOrderDetail } = await import("@/lib/queries/orders");
    const result = await getOrderDetail("o1", "wrong-user");
    expect(result).toBeNull();
  });
});
