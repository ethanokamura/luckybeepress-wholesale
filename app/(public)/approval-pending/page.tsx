import { getCurrentUser, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Clock, X } from "lucide-react";

export default async function ApprovalPendingPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  // If already approved, go to catalog
  if (user.status === "active") redirect("/catalog");

  const isRejected = user.status === "rejected";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
        {isRejected ? <X className="size-6" /> : <Clock className="size-6" />}
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          {isRejected
            ? "Application not approved"
            : "Application under review"}
        </h1>
      </div>

      <Alert variant={isRejected ? "destructive" : "default"}>
        {isRejected ? <X className="size-4" /> : <Clock className="size-4" />}
        <AlertTitle>
          {isRejected ? "Not Approved" : "Under Review"}
        </AlertTitle>
        <AlertDescription>
          {isRejected
            ? "Unfortunately, your wholesale application was not approved. If you believe this is an error, please contact us."
            : "Thank you for applying! We're reviewing your wholesale application and will be in touch within 1-2 business days."}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3">
        <a
          href="mailto:luckybeepress@gmail.com"
          className="text-sm font-medium text-accent hover:underline"
        >
          Contact us
        </a>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
