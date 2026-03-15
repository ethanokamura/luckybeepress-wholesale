"use client";

import { useTransition } from "react";
import { markInvoicePaid } from "@/lib/admin/actions";

export function InvoiceActions({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleMarkPaid = () => {
    if (!confirm("Mark this invoice as paid?")) return;
    startTransition(async () => {
      await markInvoicePaid(invoiceId);
    });
  };

  return (
    <button
      onClick={handleMarkPaid}
      disabled={isPending}
      className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {isPending ? "..." : "Mark Paid"}
    </button>
  );
}
