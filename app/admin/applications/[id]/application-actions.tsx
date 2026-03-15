"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveApplication,
  rejectApplication,
} from "@/lib/admin/actions";

export function ApplicationActions({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [taxExempt, setTaxExempt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveApplication(applicationId, {
        taxExempt,
        note: note || undefined,
      });
      if (result.success) {
        router.push("/admin/applications");
      } else {
        setError(result.error ?? "Failed to approve application");
      }
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectApplication(
        applicationId,
        note || undefined,
      );
      if (result.success) {
        router.push("/admin/applications");
      } else {
        setError(result.error ?? "Failed to reject application");
      }
    });
  }

  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Actions</h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="note"
            className="block text-sm font-medium mb-1"
          >
            Note (optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Add an internal note..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="taxExempt"
            checked={taxExempt}
            onChange={(e) => setTaxExempt(e.target.checked)}
            className="rounded border"
          />
          <label htmlFor="taxExempt" className="text-sm font-medium">
            Mark as tax exempt
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Approve"}
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
