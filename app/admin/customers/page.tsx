import Link from "next/link";
import { getCustomerList } from "@/lib/admin/queries";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const { search, status, page } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;

  const { data: customers, total } = await getCustomerList({
    search,
    status,
    page: currentPage,
  });

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  function buildUrl(params: Record<string, string | undefined>) {
    const url = new URLSearchParams();
    if (params.search) url.set("search", params.search);
    if (params.status) url.set("status", params.status);
    if (params.page && params.page !== "1") url.set("page", params.page);
    const qs = url.toString();
    return `/admin/customers${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <form className="flex gap-4 mb-6">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by name or email..."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Filter
        </button>
      </form>

      {customers.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No customers found.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">
                    Business Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Owner</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Net 30</th>
                  <th className="text-left px-4 py-3 font-medium">Discount</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {customer.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{customer.ownerName}</td>
                    <td className="px-4 py-3">{customer.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          customer.status === "active"
                            ? "bg-green-100 text-green-800"
                            : customer.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : customer.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {customer.isNet30Eligible ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      {customer.customDiscountPercent
                        ? `${customer.customDiscountPercent}%`
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}--
                {Math.min(currentPage * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={buildUrl({
                      search,
                      status,
                      page: String(currentPage - 1),
                    })}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={buildUrl({
                      search,
                      status,
                      page: String(currentPage + 1),
                    })}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
