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

function mockUpdate(data: unknown = []) {
  mockDb.update.mockReturnValueOnce(chain(data) as ReturnType<typeof mockDb.update>);
}

function mockInsert(data: unknown = []) {
  mockDb.insert.mockReturnValueOnce(chain(data) as ReturnType<typeof mockDb.insert>);
}

function mockDelete(data: unknown = []) {
  mockDb.delete.mockReturnValueOnce(chain(data) as ReturnType<typeof mockDb.delete>);
}

// ─── Mock imports ───────────────────────────────────────────────

import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/queries/catalog", () => ({
  getPlatformSettings: vi.fn().mockResolvedValue({
    returning_customer_minimum: "100",
    new_customer_minimum: "150",
    shipping_rate: "15",
  }),
}));

// ─── SUT ────────────────────────────────────────────────────────

import {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getCartWithItems,
} from "@/lib/actions/cart";

// ─── Fixtures ───────────────────────────────────────────────────

const mockUser = {
  id: "user-1",
  email: "shop@example.com",
  ownerName: "Jane Doe",
  businessName: "Jane's Shop",
  isAdmin: false,
  customDiscountPercent: "10.00",
  isTaxExempt: false,
  isNet30Eligible: true,
};

const mockProduct = {
  isAvailable: true,
  hasBoxOption: true,
  minimumOrderQuantity: 6,
};

// ─── Reset ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// addToCart
// ═══════════════════════════════════════════════════════════════

describe("addToCart", () => {
  it("returns error when unauthenticated", async () => {
    const result = await addToCart("prod-1", "single", 6);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when product not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([]); // no product found
    const result = await addToCart("nonexistent", "single", 6);
    expect(result).toEqual({ error: "Product is not available" });
  });

  it("returns error when product is unavailable", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ ...mockProduct, isAvailable: false }]);
    const result = await addToCart("prod-1", "single", 6);
    expect(result).toEqual({ error: "Product is not available" });
  });

  it("returns error when box_set requested but product has no box option", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ ...mockProduct, hasBoxOption: false }]);
    const result = await addToCart("prod-1", "box_set", 4);
    expect(result).toEqual({ error: "This product is not available as a box set" });
  });

  it("returns error when quantity is not a valid increment", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([mockProduct]); // product lookup
    const result = await addToCart("prod-1", "single", 5); // not multiple of 6
    expect(result).toEqual({ error: "Quantity must be a multiple of 6" });
  });

  it("inserts new item when no existing cart item", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([mockProduct]);  // product lookup
    mockSelect([]);             // no existing cart item
    mockInsert();               // insert new cart item
    const result = await addToCart("prod-1", "single", 6);

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
  });

  it("updates quantity when item already in cart", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([mockProduct]);                          // product lookup
    mockSelect([{ id: "ci-1", quantity: 6 }]);          // existing cart item
    mockUpdate();                                        // update quantity
    const result = await addToCart("prod-1", "single", 12);

    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
  });
});

// ═══════════════════════════════════════════════════════════════
// updateCartQuantity
// ═══════════════════════════════════════════════════════════════

describe("updateCartQuantity", () => {
  it("returns error when unauthenticated", async () => {
    const result = await updateCartQuantity("ci-1", 6);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when cart item not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([]); // no cart item
    const result = await updateCartQuantity("nonexistent", 6);
    expect(result).toEqual({ error: "Cart item not found" });
  });

  it("returns error when quantity is not a valid increment", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ id: "ci-1", lineItemType: "single", productId: "prod-1" }]); // cart item
    mockSelect([{ minimumOrderQuantity: 6 }]); // product lookup
    const result = await updateCartQuantity("ci-1", 5); // not multiple of 6
    expect(result).toEqual({ error: "Quantity must be a multiple of 6" });
  });

  it("deletes item when quantity is zero", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ id: "ci-1", lineItemType: "single", productId: "prod-1" }]); // cart item
    mockSelect([{ minimumOrderQuantity: 6 }]); // product lookup
    mockDelete(); // delete cart item
    const result = await updateCartQuantity("ci-1", 0);

    expect(result).toEqual({ success: true });
    expect(mockDb.delete).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
  });

  it("updates quantity for valid amount", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ id: "ci-1", lineItemType: "single", productId: "prod-1" }]); // cart item
    mockSelect([{ minimumOrderQuantity: 6 }]); // product lookup
    mockUpdate(); // update cart item
    const result = await updateCartQuantity("ci-1", 12);

    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
  });
});

// ═══════════════════════════════════════════════════════════════
// removeFromCart
// ═══════════════════════════════════════════════════════════════

describe("removeFromCart", () => {
  it("returns error when unauthenticated", async () => {
    const result = await removeFromCart("ci-1");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("deletes item and revalidates", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockDelete(); // delete cart item
    const result = await removeFromCart("ci-1");

    expect(result).toEqual({ success: true });
    expect(mockDb.delete).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
  });
});

// ═══════════════════════════════════════════════════════════════
// getCartWithItems
// ═══════════════════════════════════════════════════════════════

describe("getCartWithItems", () => {
  it("returns null when unauthenticated", async () => {
    const result = await getCartWithItems();
    expect(result).toBeNull();
  });

  it("returns cart with calculated totals", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);

    // cart items join query
    mockSelect([
      {
        id: "ci-1",
        productId: "prod-1",
        lineItemType: "single",
        quantity: 6,
        productName: "Test Product",
        productSlug: "test-product",
        productImages: [],
        wholesalePrice: 300,
        boxWholesalePrice: 1100,
        isAvailable: true,
        minimumOrderQuantity: 6,
      },
    ]);

    // refundedOrderIds sub-query (db.select called synchronously)
    mockSelect([]);
    // completed orders count (for isReturning check)
    mockSelect([{ count: 0 }]);

    const result = await getCartWithItems();

    expect(result).not.toBeNull();
    // 6 singles * 300 = 1800 subtotal
    expect(result!.subtotal).toBe(1800);
    // 10% discount on 1800 = 180
    expect(result!.discountPercent).toBe(10);
    expect(result!.discountAmount).toBe(180);
    // shipping = 15 * 100 = 1500
    expect(result!.shippingCents).toBe(1500);
    // total = 1800 - 180 + 1500 = 3120
    expect(result!.total).toBe(3120);
    // new customer minimum = 150 * 100 = 15000
    expect(result!.minimumCents).toBe(15000);
    expect(result!.isReturning).toBe(false);
    expect(result!.isBelowMinimum).toBe(true);
    expect(result!.isNet30Eligible).toBe(true);
    expect(result!.isTaxExempt).toBe(false);
  });
});
