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

import { requireAdmin } from "@/lib/auth";
import { resend } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { sendNewOrderNotification } from "@/lib/admin/emails";

// ─── SUT ────────────────────────────────────────────────────────

import {
  approveApplication,
  rejectApplication,
  toggleNet30,
  toggleTaxExempt,
  setCustomDiscount,
  updateInternalNotes,
  sendReengagementEmail,
  batchUpdateOrderStatus,
  setTrackingNumber,
  markDelivered,
  issueRefund,
  cancelOrder,
  createProduct,
  updateProduct,
  toggleAvailability,
  toggleBestSeller,
  toggleNewArrival,
  toggleFeatured,
  saveSortOrder,
  batchProductAction,
  createCategory,
  renameCategory,
  reorderCategories,
  deleteCategory,
  reassignProducts,
  markInvoicePaid,
  voidInvoice,
  creditInvoice,
  updateSettings,
  createManualOrder,
} from "@/lib/admin/actions";

// ─── Fixtures ───────────────────────────────────────────────────

const mockCustomer = {
  id: "cust-1",
  email: "shop@example.com",
  ownerName: "Jane Doe",
  businessName: "Jane's Shop",
  status: "pending",
  isTaxExempt: false,
  isNet30Eligible: false,
  internalNotes: null,
  customDiscountPercent: "0.00",
};

const mockOrder = {
  id: "order-1",
  orderNumber: "LBP-250101-ABC123",
  userId: "cust-1",
  status: "confirmed",
  paymentStatus: "paid",
  stripePaymentIntentId: "pi_test",
  stripeInvoiceId: null,
  trackingNumber: null,
  total: 5000,
};

const mockProduct = {
  id: "prod-1",
  name: "Test Product",
  slug: "test-product",
  isAvailable: true,
  isBestSeller: false,
  isNewArrival: false,
  isFeatured: false,
  wholesalePrice: 1000,
  retailPrice: 2000,
  categoryId: "cat-1",
};

const mockCategory = {
  id: "cat-1",
  name: "Stickers",
  slug: "stickers",
  sortOrder: 1,
};

// ─── Reset ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// Application Actions
// ═══════════════════════════════════════════════════════════════

describe("approveApplication", () => {
  it("approves a customer, sends email, and revalidates", async () => {
    mockSelect([mockCustomer]); // find customer
    mockUpdate();               // update status
    const result = await approveApplication("cust-1");

    expect(requireAdmin).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockCustomer.email,
        subject: expect.stringContaining("Approved"),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/applications");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/customers");
  });

  it("passes taxExempt and note options through", async () => {
    mockSelect([mockCustomer]);
    mockUpdate();
    const result = await approveApplication("cust-1", { taxExempt: true, note: "VIP" });
    expect(result).toEqual({ success: true });
  });

  it("returns error when customer not found", async () => {
    mockSelect([]);
    const result = await approveApplication("nonexistent");
    expect(result).toEqual({ success: false, error: "Customer not found" });
  });
});

describe("rejectApplication", () => {
  it("rejects a customer, sends email, and revalidates", async () => {
    mockSelect([mockCustomer]);
    mockUpdate();
    const result = await rejectApplication("cust-1", "Too small");

    expect(result).toEqual({ success: true });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockCustomer.email,
        subject: expect.stringContaining("Update on Your Wholesale Application"),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/applications");
  });

  it("returns error when customer not found", async () => {
    mockSelect([]);
    const result = await rejectApplication("nonexistent");
    expect(result).toEqual({ success: false, error: "Customer not found" });
  });
});

// ═══════════════════════════════════════════════════════════════
// Customer Actions
// ═══════════════════════════════════════════════════════════════

describe("toggleNet30", () => {
  it("flips isNet30Eligible and revalidates", async () => {
    mockSelect([{ isNet30Eligible: false }]);
    mockUpdate();
    const result = await toggleNet30("cust-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/customers");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/customers/cust-1");
  });

  it("returns error when customer not found", async () => {
    mockSelect([]);
    const result = await toggleNet30("nonexistent");
    expect(result).toEqual({ success: false, error: "Customer not found" });
  });
});

