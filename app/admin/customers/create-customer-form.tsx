"use client";

import { useState, useRef } from "react";
import { createCustomer } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function CreateCustomerForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    fd.set("businessType", businessType);
    const result = await createCustomer(fd);

    if (result.success) {
      setSuccess(true);
      formRef.current?.reset();
      setBusinessType("");
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
    } else {
      setError(result.error ?? "Something went wrong");
    }
    setPending(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Add Customer
      </Button>
    );
  }

  return (
    <div className="rounded-lg border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Create Customer</h2>
        <button
          onClick={() => { setOpen(false); setError(null); setSuccess(false); }}
          className="text-sm text-muted-foreground hover:underline"
        >
          Cancel
        </button>
      </div>

      {success && (
        <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 mb-4">
          Customer created. A welcome email with a temporary password has been sent.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-businessName">Business Name *</Label>
            <Input id="create-businessName" name="businessName" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-ownerName">Owner Name *</Label>
            <Input id="create-ownerName" name="ownerName" required />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-email">Email *</Label>
            <Input id="create-email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-phone">Phone</Label>
            <Input id="create-phone" name="phone" type="tel" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-w-xs">
          <Label>Business Type</Label>
          <Select value={businessType} onValueChange={setBusinessType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boutique">Boutique / Gift Shop</SelectItem>
              <SelectItem value="stationery_store">Stationery Store</SelectItem>
              <SelectItem value="bookstore">Bookstore</SelectItem>
              <SelectItem value="museum_shop">Museum / Gallery Shop</SelectItem>
              <SelectItem value="online_retailer">Online Retailer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          A temporary password will be generated and emailed to the customer.
        </p>

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Customer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
