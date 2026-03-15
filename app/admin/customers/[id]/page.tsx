import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail, isReturningCustomer } from "@/lib/admin/queries";
import { CustomerActions } from "./customer-actions";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, returning] = await Promise.all([
    getCustomerDetail(id),
    isReturningCustomer(id),
  ]);

  if (!customer) notFound();

  const lastOrderDate =
    customer.orderHistory.length > 0
      ? new Date(customer.orderHistory[0].createdAt)
      : null;
  const daysSinceLastOrder = lastOrderDate
    ? Math.floor(
        (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;
  const isAtRisk = daysSinceLastOrder !== null && daysSinceLastOrder > 90;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin" className="hover:underline">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/customers" className="hover:underline">
          Customers
        </Link>
        <span>/</span>
        <span className="text-foreground">{customer.businessName}</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{customer.businessName}</h1>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            returning
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {returning ? "Returning Customer" : "New Customer"}
        </span>
        {isAtRisk && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            At Risk
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Business Info */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Business Info</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Business Name</dt>
              <dd className="font-medium">{customer.businessName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="font-medium">{customer.ownerName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{customer.phone ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Business Type</dt>
              <dd className="font-medium capitalize">
                {customer.businessType}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">EIN</dt>
              <dd className="font-medium">{customer.ein ?? "N/A"}</dd>
            </div>
            {customer.resaleCertificateUrl && (
              <div>
                <dt className="text-muted-foreground">Resale Certificate</dt>
                <dd>
                  <a
                    href={customer.resaleCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Certificate
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Account Settings */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    customer.status === "active"
                      ? "bg-green-100 text-green-800"
                      : customer.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {customer.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tax Exempt</dt>
              <dd className="font-medium">
                {customer.isTaxExempt ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Net 30 Eligible</dt>
              <dd className="font-medium">
                {customer.isNet30Eligible ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Custom Discount</dt>
              <dd className="font-medium">
                {customer.customDiscountPercent
                  ? `${customer.customDiscountPercent}%`
                  : "None"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Joined</dt>
              <dd className="font-medium">
                {new Date(customer.createdAt).toLocaleDateString()}
              </dd>
            </div>
            {customer.approvedAt && (
              <div>
                <dt className="text-muted-foreground">Approved</dt>
                <dd className="font-medium">
                  {new Date(customer.approvedAt).toLocaleDateString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Lifetime Value</dt>
              <dd className="font-medium">
                {formatCents(Number(customer.lifetimeValue.totalSpent))} (
                {customer.lifetimeValue.orderCount} orders)
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Addresses */}
      <div className="rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Addresses</h2>
        {customer.addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No addresses on file.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-md border p-4 text-sm"
              >
                {addr.isDefault && (
                  <span className="text-xs font-medium text-blue-600 mb-1 block">
                    Default
                  </span>
                )}
                <p className="font-medium">{addr.label ?? "Address"}</p>
                <p>{addr.street1}</p>
                {addr.street2 && <p>{addr.street2}</p>}
                <p>
                  {addr.city}, {addr.state} {addr.zip}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order History</h2>
        {customer.orderHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Order #</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Payment</th>
                <th className="text-left px-4 py-2 font-medium">
                  Payment Status
                </th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.orderHistory.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2 capitalize">{order.status}</td>
                  <td className="px-4 py-2 capitalize">
                    {order.paymentMethod?.replace("_", " ")}
                  </td>
                  <td className="px-4 py-2 capitalize">
                    {order.paymentStatus}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCents(order.total)}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Actions & Internal Notes */}
      <CustomerActions
        customerId={customer.id}
        isNet30={customer.isNet30Eligible}
        isTaxExempt={customer.isTaxExempt}
        currentDiscount={customer.customDiscountPercent ? Number(customer.customDiscountPercent) : null}
        currentNotes={customer.internalNotes}
        isAtRisk={isAtRisk}
      />
    </div>
  );
}
