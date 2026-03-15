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

// ─── Additional mocks ───────────────────────────────────────────

vi.mock("@vercel/blob", () => ({
  put: vi.fn().mockResolvedValue({ url: "https://blob.example.com/file.pdf" }),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/db/validators", () => ({
  applicationFormSchema: { safeParse: vi.fn() },
  updateProfileSchema: { safeParse: vi.fn() },
  addressFormSchema: { safeParse: vi.fn() },
}));

vi.mock("@/lib/emails/templates", () => ({
  applicationReceivedEmail: vi.fn().mockReturnValue("<html>Thanks</html>"),
}));

// ─── Mock imports ───────────────────────────────────────────────

import { getCurrentUser } from "@/lib/auth";
import { resend } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { hash, compare } from "bcryptjs";
import {
  applicationFormSchema,
  updateProfileSchema,
  addressFormSchema,
} from "@/lib/db/validators";

// ─── SUT ────────────────────────────────────────────────────────

import {
  uploadResaleCertificate,
  registerAction,
  updateProfileAction,
  addAddressAction,
  editAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/lib/actions/account";

// ─── Fixtures ───────────────────────────────────────────────────

const mockUser = {
  id: "user-1",
  email: "user@example.com",
  passwordHash: "existing-hash",
  ownerName: "Test User",
  businessName: "Test Biz",
  phone: "555-0100",
  isAdmin: false,
};

const validApplicationData = {
  businessName: "Test Biz",
  ownerName: "Test User",
  email: "new@example.com",
  password: "SecurePass1!",
  phone: "555-0100",
  businessType: "retail",
  ein: "12-3456789",
  street1: "123 Main St",
  street2: undefined,
  city: "Portland",
  state: "OR",
  zip: "97201",
  country: "US",
};

const validAddressData = {
  label: "Home",
  recipientName: "Test User",
  street1: "123 Main St",
  street2: undefined,
  city: "Portland",
  state: "OR",
  zip: "97201",
  isDefault: false,
};

// ─── Reset ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(null);
});

// ═══════════════════════════════════════════════════════════════
// uploadResaleCertificate
// ═══════════════════════════════════════════════════════════════

describe("uploadResaleCertificate", () => {
  it("returns error when no file provided", async () => {
    const fd = new FormData();
    const result = await uploadResaleCertificate(fd);
    expect(result).toEqual({ error: "No file provided" });
  });

  it("returns error for invalid file type", async () => {
    const fd = new FormData();
    const file = new File(["data"], "test.txt", { type: "text/plain" });
    fd.set("file", file);
    const result = await uploadResaleCertificate(fd);
    expect(result).toEqual({ error: "File must be a PDF, JPEG, PNG, or WebP" });
  });

  it("returns error when file is too large", async () => {
    const fd = new FormData();
    const bigContent = new Uint8Array(11 * 1024 * 1024); // 11MB
    const file = new File([bigContent], "big.pdf", { type: "application/pdf" });
    fd.set("file", file);
    const result = await uploadResaleCertificate(fd);
    expect(result).toEqual({ error: "File must be under 10MB" });
  });

  it("uploads valid file and returns URL", async () => {
    const fd = new FormData();
    const file = new File(["pdf-content"], "cert.pdf", { type: "application/pdf" });
    fd.set("file", file);
    const result = await uploadResaleCertificate(fd);

    expect(put).toHaveBeenCalledWith(
      expect.stringContaining("resale-certificates/"),
      file,
      { access: "public" },
    );
    expect(result).toEqual({ url: "https://blob.example.com/file.pdf" });
  });
});

// ═══════════════════════════════════════════════════════════════
// registerAction
// ═══════════════════════════════════════════════════════════════

