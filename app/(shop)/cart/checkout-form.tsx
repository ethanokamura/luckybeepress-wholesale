"use client";

import { useActionState, useState } from "react";
import { placeOrderAction } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

type Address = {
  id: string;
  label: string | null;
  recipientName: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
};

export function CheckoutForm({
  addresses,
  isNet30Eligible,
  isBelowMinimum,
}: {
  addresses: Address[];
  isNet30Eligible: boolean;
  isBelowMinimum: boolean;
}) {
  const [state, formAction, isPending] = useActionState(placeOrderAction, undefined);
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [selectedAddress, setSelectedAddress] = useState(defaultAddr?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="addressId" value={selectedAddress} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Address selector */}
      {addresses.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Ship to</Label>
          <Select value={selectedAddress} onValueChange={setSelectedAddress}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select address" />
            </SelectTrigger>
            <SelectContent>
              {addresses.map((addr) => (
                <SelectItem key={addr.id} value={addr.id}>
                  {addr.label ?? addr.recipientName} — {addr.street1}, {addr.city}, {addr.state} {addr.zip}
                  {addr.isDefault ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Payment method */}
      <div className="flex flex-col gap-2">
        <Label>Payment Method</Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={setPaymentMethod}
        >
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <RadioGroupItem value="credit_card" id="payment-cc" />
            <Label htmlFor="payment-cc" className="cursor-pointer font-normal">
              Credit Card
            </Label>
          </div>
          {isNet30Eligible && (
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <RadioGroupItem value="net_30" id="payment-net30" />
              <Label htmlFor="payment-net30" className="cursor-pointer font-normal">
                Net 30 Invoice
              </Label>
            </div>
          )}
        </RadioGroup>
      </div>

      {/* Order notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Order Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="e.g. please pack flat"
          className="resize-none"
        />
      </div>

      <Button type="submit" disabled={isPending || isBelowMinimum} size="lg">
        {isPending ? "Placing Order..." : "Place Order"}
      </Button>
    </form>
  );
}
