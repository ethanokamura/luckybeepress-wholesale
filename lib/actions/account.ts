"use server";

import { db } from "@/lib/db";
import { users, addresses } from "@/lib/db/schema";
import { applicationFormSchema, updateProfileSchema, addressFormSchema } from "@/lib/db/validators";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { getPresignedUploadUrl, getPublicUrl } from "@/lib/r2";
import { resend, FROM_EMAIL } from "@/lib/email";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ─── 3.2 Resale Certificate Upload ──────────────────────────

const ALLOWED_CERT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_CERT_SIZE = 10 * 1024 * 1024; // 10MB

export async function generateCertificateUploadUrl(
  fileName: string,
  contentType: string,
  fileSize: number,
) {
  if (!ALLOWED_CERT_TYPES.includes(contentType)) {
    return { error: "File must be a PDF, JPEG, PNG, or WebP" };
  }

  if (fileSize > MAX_CERT_SIZE) {
    return { error: "File must be under 10MB" };
  }

  const extension = fileName.split(".").pop() ?? "bin";
  const key = `resale-certificates/${crypto.randomUUID()}.${extension}`;
  const uploadUrl = await getPresignedUploadUrl(key, contentType);
  const publicUrl = getPublicUrl(key);
  return { uploadUrl, key, publicUrl };
}

// ─── 3.3 Registration / Application ─────────────────────────

export async function registerAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = applicationFormSchema.safeParse({
    businessName: formData.get("businessName"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    businessType: formData.get("businessType"),
    ein: formData.get("ein") || undefined,
    street1: formData.get("street1"),
    street2: formData.get("street2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "An account with this email already exists" };
  }

  // Hash password
  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(data.password, 12);

  // Get certificate URL if uploaded
  const certificateUrl = formData.get("resaleCertificateUrl") as string | null;

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      name: data.ownerName,
      businessName: data.businessName,
      ownerName: data.ownerName,
      phone: data.phone,
      businessType: data.businessType,
      ein: data.ein ?? null,
      resaleCertificateUrl: certificateUrl,
      status: "pending",
    })
    .returning({ id: users.id });

  // Create address
  await db.insert(addresses).values({
    userId: user.id,
    recipientName: data.ownerName,
    street1: data.street1,
    street2: data.street2 ?? null,
    city: data.city,
    state: data.state,
    zip: data.zip,
    country: data.country,
    isDefault: true,
  });

  // Send "application received" email
  const { applicationReceivedEmail } = await import("@/lib/emails/templates");
  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: "Application received — Lucky Bee Press",
    html: applicationReceivedEmail(data.ownerName),
  });

  redirect("/apply/confirmation");
}

// ─── 4.1 Update Profile ─────────────────────────────────────

export async function updateProfileAction(
  _prevState: { success?: boolean; error?: string } | undefined,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = updateProfileSchema.safeParse({
    ownerName: formData.get("ownerName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    businessName: formData.get("businessName") || undefined,
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.ownerName) updates.ownerName = data.ownerName;
  if (data.businessName) updates.businessName = data.businessName;
  if (data.phone) updates.phone = data.phone;

  if (data.email && data.email !== user.email) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    if (existing.length > 0) {
      return { error: "Email already in use" };
    }
    updates.email = data.email;
  }

  if (data.newPassword) {
    if (!data.currentPassword) {
      return { error: "Current password required to set a new password" };
    }
    const { compare, hash } = await import("bcryptjs");
    const isValid = await compare(data.currentPassword, user.passwordHash ?? "");
    if (!isValid) {
      return { error: "Current password is incorrect" };
    }
    updates.passwordHash = await hash(data.newPassword, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, user.id));

  revalidatePath("/account");
  return { success: true };
}

// ─── 4.3 Shipping Address CRUD ───────────────────────────────

export async function addAddressAction(
  _prevState: { success?: boolean; error?: string } | undefined,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = addressFormSchema.safeParse({
    label: formData.get("label") || undefined,
    recipientName: formData.get("recipientName"),
    street1: formData.get("street1"),
    street2: formData.get("street2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    isDefault: formData.get("isDefault") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, user.id));
  }

  await db.insert(addresses).values({
    userId: user.id,
    ...data,
    street2: data.street2 ?? null,
  });

  revalidatePath("/account");
  return { success: true };
}

export async function editAddressAction(
  _prevState: { success?: boolean; error?: string } | undefined,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const addressId = formData.get("addressId") as string;
  if (!addressId) return { error: "Address ID required" };

  const parsed = addressFormSchema.safeParse({
    label: formData.get("label") || undefined,
    recipientName: formData.get("recipientName"),
    street1: formData.get("street1"),
    street2: formData.get("street2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    isDefault: formData.get("isDefault") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  if (data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, user.id));
  }

  await db
    .update(addresses)
    .set({ ...data, street2: data.street2 ?? null, updatedAt: new Date() })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)));

  revalidatePath("/account");
  return { success: true };
}

export async function deleteAddressAction(addressId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Don't delete the last address
  const allAddresses = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(eq(addresses.userId, user.id));

  if (allAddresses.length <= 1) {
    return { error: "Cannot delete your only address" };
  }

  await db
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)));

  revalidatePath("/account");
  return { success: true };
}

export async function setDefaultAddressAction(addressId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  await db
    .update(addresses)
    .set({ isDefault: false })
    .where(eq(addresses.userId, user.id));

  await db
    .update(addresses)
    .set({ isDefault: true })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)));

  revalidatePath("/account");
  return { success: true };
}
