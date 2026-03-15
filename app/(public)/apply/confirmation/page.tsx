import Link from "next/link";
import { Check } from "lucide-react";

export default function ApplicationConfirmationPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
        <Check className="size-6" />
      </div>
      <h1 className="text-2xl font-semibold">Application submitted</h1>
      <p className="text-sm text-muted-foreground">
        Thank you for applying! We review applications within 1-2 business days.
        You&apos;ll receive an email once your account is approved.
      </p>
      <Link href="/login" className="text-sm font-medium text-accent hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