describe("toggleTaxExempt", () => {
  it("flips isTaxExempt and revalidates", async () => {
    mockSelect([{ isTaxExempt: true }]);
    mockUpdate();
    const result = await toggleTaxExempt("cust-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/customers");
  });

  it("returns error when customer not found", async () => {
    mockSelect([]);
    const result = await toggleTaxExempt("nonexistent");
    expect(result).toEqual({ success: false, error: "Customer not found" });
  });
});

describe("setCustomDiscount", () => {
  it("sets valid discount and revalidates", async () => {
    mockSelect([{ id: "cust-1" }]);
    mockUpdate();
    const result = await setCustomDiscount("cust-1", 15);

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/customers");
  });

  it("rejects negative discount", async () => {
    const result = await setCustomDiscount("cust-1", -5);
    expect(result).toEqual({ success: false, error: "Discount must be between 0 and 100" });
  });

  it("rejects discount over 100", async () => {
    const result = await setCustomDiscount("cust-1", 150);
    expect(result).toEqual({ success: false, error: "Discount must be between 0 and 100" });
  });

  it("returns error when customer not found", async () => {
    mockSelect([]);
    const result = await setCustomDiscount("nonexistent", 10);
    expect(result).toEqual({ success: false, error: "Customer not found" });
  });
});

describe("updateInternalNotes", () => {
  it("saves notes and revalidates", async () => {
    mockSelect([{ id: "cust-1" }]);
    mockUpdate();
    const result = await updateInternalNotes("cust-1", "Important customer");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/customers/cust-1");
  });

  it("returns error when customer not found", async () => {
    mockSelect([]);
    const result = await updateInternalNotes("nonexistent", "notes");
    expect(result).toEqual({ success: false, error: "Customer not found" });
  });
});

describe("sendReengagementEmail", () => {
  it("sends reengagement email and revalidates", async () => {
    mockSelect([{ email: "shop@example.com", ownerName: "Jane", businessName: "Jane's" }]);
    const result = await sendReengagementEmail("cust-1");

    expect(result).toEqual({ success: true });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "shop@example.com",
        subject: expect.stringContaining("We Miss You"),
      }),
    );
  });

  it("returns error when customer not found", async () => {
    mockSelect([]);
    const result = await sendReengagementEmail("nonexistent");
    expect(result).toEqual({ success: false, error: "Customer not found" });
  });
});

// ═══════════════════════════════════════════════════════════════
// Order Actions
// ═══════════════════════════════════════════════════════════════

describe("batchUpdateOrderStatus", () => {
  it("updates orders to confirmed (no emails)", async () => {
    mockSelect([mockOrder]);   // find matching orders
    mockUpdate();              // bulk update
    const result = await batchUpdateOrderStatus(["order-1"], "confirmed");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
    // No emails for non-shipped/cancelled
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it("sends shipped email when status is shipped", async () => {
    mockSelect([mockOrder]);   // find matching orders
    mockUpdate();              // bulk update
    mockSelect([{ email: "shop@example.com", ownerName: "Jane" }]); // customer lookup
    const result = await batchUpdateOrderStatus(["order-1"], "shipped");

    expect(result).toEqual({ success: true });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Shipped") }),
    );
  });

  it("sends cancelled email when status is cancelled", async () => {
    mockSelect([mockOrder]);
    mockUpdate();
    mockSelect([{ email: "shop@example.com", ownerName: "Jane" }]);
    const result = await batchUpdateOrderStatus(["order-1"], "cancelled");

    expect(result).toEqual({ success: true });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Cancelled") }),
    );
  });

  it("returns error for empty order list", async () => {
    const result = await batchUpdateOrderStatus([], "shipped");
    expect(result).toEqual({ success: false, error: "No orders selected" });
  });

  it("returns error for invalid status", async () => {
    const result = await batchUpdateOrderStatus(["order-1"], "invalid");
    expect(result).toEqual({ success: false, error: "Invalid status" });
  });

  it("returns error when no orders found", async () => {
    mockSelect([]); // no matched orders
    const result = await batchUpdateOrderStatus(["nonexistent"], "shipped");
    expect(result).toEqual({ success: false, error: "No orders found" });
  });
});

