"use client";

import { useState, useRef } from "react";
import { createCustomer } from "@/lib/admin/actions";
import { generateCertificateUploadUrl } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function resetState() {
    setError(null);
    setSuccess(false);
    setBusinessType("");
    setCertificateUrl(null);
    setUploadError(null);
    formRef.current?.reset();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const result = await generateCertificateUploadUrl(
        file.name,
        file.type,
        file.size,
      );

      if ("error" in result) {
        setUploadError(result.error!);
        setUploading(false);
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", result.uploadUrl!);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setCertificateUrl(result.publicUrl!);
        } else {
          setUploadError("Upload failed, please try again");
        }
        setUploading(false);
      };
      xhr.onerror = () => {
        setUploadError("Upload failed, please try again");
        setUploading(false);
      };
      xhr.send(file);
    } catch {
      setUploadError("Upload failed, please try again");
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    fd.set("businessType", businessType);
    if (certificateUrl) fd.set("resaleCertificateUrl", certificateUrl);
    const result = await createCustomer(fd);

    if (result.success) {
      setSuccess(true);
      resetState();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
    } else {
      setError(result.error ?? "Something went wrong");
    }
    setPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <Button onClick={() => setOpen(true)} size="sm">
        Add Customer
      </Button>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Customer</DialogTitle>
          <DialogDescription>
            Create a new wholesale customer. A temporary password will be generated and emailed to them.
          </DialogDescription>
        </DialogHeader>

        {success && (
          <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
            Customer created. Welcome email sent.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Business Information */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold mb-1">Business Information</legend>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-businessName">Business Name *</Label>
              <Input id="create-businessName" name="businessName" required />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-ownerName">Owner / Buyer Name *</Label>
                <Input id="create-ownerName" name="ownerName" required />
              </div>
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-email">Email *</Label>
                <Input id="create-email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-phone">Phone</Label>
                <Input id="create-phone" name="phone" type="tel" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-ein">EIN (optional)</Label>
              <Input id="create-ein" name="ein" />
            </div>
          </fieldset>

          {/* Shipping Address */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold mb-1">Shipping Address</legend>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-street1">Street Address *</Label>
              <Input id="create-street1" name="street1" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-street2">Suite / Unit (optional)</Label>
              <Input id="create-street2" name="street2" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-city">City *</Label>
                <Input id="create-city" name="city" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-state">State *</Label>
                <Input id="create-state" name="state" required maxLength={2} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-zip">ZIP *</Label>
                <Input id="create-zip" name="zip" required />
              </div>
            </div>
          </fieldset>

          {/* Resale Certificate */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold mb-1">Resale Certificate</legend>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-certificate">
                Upload resale certificate (PDF or image)
              </Label>
              <input
                id="create-certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileUpload}
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              {certificateUrl && <p className="text-xs text-green-700">Uploaded successfully</p>}
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="submit" disabled={pending || uploading}>
              {pending ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
