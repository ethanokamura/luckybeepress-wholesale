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
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";

vi.mock("@/lib/queries/catalog", () => ({
  getPlatformSettings: vi.fn().mockResolvedValue({
    returning_customer_minimum: "100",
    new_customer_minimum: "150",
    shipping_rate: "15",
  }),
}));

vi.mock("@/lib/emails/templates", () => ({
  orderConfirmationEmail: vi.fn().mockReturnValue("<html>mock</html>"),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    refunds: { create: vi.fn().mockResolvedValue({ id: "re_mock" }) },
    invoices: {
      pay: vi.fn().mockResolvedValue({ id: "inv_mock" }),
      voidInvoice: vi.fn().mockResolvedValue({ id: "inv_mock" }),
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: "inv_new" }),
      finalizeInvoice: vi.fn().mockResolvedValue({}),
      sendInvoice: vi.fn().mockResolvedValue({}),
    },
    creditNotes: { create: vi.fn().mockResolvedValue({ id: "cn_mock" }) },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "cs_mock",
          url: "https://checkout.stripe.com/test",
          payment_intent: "pi_new",
        }),
      },
    },
    customers: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: "cus_mock" }),
    },
    invoiceItems: { create: vi.fn().mockResolvedValue({ id: "ii_mock" }) },
  },
}));

// ─── SUT ────────────────────────────────────────────────────────

import {
  placeOrderAction,
  cancelOrderAction,
  reorderAction,
} from "@/lib/actions/orders";

// ─── Fixtures ───────────────────────────────────────────────────

const mockUser = {
  id: "user-id",
  email: "user@example.com",
  status: "active",
  isNet30Eligible: false,
  customDiscountPercent: null,
  isTaxExempt: false,
  ownerName: "Jane",
  businessName: "Jane's Shop",
};

const mockCartItem = {
  id: "ci-1",
  productId: "prod-1",
  lineItemType: "single",
  quantity: 6,
  productName: "Test Product",
  wholesalePrice: 300,
  boxWholesalePrice: 1100,
  isAvailable: true,
};

const mockAddress = {
  id: "addr-1",
  userId: "user-id",
  recipientName: "Jane",
  street1: "123 Main St",
  street2: null,
  city: "Portland",
  state: "OR",
  zip: "97201",
  country: "US",
  isDefault: true,
};

const mockOrder = {
  id: "order-1",
  orderNumber: "LBP-ABC-1234",
  userId: "user-id",
  status: "pending",
  paymentMethod: "credit_card",
  paymentStatus: "paid",
  subtotal: 1800,
  shippingCost: 1500,
  taxAmount: 0,
  discountPercent: "0.00",
  discountAmount: 0,
  total: 3300,
  notes: null,
  stripePaymentIntentId: "pi_test",
  stripeInvoiceId: null,
};

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("paymentMethod", "credit_card");
  fd.set("notes", "");
  fd.set("addressId", "addr-1");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

// ─── Reset ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// placeOrderAction
// ═══════════════════════════════════════════════════════════════