describe("setTrackingNumber", () => {
  it("sets tracking, marks shipped, sends email", async () => {
    mockSelect([mockOrder]);    // find order
    mockUpdate();               // update order
    mockSelect([{ email: "shop@example.com", ownerName: "Jane" }]); // customer
    const result = await setTrackingNumber("order-1", "TRACK123");

    expect(result).toEqual({ success: true });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Shipped"),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders/order-1");
  });

  it("returns error when order not found", async () => {
    mockSelect([]);
    const result = await setTrackingNumber("nonexistent", "TRACK123");
    expect(result).toEqual({ success: false, error: "Order not found" });
  });
});

describe("markDelivered", () => {
  it("marks order as delivered and revalidates", async () => {
    mockSelect([{ id: "order-1" }]);
    mockUpdate();
    const result = await markDelivered("order-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders/order-1");
  });

  it("returns error when order not found", async () => {
    mockSelect([]);
    const result = await markDelivered("nonexistent");
    expect(result).toEqual({ success: false, error: "Order not found" });
  });
});

describe("issueRefund", () => {
  it("issues Stripe refund via payment intent, saves record, sends email", async () => {
    mockSelect([mockOrder]);                    // find order
    mockInsert();                                // insert refund record
    mockSelect([{ total: 5000 }]);              // sum refunds
    mockUpdate();                                // update order payment status
    mockSelect([{ email: "shop@example.com", ownerName: "Jane" }]); // customer

    const result = await issueRefund("order-1", 2000, "Damaged item");

    expect(result).toEqual({ success: true });
    expect(stripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: "pi_test",
      amount: 2000,
    });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Refund Issued") }),
    );
  });

  it("issues credit note for invoice-based orders", async () => {
    const invoiceOrder = { ...mockOrder, stripePaymentIntentId: null, stripeInvoiceId: "inv_test" };
    mockSelect([invoiceOrder]);
    mockInsert();
    mockSelect([{ total: 5000 }]);
    mockUpdate();
    mockSelect([{ email: "shop@example.com", ownerName: "Jane" }]);

    const result = await issueRefund("order-1", 1000, "Price adjustment");

    expect(result).toEqual({ success: true });
    expect(stripe.creditNotes.create).toHaveBeenCalledWith(
      expect.objectContaining({ invoice: "inv_test" }),
    );
  });

  it("returns error for empty reason", async () => {
    const result = await issueRefund("order-1", 1000, "   ");
    expect(result).toEqual({ success: false, error: "Reason is required" });
  });

  it("returns error for zero/negative amount", async () => {
    const result = await issueRefund("order-1", 0, "reason");
    expect(result).toEqual({ success: false, error: "Amount must be greater than 0" });
  });

  it("returns error when order not found", async () => {
    mockSelect([]);
    const result = await issueRefund("nonexistent", 1000, "reason");
    expect(result).toEqual({ success: false, error: "Order not found" });
  });
});

describe("cancelOrder", () => {
  it("cancels paid order, issues refund, sends email", async () => {
    mockSelect([mockOrder]);          // find order
    mockInsert();                      // insert refund record
    mockUpdate();                      // update order
    mockSelect([{ email: "shop@example.com", ownerName: "Jane" }]); // customer

    const result = await cancelOrder("order-1", "Customer requested");

    expect(result).toEqual({ success: true });
    expect(stripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: "pi_test",
      amount: 5000,
    });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Cancelled") }),
    );
  });

  it("voids invoice for unpaid net-30 order", async () => {
    const unpaidOrder = {
      ...mockOrder,
      stripePaymentIntentId: null,
      stripeInvoiceId: "inv_test",
      paymentStatus: "pending",
    };
    mockSelect([unpaidOrder]);
    mockUpdate();
    mockSelect([{ email: "shop@example.com", ownerName: "Jane" }]);

    const result = await cancelOrder("order-1", "No longer needed");

    expect(result).toEqual({ success: true });
    expect(stripe.invoices.voidInvoice).toHaveBeenCalledWith("inv_test");
  });

  it("returns error for empty reason", async () => {
    const result = await cancelOrder("order-1", "  ");
    expect(result).toEqual({ success: false, error: "Cancel reason is required" });
  });

  it("returns error when order not found", async () => {
    mockSelect([]);
    const result = await cancelOrder("nonexistent", "reason");
    expect(result).toEqual({ success: false, error: "Order not found" });
  });

  it("returns error when order already cancelled", async () => {
    mockSelect([{ ...mockOrder, status: "cancelled" }]);
    const result = await cancelOrder("order-1", "reason");
    expect(result).toEqual({ success: false, error: "Order is already cancelled" });
  });
});

