"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    undefined
  );

  if (state?.success) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Password reset</h1>
        <Alert>
          <CheckCircle className="size-4" />
          <AlertDescription>
            Your password has been updated. You can now sign in with your new
            password.
          </AlertDescription>
        </Alert>
        <Link href="/login" className="text-sm font-medium text-accent hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Invalid link</h1>
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            This password reset link is invalid or has expired.
          </AlertDescription>
        </Alert>
        <Link href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">Set new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />

        {state?.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    </div>
  );
}
