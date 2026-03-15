import { describe, it, expect, vi, beforeEach } from "vitest";

// Un-mock the module under test; keep all other mocks from setup.ts
vi.unmock("@/lib/auth");

// Use vi.hoisted so the mock fn is available inside vi.mock factories
// (vi.mock calls are hoisted above imports)
const { mockAuthSession } = vi.hoisted(() => ({
  mockAuthSession: vi.fn(),
}));

vi.mock("next-auth", () => {
  return {
    default: () => ({
      handlers: {},
      auth: mockAuthSession,
      signIn: vi.fn(),
      signOut: vi.fn(),
    }),
  };
});

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({})),
}));

vi.mock("@auth/drizzle-adapter", () => ({
  DrizzleAdapter: vi.fn(() => ({})),
}));

import { mockDb } from "../setup";
import {
  getCurrentUser,
  getAdminUser,
  requireAuth,
  requireAdmin,
} from "@/lib/auth";

// ─── Helpers ────────────────────────────────────────────────

function mockDbUserResult(user: Record<string, unknown> | null) {
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

  const resolved = user ? [user] : [];
  chain.then = (resolve: (v: unknown) => void) =>
    Promise.resolve(resolved).then(resolve);

  mockDb.select.mockReturnValue(chain as never);
}

const regularUser = {
  id: "user-123",
  email: "user@example.com",
  isAdmin: false,
  ownerName: "Regular User",
  businessName: "Regular Biz",
};

const adminUser = {
  id: "admin-456",
  email: "admin@luckybeepress.com",
  isAdmin: true,
  ownerName: "Admin User",
  businessName: "Lucky Bee Press",
};

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentUser", () => {
  it("returns null when there is no session", async () => {
    mockAuthSession.mockResolvedValue(null);

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("returns the user when there is a valid session", async () => {
    mockAuthSession.mockResolvedValue({ user: { id: "user-123" } });
    mockDbUserResult(regularUser);

    const result = await getCurrentUser();
    expect(result).toEqual(regularUser);
  });
});

describe("getAdminUser", () => {
  it("returns null when the user is not an admin", async () => {
    mockAuthSession.mockResolvedValue({ user: { id: "user-123" } });
    mockDbUserResult(regularUser);

    const result = await getAdminUser();
    expect(result).toBeNull();
  });

  it("returns the user when they are an admin", async () => {
    mockAuthSession.mockResolvedValue({ user: { id: "admin-456" } });
    mockDbUserResult(adminUser);

    const result = await getAdminUser();
    expect(result).toEqual(adminUser);
  });
});

describe("requireAuth", () => {
  it("returns the user when authenticated", async () => {
    mockAuthSession.mockResolvedValue({ user: { id: "user-123" } });
    mockDbUserResult(regularUser);

    const result = await requireAuth();
    expect(result).toEqual(regularUser);
  });

  it("throws a redirect when not authenticated", async () => {
    mockAuthSession.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("requireAdmin", () => {
  it("returns the admin user when authenticated as admin", async () => {
    mockAuthSession.mockResolvedValue({ user: { id: "admin-456" } });
    mockDbUserResult(adminUser);

    const result = await requireAdmin();
    expect(result).toEqual(adminUser);
  });

  it("throws a redirect for a non-admin user", async () => {
    mockAuthSession.mockResolvedValue({ user: { id: "user-123" } });
    mockDbUserResult(regularUser);

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/login");
  });

  it("throws a redirect when there is no session", async () => {
    mockAuthSession.mockResolvedValue(null);

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/login");
  });
});