// ═══════════════════════════════════════════════════════════════
// Product Actions
// ═══════════════════════════════════════════════════════════════

function makeProductFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("name", overrides.name ?? "Test Product");
  fd.set("categoryId", overrides.categoryId ?? "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  fd.set("wholesalePrice", overrides.wholesalePrice ?? "1000");
  fd.set("retailPrice", overrides.retailPrice ?? "2000");
  if (overrides.images) fd.set("images", overrides.images);
  return fd;
}

describe("createProduct", () => {
  it("validates and inserts product, revalidates", async () => {
    mockInsert([{ id: "new-prod", name: "Test Product" }]);
    const result = await createProduct(makeProductFormData());

    expect(requireAdmin).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
  });

  it("returns validation error for missing name", async () => {
    const fd = makeProductFormData({ name: "" });
    const result = await createProduct(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Name is required");
  });

  it("returns validation error for invalid categoryId", async () => {
    const fd = makeProductFormData({ categoryId: "not-a-uuid" });
    const result = await createProduct(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid category");
  });
});

describe("updateProduct", () => {
  it("validates, updates, and revalidates", async () => {
    mockUpdate([{ id: "prod-1", name: "Updated" }]);
    const result = await updateProduct("prod-1", makeProductFormData({ name: "Updated" }));

    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products/prod-1");
  });

  it("returns error when product not found (empty returning)", async () => {
    mockUpdate([]);
    const result = await updateProduct("nonexistent", makeProductFormData());

    expect(result).toEqual({ success: false, error: "Product not found" });
  });

  it("returns validation error for missing fields", async () => {
    const fd = makeProductFormData({ name: "" });
    const result = await updateProduct("prod-1", fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Name is required");
  });
});

describe("toggleAvailability", () => {
  it("flips isAvailable and revalidates", async () => {
    mockSelect([{ isAvailable: true }]);
    mockUpdate();
    const result = await toggleAvailability("prod-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
  });

  it("returns error when product not found", async () => {
    mockSelect([]);
    const result = await toggleAvailability("nonexistent");
    expect(result).toEqual({ success: false, error: "Product not found" });
  });
});

describe("toggleBestSeller", () => {
  it("flips isBestSeller and revalidates", async () => {
    mockSelect([{ isBestSeller: false }]);
    mockUpdate();
    const result = await toggleBestSeller("prod-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
  });

  it("returns error when product not found", async () => {
    mockSelect([]);
    const result = await toggleBestSeller("nonexistent");
    expect(result).toEqual({ success: false, error: "Product not found" });
  });
});

describe("toggleNewArrival", () => {
  it("flips isNewArrival and revalidates", async () => {
    mockSelect([{ isNewArrival: true }]);
    mockUpdate();
    const result = await toggleNewArrival("prod-1");

    expect(result).toEqual({ success: true });
  });

  it("returns error when product not found", async () => {
    mockSelect([]);
    const result = await toggleNewArrival("nonexistent");
    expect(result).toEqual({ success: false, error: "Product not found" });
  });
});

describe("toggleFeatured", () => {
  it("enables featured when under max limit", async () => {
    mockSelect([{ isFeatured: false }]);        // product lookup
    mockSelect([{ value: "12" }]);              // max_featured_products setting
    mockSelect([{ count: 5 }]);                 // current featured count
    mockUpdate();                                // update product
    const result = await toggleFeatured("prod-1");

    expect(result).toEqual({ success: true });
  });

  it("disables featured without checking limit", async () => {
    mockSelect([{ isFeatured: true }]);
    mockUpdate();
    const result = await toggleFeatured("prod-1");

    expect(result).toEqual({ success: true });
  });

  it("returns error when at max featured", async () => {
    mockSelect([{ isFeatured: false }]);
    mockSelect([{ value: "3" }]);               // max = 3
    mockSelect([{ count: 3 }]);                 // already 3 featured
    const result = await toggleFeatured("prod-1");

    expect(result).toEqual({ success: false, error: "Maximum of 3 featured products allowed" });
  });

  it("uses default max of 12 when no setting exists", async () => {
    mockSelect([{ isFeatured: false }]);
    mockSelect([]);                             // no setting found
    mockSelect([{ count: 11 }]);                // 11 < 12, should pass
    mockUpdate();
    const result = await toggleFeatured("prod-1");

    expect(result).toEqual({ success: true });
  });

  it("returns error when product not found", async () => {
    mockSelect([]);
    const result = await toggleFeatured("nonexistent");
    expect(result).toEqual({ success: false, error: "Product not found" });
  });
});

describe("saveSortOrder", () => {
  it("updates sort order for each item", async () => {
    mockUpdate(); // item 1
    mockUpdate(); // item 2
    const result = await saveSortOrder([
      { id: "prod-1", sortOrder: 1 },
      { id: "prod-2", sortOrder: 2 },
    ]);

    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
  });
});

describe("batchProductAction", () => {
  it("enables products", async () => {
    mockUpdate();
    const result = await batchProductAction(["prod-1", "prod-2"], "enable");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
  });

  it("disables products", async () => {
    mockUpdate();
    const result = await batchProductAction(["prod-1"], "disable");
    expect(result).toEqual({ success: true });
  });

  it("changes category when categoryId provided", async () => {
    mockUpdate();
    const result = await batchProductAction(["prod-1"], "change_category", "cat-2");
    expect(result).toEqual({ success: true });
  });

  it("returns error for change_category without categoryId", async () => {
    const result = await batchProductAction(["prod-1"], "change_category");
    expect(result).toEqual({ success: false, error: "Category ID is required" });
  });

  it("deletes products", async () => {
    mockDelete();
    const result = await batchProductAction(["prod-1"], "delete");
    expect(result).toEqual({ success: true });
  });

  it("returns error for empty product list", async () => {
    const result = await batchProductAction([], "enable");
    expect(result).toEqual({ success: false, error: "No products selected" });
  });

  it("returns error for unknown action", async () => {
    const result = await batchProductAction(["prod-1"], "explode");
    expect(result).toEqual({ success: false, error: "Unknown action: explode" });
  });
});

// ═══════════════════════════════════════════════════════════════
// Category Actions
// ═══════════════════════════════════════════════════════════════

describe("createCategory", () => {
  it("creates category with unique slug", async () => {
    mockSelect([]);                                    // no existing category
    mockSelect([{ max: 3 }]);                         // max sort order
    mockInsert([{ id: "cat-new", name: "Prints", slug: "prints", sortOrder: 4 }]);

    const result = await createCategory("Prints");

    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it("returns error for duplicate category name", async () => {
    mockSelect([{ id: "cat-1" }]); // existing category found
    const result = await createCategory("Stickers");

    expect(result).toEqual({ success: false, error: "A category with this name already exists" });
  });

  it("returns error for empty name", async () => {
    const result = await createCategory("   ");
    expect(result).toEqual({ success: false, error: "Name is required" });
  });
});

describe("renameCategory", () => {
  it("renames category with unique slug", async () => {
    mockSelect([]);                                                    // no duplicate
    mockUpdate([{ id: "cat-1", name: "New Name", slug: "new-name" }]); // returning

    const result = await renameCategory("cat-1", "New Name");

    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it("returns error for duplicate name", async () => {
    mockSelect([{ id: "cat-2" }]); // another category has this slug
    const result = await renameCategory("cat-1", "Stickers");

    expect(result).toEqual({ success: false, error: "A category with this name already exists" });
  });

  it("returns error when category not found (empty returning)", async () => {
    mockSelect([]);   // no duplicate
    mockUpdate([]);   // empty returning = not found
    const result = await renameCategory("nonexistent", "Whatever");

    expect(result).toEqual({ success: false, error: "Category not found" });
  });

  it("returns error for empty name", async () => {
    const result = await renameCategory("cat-1", "  ");
    expect(result).toEqual({ success: false, error: "Name is required" });
  });
});

describe("reorderCategories", () => {
  it("updates sort order for each item", async () => {
    mockUpdate();
    mockUpdate();
    const result = await reorderCategories([
      { id: "cat-1", sortOrder: 2 },
      { id: "cat-2", sortOrder: 1 },
    ]);

    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
  });
});

describe("deleteCategory", () => {
  it("deletes category with no products", async () => {
    mockSelect([{ count: 0 }]); // product count
    mockDelete([{ id: "cat-1" }]); // delete returning
    const result = await deleteCategory("cat-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it("blocks deletion when products exist", async () => {
    mockSelect([{ count: 5 }]);
    const result = await deleteCategory("cat-1");

    expect(result).toEqual({
      success: false,
      error: "Cannot delete category with 5 product(s). Reassign products first.",
    });
  });

  it("returns error when category not found", async () => {
    mockSelect([{ count: 0 }]);
    mockDelete([]); // empty returning
    const result = await deleteCategory("nonexistent");

    expect(result).toEqual({ success: false, error: "Category not found" });
  });
});

describe("reassignProducts", () => {
  it("moves products to target category", async () => {
    mockSelect([{ id: "cat-2" }]); // target exists
    mockUpdate();
    const result = await reassignProducts("cat-1", "cat-2");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
  });

  it("returns error when target category not found", async () => {
    mockSelect([]);
    const result = await reassignProducts("cat-1", "nonexistent");

    expect(result).toEqual({ success: false, error: "Target category not found" });
  });
});

// ═══════════════════════════════════════════════════════════════
// Invoice Actions
// ═══════════════════════════════════════════════════════════════

describe("markInvoicePaid", () => {
  it("calls Stripe pay and updates linked order", async () => {
    mockSelect([{ id: "order-1" }]); // linked order
    mockUpdate();                     // update order
    const result = await markInvoicePaid("inv_123");

    expect(result).toEqual({ success: true });
    expect(stripe.invoices.pay).toHaveBeenCalledWith("inv_123", { paid_out_of_band: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders/order-1");
  });

  it("works when no linked order exists", async () => {
    mockSelect([]); // no linked order
    const result = await markInvoicePaid("inv_123");

    expect(result).toEqual({ success: true });
    expect(stripe.invoices.pay).toHaveBeenCalled();
  });
});

describe("voidInvoice", () => {
  it("calls Stripe voidInvoice and updates linked order", async () => {
    mockSelect([{ id: "order-1" }]);
    mockUpdate();
    const result = await voidInvoice("inv_123");

    expect(result).toEqual({ success: true });
    expect(stripe.invoices.voidInvoice).toHaveBeenCalledWith("inv_123");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
  });

  it("works when no linked order exists", async () => {
    mockSelect([]);
    const result = await voidInvoice("inv_123");

    expect(result).toEqual({ success: true });
  });
});

describe("creditInvoice", () => {
  it("creates Stripe credit note", async () => {
    const result = await creditInvoice("inv_123", 1500);

    expect(result).toEqual({ success: true });
    expect(stripe.creditNotes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice: "inv_123",
        lines: expect.arrayContaining([
          expect.objectContaining({ unit_amount: 1500 }),
        ]),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
  });

  it("returns error for zero amount", async () => {
    const result = await creditInvoice("inv_123", 0);
    expect(result).toEqual({ success: false, error: "Amount must be greater than 0" });
  });

  it("returns error for negative amount", async () => {
    const result = await creditInvoice("inv_123", -100);
    expect(result).toEqual({ success: false, error: "Amount must be greater than 0" });
  });
});

// ═══════════════════════════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════════════════════════

describe("updateSettings", () => {
  it("upserts each setting and revalidates", async () => {
    mockInsert(); // setting 1
    mockInsert(); // setting 2
    const result = await updateSettings({
      min_order_amount: "5000",
      max_featured_products: "12",
    });

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("handles empty settings object", async () => {
    const result = await updateSettings({});
    expect(result).toEqual({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════
// Manual Order
// ═══════════════════════════════════════════════════════════════

describe("createManualOrder", () => {
  it("creates order with items, sends emails, notifies admin", async () => {
    mockSelect([mockCustomer]);                      // customer lookup
    mockSelect([mockProduct]);                       // product lookup
    mockSelect([{                                    // address lookup
      recipientName: "Jane", street1: "123 Main",
      street2: null, city: "NYC", state: "NY",
      zip: "10001", country: "US",
    }]);
    mockInsert([{ id: "order-new", orderNumber: "LBP-260101-XYZ" }]); // insert order
    mockInsert();                                                       // insert order items

    const result = await createManualOrder({
      userId: "cust-1",
      items: [{ productId: "prod-1", quantity: 2, lineItemType: "single" as const }],
      paymentMethod: "credit_card",
      notes: "Rush order",
    });

    expect(result.success).toBe(true);
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Order Confirmation") }),
    );
    expect(sendNewOrderNotification).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
  });

  it("returns error for empty items", async () => {
    const result = await createManualOrder({
      userId: "cust-1",
      items: [],
      paymentMethod: "credit_card",
    });

    expect(result).toEqual({ success: false, error: "Order must have at least one item" });
  });

  it("returns error when customer not found", async () => {
    mockSelect([]); // no customer
    const result = await createManualOrder({
      userId: "nonexistent",
      items: [{ productId: "prod-1", quantity: 1, lineItemType: "single" as const }],
      paymentMethod: "credit_card",
    });

    expect(result).toEqual({ success: false, error: "Customer not found" });
  });

  it("returns error when a product is not found", async () => {
    mockSelect([mockCustomer]);  // customer found
    mockSelect([]);              // no products found

    const result = await createManualOrder({
      userId: "cust-1",
      items: [{ productId: "nonexistent", quantity: 1, lineItemType: "single" as const }],
      paymentMethod: "credit_card",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Product not found");
  });

  it("uses fallback address when none on file", async () => {
    mockSelect([mockCustomer]);    // customer
    mockSelect([mockProduct]);     // product
    mockSelect([]);                // no address
    mockInsert([{ id: "order-new", orderNumber: "LBP-260101-XYZ" }]);
    mockInsert();                  // order items

    const result = await createManualOrder({
      userId: "cust-1",
      items: [{ productId: "prod-1", quantity: 1, lineItemType: "single" as const }],
      paymentMethod: "net_30",
    });

    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Auth guard verification
// ═══════════════════════════════════════════════════════════════

describe("requireAdmin is called on every action", () => {
  it.each([
    ["approveApplication", () => { mockSelect([mockCustomer]); mockUpdate(); return approveApplication("id"); }],
    ["rejectApplication", () => { mockSelect([mockCustomer]); mockUpdate(); return rejectApplication("id"); }],
    ["toggleNet30", () => { mockSelect([{ isNet30Eligible: false }]); mockUpdate(); return toggleNet30("id"); }],
    ["toggleTaxExempt", () => { mockSelect([{ isTaxExempt: false }]); mockUpdate(); return toggleTaxExempt("id"); }],
    ["setCustomDiscount", () => { mockSelect([{ id: "id" }]); mockUpdate(); return setCustomDiscount("id", 10); }],
    ["updateInternalNotes", () => { mockSelect([{ id: "id" }]); mockUpdate(); return updateInternalNotes("id", "n"); }],
    ["sendReengagementEmail", () => { mockSelect([{ email: "e", ownerName: "o", businessName: "b" }]); return sendReengagementEmail("id"); }],
    ["markDelivered", () => { mockSelect([{ id: "id" }]); mockUpdate(); return markDelivered("id"); }],
    ["toggleAvailability", () => { mockSelect([{ isAvailable: true }]); mockUpdate(); return toggleAvailability("id"); }],
    ["markInvoicePaid", () => { mockSelect([]); return markInvoicePaid("inv"); }],
    ["voidInvoice", () => { mockSelect([]); return voidInvoice("inv"); }],
    ["creditInvoice", () => creditInvoice("inv", 100)],
    ["updateSettings", () => updateSettings({})],
    ["saveSortOrder", () => saveSortOrder([])],
    ["createCategory", () => createCategory("  ")],
    ["deleteCategory", () => { mockSelect([{ count: 0 }]); mockDelete([]); return deleteCategory("id"); }],
  ])("%s calls requireAdmin", async (_name, fn) => {
    vi.mocked(requireAdmin).mockClear();
    await fn();
    expect(requireAdmin).toHaveBeenCalled();
  });
});
