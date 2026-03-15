import { getCurrentUser } from "@/lib/auth";
import { getOrderDetail } from "@/lib/queries/orders";
import { notFound, redirect } from "next/navigation";
import { formatCents } from "@/lib/queries/catalog";
import { OrderActions } from "./order-actions";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  Truck,
  StickyNote,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const order = await getOrderDetail(id, user.id);
  if (!order) notFound();

  const isJustPlaced = query.success === "true";

  const addr = order.shippingAddressSnapshot as {
    recipientName: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
  };

  const canCancel =
    order.status === "pending" || order.status === "confirmed";

  return (
    <div className="flex flex-col gap-10 max-w-3xl pb-12">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              Order
            </p>
            <h1 className="text-3xl font-heading font-bold tracking-tight">
              {order.orderNumber}
            </h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Placed on{" "}
          {new Date(order.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* ── Success banner ────────────────────────────────────── */}
      {isJustPlaced && (
        <Alert className="border-success/30 bg-success/10">
          <CheckCircle className="size-4 text-success" />
          <AlertTitle className="text-success">
            Order placed successfully!
          </AlertTitle>
          <AlertDescription className="text-success">
            You&apos;ll receive a confirmation email shortly.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Line Items ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Package className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Items Ordered
          </h2>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b">
            <span>Product</span>
            <span className="w-16 text-right">Qty</span>
            <span className="w-20 text-right">Unit</span>
            <span className="w-24 text-right">Total</span>
          </div>

          {/* Items */}
          <div className="divide-y">
            {order.items.map((item) => {
              const thumbnail = item.productImages?.[0];
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  {/* Thumbnail */}
                  <div className="relative size-14 shrink-0 rounded-lg overflow-hidden bg-muted/50 border">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground/40">
                        <Package className="size-5" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.lineItemType === "box_set"
                        ? "Box Set"
                        : "Singles"}
                    </p>
                  </div>

                  {/* Quantity / Unit / Total — desktop */}
                  <div className="hidden sm:contents">
                    <span className="w-16 text-right text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <span className="w-20 text-right text-sm tabular-nums text-muted-foreground">
                      {formatCents(item.unitPrice)}
                    </span>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums">
                      {formatCents(item.lineTotal)}
                    </span>
                  </div>

                  {/* Mobile compact view */}
                  <div className="sm:hidden text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCents(item.lineTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {item.quantity} &times; {formatCents(item.unitPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing Summary (receipt style) ───────────────────── */}
      <section>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-6 py-5 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">
                {formatCents(order.subtotal)}
              </span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount ({order.discountPercent}%)</span>
                <span className="tabular-nums">
                  &minus;{formatCents(order.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="tabular-nums">
                {order.shippingCost === 0
                  ? "Free"
                  : formatCents(order.shippingCost)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">
                {formatCents(order.taxAmount)}
              </span>
            </div>

            <Separator className="!my-3" />

            <div className="flex justify-between items-baseline">
              <span className="font-heading font-semibold text-base">
                Total
              </span>
              <span className="font-heading font-bold text-xl tabular-nums">
                {formatCents(order.total)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ship To / Payment — side-by-side cards ────────────── */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Ship To */}
        <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ship To
            </h3>
          </div>
          <div className="text-sm leading-relaxed space-y-0.5">
            <p className="font-medium">{addr.recipientName}</p>
            <p className="text-muted-foreground">{addr.street1}</p>
            {addr.street2 && (
              <p className="text-muted-foreground">{addr.street2}</p>
            )}
            <p className="text-muted-foreground">
              {addr.city}, {addr.state} {addr.zip}
            </p>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment
            </h3>
          </div>
          <div className="text-sm leading-relaxed space-y-0.5">
            <p className="font-medium">
              {order.paymentMethod === "net_30"
                ? "Net 30 Invoice"
                : "Credit Card"}
            </p>
            <p className="text-muted-foreground capitalize">
              {order.paymentStatus.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Tracking Number ───────────────────────────────────── */}
      {order.trackingNumber && (
        <section className="rounded-xl border bg-muted/30 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tracking Number
            </h3>
          </div>
          <a
            href={`https://track.aftership.com/${order.trackingNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-mono text-accent hover:underline underline-offset-4 transition-colors"
          >
            {order.trackingNumber}
            <span className="text-xs text-muted-foreground">&nearr;</span>
          </a>
        </section>
      )}

      {/* ── Order Notes ───────────────────────────────────────── */}
      {order.notes && (
        <section className="rounded-xl border bg-muted/30 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <StickyNote className="size-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Order Notes
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {order.notes}
          </p>
        </section>
      )}

      {/* ── Refund History ────────────────────────────────────── */}
      {order.refunds.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw className="size-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Refund History
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {order.refunds.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border bg-card px-5 py-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium">{r.reason}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-destructive">
                  &minus;{formatCents(r.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Actions ───────────────────────────────────────────── */}
      <Separator />
      <OrderActions orderId={order.id} canCancel={canCancel} />
    </div>
  );
}
