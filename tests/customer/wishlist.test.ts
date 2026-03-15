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

// ─── SUT ────────────────────────────────────────────────────────

import {
  toggleWishlist,
  removeFromWishlist,
  moveToCart,
} from "@/lib/actions/wishlist";

// ─── Fixtures ───────────────────────────────────────────────────

const mockUser = {
  id: "user-id",
  name: "Test User",
  email: "user@example.com",
  emailVerified: null,
  image: null,
  passwordHash: "hashed",
  businessName: "Test Business",
  ownerName: "Test User",
  phone: "1234567890",
  businessType: "boutique",
  ein: null,
  resaleCertificateUrl: null,
  status: "active" as const,
  isTaxExempt: false,
  isAdmin: false,
  isNet30Eligible: false,
  customDiscountPercent: "0",
  internalNotes: null,
  lastLoginAt: null,
  approvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Reset ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// toggleWishlist
// ═══════════════════════════════════════════════════════════════

describe("toggleWishlist", () => {
  it("returns error when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const result = await toggleWishlist("prod-1");

    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("adds new item when not in wishlist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);
    mockSelect([]);    // no existing wishlist item
    mockInsert();      // insert new wishlist item

    const result = await toggleWishlist("prod-1");

    expect(result).toEqual({ added: true });
    expect(revalidatePath).toHaveBeenCalledWith("/wishlist");
  });

  it("removes existing item when already in wishlist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);
    mockSelect([{ id: "wish-1" }]); // existing wishlist item found
    mockDelete();                    // delete wishlist item

    const result = await toggleWishlist("prod-1");

    expect(result).toEqual({ added: false });
    expect(revalidatePath).toHaveBeenCalledWith("/wishlist");
  });
});

// ═══════════════════════════════════════════════════════════════
// removeFromWishlist
// ═══════════════════════════════════════════════════════════════

describe("removeFromWishlist", () => {
  it("returns error when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const result = await removeFromWishlist("wish-1");

    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("removes item and revalidates", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);
    mockDelete(); // delete wishlist item

    const result = await removeFromWishlist("wish-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/wishlist");
  });
});

// ═══════════════════════════════════════════════════════════════
// moveToCart
// ═══════════════════════════════════════════════════════════════

describe("moveToCart", () => {
  it("returns error when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const result = await moveToCart("wish-1");

    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when wishlist item not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);
    mockSelect([]); // no wishlist item found

    const result = await moveToCart("wish-1");

    expect(result).toEqual({ error: "Wishlist item not found" });
  });

  it("returns error when product is unavailable", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);
    mockSelect([{ id: "wish-1", productId: "prod-1" }]); // wishlist item
    mockSelect([{ isAvailable: false, minimumOrderQuantity: 6 }]); // product unavailable

    const result = await moveToCart("wish-1");

    expect(result).toEqual({ error: "Product is currently unavailable" });
  });

  it("adds to cart and removes from wishlist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);
    mockSelect([{ id: "wish-1", productId: "prod-1" }]); // wishlist item
    mockSelect([{ isAvailable: true, minimumOrderQuantity: 6 }]); // product available
    mockSelect([]);    // no existing cart item
    mockInsert();      // insert cart item
    mockDelete();      // delete wishlist item

    const result = await moveToCart("wish-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/wishlist");
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
  });

  it("skips cart insert if already in cart", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);
    mockSelect([{ id: "wish-1", productId: "prod-1" }]); // wishlist item
    mockSelect([{ isAvailable: true, minimumOrderQuantity: 6 }]); // product available
    mockSelect([{ id: "cart-1" }]); // existing cart item found
    mockDelete();                    // delete wishlist item (no insert)

    const result = await moveToCart("wish-1");

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/wishlist");
    expect(revalidatePath).toHaveBeenCalledWith("/cart");
  });
});