describe("registerAction", () => {
  it("returns error on validation failure", async () => {
    vi.mocked(applicationFormSchema.safeParse).mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: "Email is required" }] },
    } as never);

    const fd = new FormData();
    const result = await registerAction(undefined, fd);
    expect(result).toEqual({ error: "Email is required" });
  });

  it("returns error when email already exists", async () => {
    vi.mocked(applicationFormSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: validApplicationData,
    } as never);
    mockSelect([{ id: "existing-user" }]); // email check finds existing

    const fd = new FormData();
    const result = await registerAction(undefined, fd);
    expect(result).toEqual({ error: "An account with this email already exists" });
  });

  it("creates user + address, sends email, and redirects on success", async () => {
    vi.mocked(applicationFormSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: validApplicationData,
    } as never);
    mockSelect([]);                                    // no existing email
    mockInsert([{ id: "new-user-id" }]);              // insert user returning
    mockInsert();                                      // insert address

    const fd = new FormData();
    fd.set("resaleCertificateUrl", "https://blob.example.com/cert.pdf");

    await expect(registerAction(undefined, fd)).rejects.toThrow("REDIRECT:/apply/confirmation");

    expect(hash).toHaveBeenCalledWith(validApplicationData.password, 12);
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: validApplicationData.email,
        subject: "Application received — Lucky Bee Press",
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// updateProfileAction
// ═══════════════════════════════════════════════════════════════

describe("updateProfileAction", () => {
  it("returns error when not authenticated", async () => {
    const fd = new FormData();
    const result = await updateProfileAction(undefined, fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error on validation failure", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    vi.mocked(updateProfileSchema.safeParse).mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: "Invalid phone" }] },
    } as never);

    const fd = new FormData();
    const result = await updateProfileAction(undefined, fd);
    expect(result).toEqual({ error: "Invalid phone" });
  });

  it("returns error when email is already in use", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    vi.mocked(updateProfileSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: { email: "taken@example.com" },
    } as never);
    mockSelect([{ id: "other-user" }]); // email conflict

    const fd = new FormData();
    const result = await updateProfileAction(undefined, fd);
    expect(result).toEqual({ error: "Email already in use" });
  });

  it("returns error when changing password without current password", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    vi.mocked(updateProfileSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: { newPassword: "NewPass1!" },
    } as never);

    const fd = new FormData();
    const result = await updateProfileAction(undefined, fd);
    expect(result).toEqual({ error: "Current password required to set a new password" });
  });

  it("returns error when current password is incorrect", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    vi.mocked(updateProfileSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: { currentPassword: "wrong", newPassword: "NewPass1!" },
    } as never);
    vi.mocked(compare).mockResolvedValueOnce(false as never);

    const fd = new FormData();
    const result = await updateProfileAction(undefined, fd);
    expect(result).toEqual({ error: "Current password is incorrect" });
  });

  it("updates profile and revalidates on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    vi.mocked(updateProfileSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: { ownerName: "Updated Name", phone: "555-0200" },
    } as never);
    mockUpdate(); // update users

    const fd = new FormData();
    const result = await updateProfileAction(undefined, fd);

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
});

// ═══════════════════════════════════════════════════════════════
// addAddressAction
// ═══════════════════════════════════════════════════════════════

describe("addAddressAction", () => {
  it("returns error when not authenticated", async () => {
    const fd = new FormData();
    const result = await addAddressAction(undefined, fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error on validation failure", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    vi.mocked(addressFormSchema.safeParse).mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: "Street is required" }] },
    } as never);

    const fd = new FormData();
    const result = await addAddressAction(undefined, fd);
    expect(result).toEqual({ error: "Street is required" });
  });

  it("inserts address and revalidates on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    vi.mocked(addressFormSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: { ...validAddressData, isDefault: true },
    } as never);
    mockUpdate(); // unset other defaults
    mockInsert(); // insert address

    const fd = new FormData();
    const result = await addAddressAction(undefined, fd);

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
});

// ═══════════════════════════════════════════════════════════════
// editAddressAction
// ═══════════════════════════════════════════════════════════════

describe("editAddressAction", () => {
  it("returns error when not authenticated", async () => {
    const fd = new FormData();
    const result = await editAddressAction(undefined, fd);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when addressId is missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    const fd = new FormData();
    // no addressId set
    const result = await editAddressAction(undefined, fd);
    expect(result).toEqual({ error: "Address ID required" });
  });

  it("updates address and revalidates on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    vi.mocked(addressFormSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: { ...validAddressData, isDefault: false },
    } as never);
    mockUpdate(); // update address

    const fd = new FormData();
    fd.set("addressId", "addr-1");
    const result = await editAddressAction(undefined, fd);

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
});

// ═══════════════════════════════════════════════════════════════
// deleteAddressAction
// ═══════════════════════════════════════════════════════════════

describe("deleteAddressAction", () => {
  it("returns error when not authenticated", async () => {
    const result = await deleteAddressAction("addr-1");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("returns error when deleting last address", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ id: "addr-1" }]); // only one address

    const result = await deleteAddressAction("addr-1");
    expect(result).toEqual({ error: "Cannot delete your only address" });
  });

  it("deletes address and revalidates on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockSelect([{ id: "addr-1" }, { id: "addr-2" }]); // multiple addresses
    mockDelete(); // delete address

    const result = await deleteAddressAction("addr-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
});

// ═══════════════════════════════════════════════════════════════
// setDefaultAddressAction
// ═══════════════════════════════════════════════════════════════

describe("setDefaultAddressAction", () => {
  it("returns error when not authenticated", async () => {
    const result = await setDefaultAddressAction("addr-1");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("sets default address and revalidates on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser as never);
    mockUpdate(); // unset all defaults
    mockUpdate(); // set this one as default

    const result = await setDefaultAddressAction("addr-1");

    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
});
