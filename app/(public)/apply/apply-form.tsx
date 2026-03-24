"use client";

import { useActionState, useState } from "react";
import { registerAction, generateCertificateUploadUrl } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

export default function ApplyForm() {
  const [state, formAction, isPending] = useActionState(registerAction, undefined);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [businessType, setBusinessType] = useState("");

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

  return (
    <div className="mx-auto max-w-lg py-12 px-4">
      <h1 className="text-2xl font-semibold">Apply for a Wholesale Account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill out the form below. We review applications within 1-2 business days.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-6">
        {state?.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <input type="hidden" name="resaleCertificateUrl" value={certificateUrl ?? ""} />
        <input type="hidden" name="businessType" value={businessType} />

        {/* Business info */}
        <div className="rounded-lg bg-muted/30 p-5">
        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-semibold mb-2">Business Information</legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input id="businessName" name="businessName" required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ownerName">Owner / Buyer Name *</Label>
              <Input id="ownerName" name="ownerName" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Business Type *</Label>
              <Select value={businessType} onValueChange={setBusinessType} required>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" type="tel" required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password *</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            <p className="text-xs text-muted-foreground">At least 8 characters</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ein">EIN (optional)</Label>
            <Input id="ein" name="ein" />
          </div>
        </fieldset>
        </div>

        {/* Shipping address */}
        <div className="rounded-lg bg-muted/30 p-5">
        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-semibold mb-2">Shipping Address</legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="street1">Street Address *</Label>
            <Input id="street1" name="street1" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="street2">Suite / Unit (optional)</Label>
            <Input id="street2" name="street2" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City *</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State *</Label>
              <Input id="state" name="state" required maxLength={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zip">ZIP *</Label>
              <Input id="zip" name="zip" required />
            </div>
          </div>
        </fieldset>
        </div>

        {/* Resale certificate */}
        <div className="rounded-lg bg-muted/30 p-5">
        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-semibold mb-2">Resale Certificate</legend>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="certificate">
              Upload resale certificate (PDF or image)
            </Label>
            <input
              id="certificate"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            {certificateUrl && <p className="text-xs text-success">Uploaded successfully</p>}
          </div>
        </fieldset>
        </div>

        <Button type="submit" disabled={isPending || uploading} size="lg">
          {isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}
