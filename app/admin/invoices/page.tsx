import { Suspense } from "react";
import { stripe } from "@/lib/stripe";
import { InvoiceActions } from "./invoice-actions";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

async function InvoiceTable({ status }: { status?: string }) {
  const params: Record<string, unknown> = {
    limit: 100,
    expand: ["data.customer"],
  };

  if (status && status !== "all") {
    params.status = status;
  }

  const invoices = await stripe.invoices.list(
    params as Parameters<typeof stripe.invoices.list>[0],
  );

  const now = new Date();

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Invoice ID</th>
            <th className="px-4 py-3 text-left font-medium">Customer</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Due Date</th>
            <th className="px-4 py-3 text-right font-medium">Days Overdue</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.data.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No invoices found.
              </td>
            </tr>
          ) : (
            invoices.data.map((invoice) => {
              const dueDate = invoice.due_date
                ? new Date(invoice.due_date * 1000)
                : null;
              const daysOverdue =
                dueDate && invoice.status === "open"
                  ? Math.max(
                      0,
                      Math.floor(
                        (now.getTime() - dueDate.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    )
                  : 0;

              const customerName =
                typeof invoice.customer === "object" &&
                invoice.customer &&
                "name" in invoice.customer
                  ? (invoice.customer as { name: string | null }).name
                  : null;

              return (
                <tr
                  key={invoice.id}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {invoice.id}
                  </td>
                  <td className="px-4 py-3">
                    {customerName ?? invoice.customer_email ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCents(invoice.amount_due ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "open"
                            ? "bg-yellow-100 text-yellow-800"
                            : invoice.status === "void"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {dueDate ? dueDate.toLocaleDateString() : "--"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {daysOverdue > 0 ? (
                      <span className="text-red-600 font-medium">
                        {daysOverdue}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {invoice.status === "open" && (
                      <InvoiceActions invoiceId={invoice.id} />
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>

      {/* Status Filter */}
      <form method="GET" className="mb-6 flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
            <option value="uncollectible">Uncollectible</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filter
        </button>
      </form>

      <Suspense
        fallback={
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            Loading invoices from Stripe...
          </div>
        }
      >
        <InvoiceTable status={status} />
      </Suspense>
    </div>
  );
}
