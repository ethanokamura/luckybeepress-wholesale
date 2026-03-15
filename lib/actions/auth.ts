"use server";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import {
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from "@/lib/db/validators";
import { eq, and, gt } from "drizzle-orm";
import { AuthError } from "next-auth";
import { randomUUID } from "crypto";
import { resend, FROM_EMAIL } from "@/lib/email";
import { redirect } from "next/navigation";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const callbackUrl =
    (formData.get("callbackUrl") as string) || "/catalog";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    // signIn throws a NEXT_REDIRECT when successful — let it propagate
    throw error;
  }
}

export async function requestPasswordResetAction(
  _prevState: { success?: boolean; error?: string } | undefined,
  formData: FormData
) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const [user] = await db
    .select({ id: users.id, ownerName: users.ownerName })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your Lucky Bee Press password",
      html: `
        <p>Hi ${user.ownerName ?? "there"},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>— Lucky Bee Press</p>
      `,
    });
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prevState: { success?: boolean; error?: string } | undefined,
  formData: FormData
) {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { token, password } = parsed.data;

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!resetToken || resetToken.usedAt) {
    return { error: "Invalid or expired reset link. Please request a new one." };
  }

  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, resetToken.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));

  return { success: true };
}
