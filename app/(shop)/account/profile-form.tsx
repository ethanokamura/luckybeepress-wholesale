"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle } from "lucide-react";

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: {
    ownerName: string;
    businessName: string;
    email: string;
    phone: string;
  };
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, undefined);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Profile</h2>
      <form action={formAction} className="flex flex-col gap-4 max-w-lg">
        {state?.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state?.success && (
          <Alert className="border-success/30 bg-success/10">
            <CheckCircle className="size-4 text-success" />
            <AlertDescription className="text-success">Profile updated</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerName">Name</Label>
            <Input id="ownerName" name="ownerName" defaultValue={defaultValues.ownerName} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" name="businessName" defaultValue={defaultValues.businessName} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={defaultValues.email} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={defaultValues.phone} />
          </div>
        </div>

        <Separator className="my-2" />

        <p className="text-sm font-medium">Change Password</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" name="newPassword" type="password" minLength={8} autoComplete="new-password" />
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </section>
  );
}
