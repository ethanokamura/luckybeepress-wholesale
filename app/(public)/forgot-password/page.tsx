"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    undefined
  );

  if (state?.success) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <Alert>
          <CheckCircle className="size-4" />
          <AlertDescription>
            If an account exists with that email, we&apos;ve sent a password reset
            link. Check your inbox and spam folder.
          </AlertDescription>
        </Alert>
        <Link href="/login" className="text-sm font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {state?.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Back to sign in
      </Link>
    </div>
  );
}
