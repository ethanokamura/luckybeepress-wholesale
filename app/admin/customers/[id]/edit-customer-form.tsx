"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerProfile, updateCustomerAddress } from "@/lib/admin/actions";
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

type CustomerData = {
  id: string;
  businessName: string | null;
  ownerName: string | null;
  email: string;
  phone: string | null;
  businessType: string | null;
  ein: string | null;
};

type AddressData = {
  id: string;
  recipientName: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
};

export function EditCustomerForm({
  customer,
  addresses,
}: {
  customer: CustomerData;
  addresses: AddressData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState(customer.businessName ?? "");
  const [ownerName, setOwnerName] = useState(customer.ownerName ?? "");
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [businessType, setBusinessType] = useState(customer.businessType ?? "");
  const [ein, setEin] = useState(customer.ein ?? "");

  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({
    recipientName: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
  });

  function handleSaveProfile() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateCustomerProfile(customer.id, {
        businessName,
        ownerName,
        email,
        phone,
        businessType,
        ein,
      });
      if (result.success) {
        setMessage("Customer updated.");
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update.");
      }
    });
  }

  function startEditAddress(addr: AddressData) {
    setEditingAddressId(addr.id);
    setAddrForm({
      recipientName: addr.recipientName,
      street1: addr.street1,
      street2: addr.street2 ?? "",
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
    });
    setError(null);
    setMessage(null);
  }

  function handleSaveAddress() {
    if (!editingAddressId) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateCustomerAddress(editingAddressId, customer.id, {
        recipientName: addrForm.recipientName,
        street1: addrForm.street1,
        street2: addrForm.street2 || undefined,
        city: addrForm.city,
        state: addrForm.state,
        zip: addrForm.zip,
      });
      if (result.success) {
        setMessage("Address updated.");
        setEditingAddressId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update address.");
      }
    });
  }

  if (!editing && !editingAddressId) {
    return (
      <div className="space-y-3">
        {message && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>
        )}
        <Button variant="outline" size="sm" onClick={() => { setEditing(true); setMessage(null); }}>
          Edit Customer Info
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {editing && (
        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Business Info</h2>
            <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground hover:underline">
              Cancel
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Business Name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Owner Name</Label>
                <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
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
              <div className="flex flex-col gap-1.5">
                <Label>EIN</Label>
                <Input value={ein} onChange={(e) => setEin(e.target.value)} />
              </div>
            </div>

            <div>
              <Button onClick={handleSaveProfile} disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingAddressId && (
        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Address</h2>
            <button onClick={() => setEditingAddressId(null)} className="text-sm text-muted-foreground hover:underline">
              Cancel
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Recipient Name</Label>
              <Input
                value={addrForm.recipientName}
                onChange={(e) => setAddrForm({ ...addrForm, recipientName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Street Address</Label>
              <Input
                value={addrForm.street1}
                onChange={(e) => setAddrForm({ ...addrForm, street1: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Suite / Unit</Label>
              <Input
                value={addrForm.street2}
                onChange={(e) => setAddrForm({ ...addrForm, street2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>City</Label>
                <Input
                  value={addrForm.city}
                  onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>State</Label>
                <Input
                  value={addrForm.state}
                  onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>ZIP</Label>
                <Input
                  value={addrForm.zip}
                  onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Button onClick={handleSaveAddress} disabled={isPending}>
                {isPending ? "Saving..." : "Save Address"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Address edit buttons (only show when not already editing an address) */}
      {!editingAddressId && addresses.length > 0 && (
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Addresses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="rounded-md border p-4 text-sm flex items-start justify-between">
                <div>
                  {addr.isDefault && (
                    <span className="text-xs font-medium text-blue-600 mb-1 block">Default</span>
                  )}
                  <p className="font-medium">{addr.recipientName}</p>
                  <p>{addr.street1}</p>
                  {addr.street2 && <p>{addr.street2}</p>}
                  <p>{addr.city}, {addr.state} {addr.zip}</p>
                </div>
                <button
                  onClick={() => startEditAddress(addr)}
                  className="text-xs text-blue-600 hover:underline shrink-0 ml-3"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
