"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addAddressAction,
  editAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Address = {
  id: string;
  label: string | null;
  recipientName: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
};

function AddressForm({
  action,
  defaultValues,
  addressId,
  onCancel,
}: {
  action: typeof addAddressAction | typeof editAddressAction;
  defaultValues?: Partial<Address>;
  addressId?: string;
  onCancel?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border p-4">
      {addressId && <input type="hidden" name="addressId" value={addressId} />}
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Label</Label>
          <Input name="label" defaultValue={defaultValues?.label ?? ""} placeholder="e.g. Store" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Recipient *</Label>
          <Input name="recipientName" required defaultValue={defaultValues?.recipientName ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Street *</Label>
        <Input name="street1" required defaultValue={defaultValues?.street1 ?? ""} />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Suite / Unit</Label>
        <Input name="street2" defaultValue={defaultValues?.street2 ?? ""} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <Label>City *</Label>
          <Input name="city" required defaultValue={defaultValues?.city ?? ""} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>State *</Label>
          <Input name="state" required maxLength={2} defaultValue={defaultValues?.state ?? ""} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>ZIP *</Label>
          <Input name="zip" required defaultValue={defaultValues?.zip ?? ""} />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Shipping Addresses</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
        >
          {showAdd ? "Cancel" : "Add Address"}
        </Button>
      </div>

      {showAdd && (
        <div className="mb-4">
          <AddressForm action={addAddressAction} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {addresses.map((addr) =>
          editingId === addr.id ? (
            <AddressForm
              key={addr.id}
              action={editAddressAction}
              addressId={addr.id}
              defaultValues={addr}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <Card key={addr.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  {addr.isDefault && (
                    <Badge variant="secondary" className="mb-1">
                      Default
                    </Badge>
                  )}
                  <p className="font-medium">{addr.label ?? addr.recipientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {addr.street1}
                    {addr.street2 ? `, ${addr.street2}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!addr.isDefault && (
                    <button
                      disabled={pending}
                      onClick={() =>
                        startTransition(() => {
                          setDefaultAddressAction(addr.id);
                        })
                      }
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(addr.id); setShowAdd(false); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => {
                        deleteAddressAction(addr.id);
                      })
                    }
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        )}
        {addresses.length === 0 && (
          <p className="text-sm text-muted-foreground">No addresses yet.</p>
        )}
      </div>
    </section>
  );
}
