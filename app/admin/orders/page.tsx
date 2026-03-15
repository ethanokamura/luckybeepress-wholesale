import Link from "next/link";
import { getAdminOrders } from "@/lib/admin/queries";
import { OrderListClient } from "./order-list-client";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const { data: orders, total } = await getAdminOrders({
    status: params.status,
    paymentMethod: params.paymentMethod,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    search: params.search,
    page,
  });

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link
          href="/admin/orders/create"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Order
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment</label>
          <select
            name="paymentMethod"
            defaultValue={params.paymentMethod ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Methods</option>
            <option value="credit_card">Credit Card</option>
            <option value="net_30">Net 30</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <input
            type="date"
            name="dateFrom"
            defaultValue={params.dateFrom ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <input
            type="date"
            name="dateTo"
            defaultValue={params.dateTo ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Order # or customer..."
            className="rounded-md border px-3 py-2 text-sm w-56"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filter
        </button>

        <Link
          href="/admin/orders"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Reset
        </Link>
      </form>

      <OrderListClient
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerBusinessName: o.customerBusinessName,
          customerOwnerName: o.customerOwnerName,
          status: o.status,
          paymentMethod: o.paymentMethod,
          total: o.total,
          totalFormatted: formatCents(o.total),
          isAdminCreated: o.isAdminCreated,
          createdAt: o.createdAt.toISOString(),
        }))}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={{
                pathname: "/admin/orders",
                query: { ...params, page: String(page - 1) },
              }}
              className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} orders)
          </span>
          {page < totalPages && (
            <Link
              href={{
                pathname: "/admin/orders",
                query: { ...params, page: String(page + 1) },
              }}
              className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
