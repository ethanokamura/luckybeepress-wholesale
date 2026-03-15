"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleNet30,
  toggleTaxExempt,
  setCustomDiscount,
  updateInternalNotes,
  sendReengagementEmail,
} from "@/lib/admin/actions";

export function CustomerActions({
  customerId,
  isNet30,
  isTaxExempt,
  currentDiscount,
  currentNotes,
  isAtRisk,
}: {
  customerId: string;
  isNet30: boolean;
  isTaxExempt: boolean;
  currentDiscount: number | null;
  currentNotes: string | null;
  isAtRisk: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [discount, setDiscount] = useState(
    currentDiscount?.toString() ?? "",
  );
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function showResult(result: { success: boolean; error?: string }) {
    if (result.success) {
      setMessage("Updated successfully.");
      setError(null);
      router.refresh();
    } else {
      setError(result.error ?? "Action failed.");
      setMessage(null);
    }
  }

  function handleToggleNet30() {
    startTransition(async () => {
      const result = await toggleNet30(customerId);
      showResult(result);
    });
  }

  function handleToggleTaxExempt() {
    startTransition(async () => {
      const result = await toggleTaxExempt(customerId);
      showResult(result);
    });
  }

  function handleSetDiscount() {
    const percent = parseFloat(discount);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      setError("Discount must be between 0 and 100.");
      return;
    }
    startTransition(async () => {
      const result = await setCustomDiscount(customerId, percent);
      showResult(result);
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      const result = await updateInternalNotes(customerId, notes);
      showResult(result);
    });
  }

  function handleReengagement() {
    startTransition(async () => {
      const result = await sendReengagementEmail(customerId);
      showResult(result);
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Toggle Actions */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Account Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleToggleNet30}
            disabled={isPending}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {isNet30 ? "Disable Net 30" : "Enable Net 30"}
          </button>
          <button
            onClick={handleToggleTaxExempt}
            disabled={isPending}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {isTaxExempt ? "Remove Tax Exempt" : "Mark Tax Exempt"}
          </button>
          {isAtRisk && (
            <button
              onClick={handleReengagement}
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Send Re-engagement Email
            </button>
          )}
        </div>
      </div>

      {/* Custom Discount */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Custom Discount</h2>
        <div className="flex gap-3 items-end">
          <div>
            <label
              htmlFor="discount"
              className="block text-sm font-medium mb-1"
            >
              Discount Percentage
            </label>
            <input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm w-32"
              placeholder="0"
            />
          </div>
          <button
            onClick={handleSetDiscount}
            disabled={isPending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            Set Discount
          </button>
        </div>
      </div>

      {/* Internal Notes */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Internal Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-md border px-3 py-2 text-sm mb-3"
          placeholder="Add internal notes about this customer..."
        />
        <button
          onClick={handleSaveNotes}
          disabled={isPending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          Save Notes
        </button>
      </div>
    </div>
  );
}
