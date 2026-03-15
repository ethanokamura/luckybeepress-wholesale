import { notFound } from "next/navigation";
import { getAdminOrderDetail } from "@/lib/admin/queries";
import { OrderActions } from "./order-actions";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  if (!order) notFound();

  const shippingAddress = order.shippingAddressSnapshot as {
    recipientName?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
        {order.isAdminCreated && (
          <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-xs font-medium">
            Admin Created
          </span>
        )}
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            order.status === "delivered"
              ? "bg-green-100 text-green-800"
              : order.status === "shipped"
                ? "bg-blue-100 text-blue-800"
                : order.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : order.status === "confirmed"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
          }`}
        >
          {order.status}
        </span>
      </div>

      {/* Status Timeline */}
      {order.status !== "cancelled" && (
        <div className="mb-8">
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                    i <= currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    i <= currentStepIndex ? "font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`mx-3 h-0.5 w-12 ${
                      i < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <section className="rounded-md border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Info</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Order Number</dt>
                <dd className="font-medium">{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">{order.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{order.createdAt.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{order.updatedAt.toLocaleString()}</dd>
              </div>
              {order.trackingNumber && (
                <div>
                  <dt className="text-muted-foreground">Tracking Number</dt>
                  <dd className="font-mono">{order.trackingNumber}</dd>
                </div>
              )}
              {order.notes && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd>{order.notes}</dd>
                </div>
              )}
              {order.adminOverrideReason && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Admin Override Reason</dt>
                  <dd>{order.adminOverrideReason}</dd>
                </div>
              )}
              {order.cancelledAt && (
                <>
                  <div>
                    <dt className="text-muted-foreground">Cancelled At</dt>
                    <dd>{order.cancelledAt.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Cancel Reason</dt>
                    <dd>{order.cancelReason}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          {/* Customer */}
          <section className="rounded-md border p-6">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Business</dt>
                <dd className="font-medium">{order.customerBusinessName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contact</dt>
                <dd>{order.customerOwnerName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{order.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{order.customerPhone}</dd>
              </div>
            </dl>
          </section>

          {/* Line Items */}
          <section className="rounded-md border p-6">
            <h2 className="text-lg font-semibold mb-4">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">Product</th>
                    <th className="pb-2 text-left font-medium">Type</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Unit Price</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">{item.productName}</td>
                      <td className="py-2 capitalize">
                        {item.lineItemType.replace("_", " ")}
                      </td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">
                        {formatCents(item.unitPrice)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatCents(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pricing Summary */}
          <section className="rounded-md border p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-mono">{formatCents(order.subtotal)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Discount ({order.discountPercent}%)
                  </dt>
                  <dd className="font-mono text-red-600">
                    -{formatCents(order.discountAmount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-mono">{formatCents(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="font-mono">{formatCents(order.taxAmount)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2">
                <dt className="font-semibold">Total</dt>
                <dd className="font-mono font-semibold">{formatCents(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Refund History */}
          {order.refunds.length > 0 && (
            <section className="rounded-md border p-6">
              <h2 className="text-lg font-semibold mb-4">Refund History</h2>
              <div className="space-y-3">
                {order.refunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="flex items-start justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatCents(refund.amount)}</p>
                      {refund.reason && (
                        <p className="text-muted-foreground">{refund.reason}</p>
                      )}
                      {refund.stripeRefundId && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {refund.stripeRefundId}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {refund.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <section className="rounded-md border p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            {shippingAddress ? (
              <div className="text-sm space-y-1">
                {shippingAddress.recipientName && (
                  <p className="font-medium">{shippingAddress.recipientName}</p>
                )}
                <p>{shippingAddress.street1}</p>
                {shippingAddress.street2 && <p>{shippingAddress.street2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state}{" "}
                  {shippingAddress.zip}
                </p>
                <p>{shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No address on file</p>
            )}
          </section>

          {/* Payment Info */}
          <section className="rounded-md border p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Info</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-medium">
                  {order.paymentMethod === "credit_card" ? "Credit Card" : "Net 30"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment Status</dt>
                <dd className="capitalize">{order.paymentStatus}</dd>
              </div>
              {order.stripePaymentIntentId && (
                <div>
                  <dt className="text-muted-foreground">Stripe Payment Intent</dt>
                  <dd className="font-mono text-xs break-all">
                    {order.stripePaymentIntentId}
                  </dd>
                </div>
              )}
              {order.stripeInvoiceId && (
                <div>
                  <dt className="text-muted-foreground">Stripe Invoice</dt>
                  <dd className="font-mono text-xs break-all">
                    {order.stripeInvoiceId}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Actions */}
          <OrderActions
            orderId={order.id}
            orderStatus={order.status}
            currentTrackingNumber={order.trackingNumber}
          />
        </div>
      </div>
    </div>
  );
}
