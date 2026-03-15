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

// ─── Hoisted mocks ──────────────────────────────────────────────

const { mockSignIn, MockAuthError } = vi.hoisted(() => {
  class MockAuthError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "AuthError";
    }
  }
  return {
    mockSignIn: vi.fn(),
    MockAuthError,
  };
});

// Override the global @/lib/auth mock to include signIn
vi.mock("@/lib/auth", () => ({
  signIn: mockSignIn,
  requireAdmin: vi.fn().mockResolvedValue({ id: "admin-user-id" }),
  requireAuth: vi.fn().mockResolvedValue({ id: "user-id" }),
  getCurrentUser: vi.fn().mockResolvedValue(null),
  getAdminUser: vi.fn().mockResolvedValue(null),
  auth: vi.fn().mockResolvedValue(null),
}));

// Mock next-auth to provide AuthError class
vi.mock("next-auth", () => ({
  AuthError: MockAuthError,
  default: vi.fn(),
}));

// Mock bcryptjs
const mockHash = vi.fn();
vi.mock("bcryptjs", () => ({
  hash: mockHash,
}));

// Mock crypto randomUUID
vi.mock("crypto", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    randomUUID: () => "mock-uuid-token",
  };
});

// ─── Mock imports ───────────────────────────────────────────────

import { resend } from "@/lib/email";

// ─── SUT ────────────────────────────────────────────────────────

import {
  loginAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/lib/actions/auth";

// ─── Fixtures ───────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

// ─── Reset ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// loginAction
// ═══════════════════════════════════════════════════════════════

describe("loginAction", () => {
  it("returns error for invalid form data", async () => {
    const fd = makeFormData({ email: "not-an-email", password: "" });
    const result = await loginAction(undefined, fd);

    expect(result).toEqual({ error: expect.any(String) });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("calls signIn with valid credentials", async () => {
    mockSignIn.mockResolvedValue(undefined);
    const fd = makeFormData({ email: "user@example.com", password: "secret123" });
    await loginAction(undefined, fd);

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "secret123",
      redirectTo: "/catalog",
    });
  });

  it("uses callbackUrl from form data when provided", async () => {
    mockSignIn.mockResolvedValue(undefined);
    const fd = makeFormData({
      email: "user@example.com",
      password: "secret123",
      callbackUrl: "/orders",
    });
    await loginAction(undefined, fd);

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "secret123",
      redirectTo: "/orders",
    });
  });

  it("returns 'Invalid email or password' on AuthError", async () => {
    mockSignIn.mockRejectedValue(new MockAuthError("CredentialsSignin"));
    const fd = makeFormData({ email: "user@example.com", password: "wrong" });
    const result = await loginAction(undefined, fd);

    expect(result).toEqual({ error: "Invalid email or password" });
  });

  it("re-throws non-AuthError errors (e.g. NEXT_REDIRECT)", async () => {
    mockSignIn.mockRejectedValue(new Error("NEXT_REDIRECT"));
    const fd = makeFormData({ email: "user@example.com", password: "secret123" });

    await expect(loginAction(undefined, fd)).rejects.toThrow("NEXT_REDIRECT");
  });
});

// ═══════════════════════════════════════════════════════════════
// requestPasswordResetAction
// ═══════════════════════════════════════════════════════════════

describe("requestPasswordResetAction", () => {
  it("returns error for invalid email", async () => {
    const fd = makeFormData({ email: "not-valid" });
    const result = await requestPasswordResetAction(undefined, fd);

    expect(result).toEqual({ error: expect.any(String) });
  });

  it("creates token and sends email when user exists", async () => {
    mockSelect([{ id: "user-1", ownerName: "Jane Doe" }]); // user lookup
    mockInsert(); // insert token

    const fd = makeFormData({ email: "jane@example.com" });
    const result = await requestPasswordResetAction(undefined, fd);

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        subject: "Reset your Lucky Bee Press password",
      }),
    );
  });

  it("returns success even when user not found (prevents enumeration)", async () => {
    mockSelect([]); // no user found

    const fd = makeFormData({ email: "nobody@example.com" });
    const result = await requestPasswordResetAction(undefined, fd);

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(resend.emails.send).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// resetPasswordAction
// ═══════════════════════════════════════════════════════════════

describe("resetPasswordAction", () => {
  it("returns error for invalid form data", async () => {
    const fd = makeFormData({ token: "", password: "short" });
    const result = await resetPasswordAction(undefined, fd);

    expect(result).toEqual({ error: expect.any(String) });
  });

  it("returns error for used token", async () => {
    mockSelect([{
      id: "token-1",
      userId: "user-1",
      token: "some-token",
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: new Date(),
    }]);

    const fd = makeFormData({ token: "some-token", password: "newpassword123" });
    const result = await resetPasswordAction(undefined, fd);

    expect(result).toEqual({
      error: "Invalid or expired reset link. Please request a new one.",
    });
  });

  it("returns error when no token found (expired)", async () => {
    mockSelect([]); // no token found

    const fd = makeFormData({ token: "bad-token", password: "newpassword123" });
    const result = await resetPasswordAction(undefined, fd);

    expect(result).toEqual({
      error: "Invalid or expired reset link. Please request a new one.",
    });
  });

  it("updates password and marks token used for valid token", async () => {
    mockSelect([{
      id: "token-1",
      userId: "user-1",
      token: "valid-token",
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
    }]);
    mockHash.mockResolvedValue("hashed-password");
    mockUpdate(); // update user password
    mockUpdate(); // mark token used

    const fd = makeFormData({ token: "valid-token", password: "newpassword123" });
    const result = await resetPasswordAction(undefined, fd);

    expect(result).toEqual({ success: true });
    expect(mockHash).toHaveBeenCalledWith("newpassword123", 12);
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });
});
