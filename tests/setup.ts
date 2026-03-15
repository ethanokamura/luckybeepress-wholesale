import { vi } from "vitest";

// ─── Mock next/cache ────────────────────────────────────────
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// ─── Mock next/navigation ───────────────────────────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

// ─── Mock React cache (passthrough) ────────────────────────
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

// ─── Mock Auth ──────────────────────────────────────────────
vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-user-id",
    email: "admin@luckybeepress.com",
    isAdmin: true,
    ownerName: "Admin User",
    businessName: "Lucky Bee Press",
    lastLoginAt: new Date("2025-01-01"),
  }),
  requireAuth: vi.fn().mockResolvedValue({
    id: "user-id",
    email: "user@example.com",
    isAdmin: false,
  }),
  getCurrentUser: vi.fn().mockResolvedValue(null),
  getAdminUser: vi.fn().mockResolvedValue(null),
  auth: vi.fn().mockResolvedValue(null),
}));

// ─── Mock Resend ────────────────────────────────────────────
vi.mock("@/lib/email", () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
    },
  },
  FROM_EMAIL: "Lucky Bee Press <orders@luckybeepress.com>",
}));

// ─── Mock Stripe ────────────────────────────────────────────
vi.mock("@/lib/stripe", () => ({
  stripe: {
    refunds: {
      create: vi.fn().mockResolvedValue({ id: "re_mock" }),
    },
    invoices: {
      pay: vi.fn().mockResolvedValue({ id: "inv_mock" }),
      voidInvoice: vi.fn().mockResolvedValue({ id: "inv_mock" }),
      list: vi.fn().mockResolvedValue({ data: [] }),
    },
    creditNotes: {
      create: vi.fn().mockResolvedValue({ id: "cn_mock" }),
    },
  },
}));

// ─── Mock DB ────────────────────────────────────────────────
// We create a chainable mock that returns itself for most methods
// and resolves to mock data when awaited
function createChainableMock(resolvedValue: unknown = []) {
  const mock: Record<string, unknown> = {};
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

  for (const method of methods) {
    mock[method] = vi.fn().mockReturnValue(mock);
  }

  // Make it thenable
  mock.then = (resolve: (value: unknown) => void) => {
    return Promise.resolve(resolvedValue).then(resolve);
  };

  return mock;
}

export const mockDb = {
  select: vi.fn(() => createChainableMock([])),
  insert: vi.fn(() => createChainableMock([])),
  update: vi.fn(() => createChainableMock([])),
  delete: vi.fn(() => createChainableMock([])),
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

// ─── Mock admin emails ─────────────────────────────────────
vi.mock("@/lib/admin/emails", () => ({
  sendNewOrderNotification: vi.fn().mockResolvedValue(undefined),
  sendLowActivityDigest: vi.fn().mockResolvedValue(undefined),
}));