describe("placeOrderAction", () => {
  it("returns error when unauthenticated", async () => {
    const result = await placeOrderAction(undefined, makeFormData());
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when account is inactive", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, status: "pending" } as never);
    const result = await placeOrderAction(undefined, makeFormData());
    expect(result).toEqual({ error: "Account not approved" });
  });

  it("returns error when net30 requested without eligibility", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    const result = await placeOrderAction(undefined, makeFormData({ paymentMethod: "net_30" }));
    expect(result).toEqual({ error: "You are not eligible for Net 30 payment" });
  });

  it("returns error when cart is empty", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([]); // empty cart
    const result = await placeOrderAction(undefined, makeFormData());
    expect(result).toEqual({ error: "Cart is empty" });
  });

  it("returns error when items are unavailable", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ ...mockCartItem, isAvailable: false, productName: "Sold Out Item" }]);
    const result = await placeOrderAction(undefined, makeFormData());
    expect(result).toEqual({ error: "Remove unavailable items: Sold Out Item" });
  });

  it("returns error when below minimum", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    // Cart with low subtotal: 1 * 300 = 300 cents ($3), well below $150 minimum
    mockSelect([{ ...mockCartItem, quantity: 1, wholesalePrice: 300 }]);
    // refundedOrderIds sub-select (sync, not awaited)
    mockSelect([]);
    // completed orders count
    mockSelect([{ count: 0 }]);
    const result = await placeOrderAction(undefined, makeFormData());
    expect(result).toEqual({ error: "Order does not meet minimum" });
  });

  it("returns error when no address on file", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    // Cart with enough subtotal: 6 * 3000 = 18000 cents ($180) > $150 minimum
    mockSelect([{ ...mockCartItem, quantity: 6, wholesalePrice: 3000 }]);
    // refundedOrderIds sub-select (sync, not awaited)
    mockSelect([]);
    // completed orders count
    mockSelect([{ count: 0 }]);
    // address lookups — selected address, default address, first address — all empty
    mockSelect([]);
    mockSelect([]);
    mockSelect([]);
    const result = await placeOrderAction(undefined, makeFormData());
    expect(result).toEqual({ error: "No shipping address on file" });
  });

  it("credit card: creates order, stripe session, and redirects", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    // Cart items
    mockSelect([{ ...mockCartItem, quantity: 6, wholesalePrice: 3000 }]);
    // refundedOrderIds sub-select (sync, not awaited)
    mockSelect([]);
    // Completed orders count
    mockSelect([{ count: 0 }]);
    // Address lookup (selected)
    mockSelect([mockAddress]);
    // Insert order returning
    mockInsert([{ id: "order-new", orderNumber: "LBP-TEST-0001", total: 19500, subtotal: 18000, shippingCost: 1500, discountAmount: 0 }]);
    // Insert order items
    mockInsert();
    // Update order with payment intent
    mockUpdate();

    await expect(placeOrderAction(undefined, makeFormData())).rejects.toThrow("REDIRECT:");
    expect(vi.mocked(stripe.checkout.sessions.create)).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
    // Cart clearing now happens in Stripe webhook, not during checkout
  });

  it("net30: creates order, stripe invoice, and redirects", async () => {
    const net30User = { ...mockUser, isNet30Eligible: true };
    vi.mocked(getCurrentUser).mockResolvedValueOnce(net30User as never);
    // Cart items
    mockSelect([{ ...mockCartItem, quantity: 6, wholesalePrice: 3000 }]);
    // refundedOrderIds sub-select (sync, not awaited)
    mockSelect([]);
    // Completed orders count
    mockSelect([{ count: 0 }]);
    // Address lookup (selected)
    mockSelect([mockAddress]);
    // Insert order returning
    mockInsert([{ id: "order-new", orderNumber: "LBP-TEST-0002", total: 19500, subtotal: 18000, shippingCost: 1500, discountAmount: 0 }]);
    // Insert order items
    mockInsert();
    // Delete cart items
    mockDelete();
    // Update order with invoice id
    mockUpdate();

    await expect(
      placeOrderAction(undefined, makeFormData({ paymentMethod: "net_30" }))
    ).rejects.toThrow("REDIRECT:");
    expect(vi.mocked(stripe.invoices.create)).toHaveBeenCalled();
    expect(vi.mocked(stripe.invoices.finalizeInvoice)).toHaveBeenCalled();
    expect(vi.mocked(stripe.invoices.sendInvoice)).toHaveBeenCalled();
    expect(vi.mocked(stripe.customers.create)).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// cancelOrderAction
// ═══════════════════════════════════════════════════════════════

describe("cancelOrderAction", () => {
  it("returns error when unauthenticated", async () => {
    const result = await cancelOrderAction("order-1");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when order not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([]); // no order
    const result = await cancelOrderAction("nonexistent");
    expect(result).toEqual({ error: "Order not found" });
  });

  it("returns error when order is shipped", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ ...mockOrder, status: "shipped" }]);
    const result = await cancelOrderAction("order-1");
    expect(result).toEqual({ error: "Order cannot be cancelled at this stage" });
  });

  it("cancels pending order with credit card refund", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([mockOrder]); // order lookup (pending + paid + has paymentIntentId)
    mockUpdate(); // update order status to cancelled
    // refund flow
    mockInsert(); // insert refund record

    const result = await cancelOrderAction("order-1");

    expect(result).toEqual({ success: true });
    expect(vi.mocked(stripe.refunds.create)).toHaveBeenCalledWith({
      payment_intent: "pi_test",
    });
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/orders/order-1");
    expect(revalidatePath).toHaveBeenCalledWith("/orders");
  });

  it("cancels order with invoice void", async () => {
    const invoiceOrder = {
      ...mockOrder,
      paymentStatus: "pending",
      stripePaymentIntentId: null,
      stripeInvoiceId: "inv_test",
    };
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([invoiceOrder]); // order lookup
    mockUpdate(); // update order status to cancelled

    const result = await cancelOrderAction("order-1");

    expect(result).toEqual({ success: true });
    expect(vi.mocked(stripe.invoices.voidInvoice)).toHaveBeenCalledWith("inv_test");
    expect(revalidatePath).toHaveBeenCalledWith("/orders/order-1");
    expect(revalidatePath).toHaveBeenCalledWith("/orders");
  });
});

// ═══════════════════════════════════════════════════════════════
// reorderAction
// ═══════════════════════════════════════════════════════════════

describe("reorderAction", () => {
  it("returns error when unauthenticated", async () => {
    const result = await reorderAction("order-1");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when order not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([]); // no order
    const result = await reorderAction("nonexistent");
    expect(result).toEqual({ error: "Order not found" });
  });

  it("adds items to cart and redirects", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    // Order lookup
    mockSelect([{ id: "order-1" }]);
    // Order items lookup
    mockSelect([
      { productId: "prod-1", lineItemType: "single", quantity: 6, isAvailable: true },
    ]);
    // Existing cart item check (none found)
    mockSelect([]);
    // Insert new cart item
    mockInsert();

    await expect(reorderAction("order-1")).rejects.toThrow("REDIRECT:/cart");
    expect(mockDb.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
  });
});
