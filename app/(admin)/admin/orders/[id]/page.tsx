"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { docs, formatPrice, toDate } from "@/lib/firebase-helpers";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { Order, OrderStatus, PaymentStatus } from "@/types";

const orderStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const paymentStatuses: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: "",
    trackingNumber: "",
    trackingUrl: "",
  });
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(docs.order(orderId));
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          setOrder(data);
          setAdminNotes(data.adminNotes || "");
          if (data.shipping) {
            setTrackingInfo({
              carrier: data.shipping.carrier || "",
              trackingNumber: data.shipping.trackingNumber || "",
              trackingUrl: data.shipping.trackingUrl || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      if (newStatus === "cancelled") {
        await updateDoc(docs.order(orderId), {
          status: newStatus,
          cancelledAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else if (newStatus === "refunded") {
        await updateDoc(docs.order(orderId), {
          status: newStatus,
          refundedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else if (newStatus === "shipped") {
        await updateDoc(docs.order(orderId), {
          status: newStatus,
          shipping: {
            ...order.shipping,
            shippedAt: Timestamp.now(),
          },
          updatedAt: Timestamp.now(),
        });
      } else if (newStatus === "delivered") {
        await updateDoc(docs.order(orderId), {
          status: newStatus,
          shipping: {
            ...order.shipping,
            deliveredAt: Timestamp.now(),
          },
          updatedAt: Timestamp.now(),
        });
      } else {
        await updateDoc(docs.order(orderId), {
          status: newStatus,
          updatedAt: Timestamp.now(),
        });
      }
      setOrder({ ...order, status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      if (newStatus === "paid") {
        await updateDoc(docs.order(orderId), {
          paymentStatus: newStatus,
          paidAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else {
        await updateDoc(docs.order(orderId), {
          paymentStatus: newStatus,
          updatedAt: Timestamp.now(),
        });
      }
      setOrder({ ...order, paymentStatus: newStatus });
    } catch (error) {
      console.error("Error updating payment status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      await updateDoc(docs.order(orderId), {
        shipping: {
          ...order.shipping,
          method: "Standard",
          carrier: trackingInfo.carrier || null,
          trackingNumber: trackingInfo.trackingNumber || null,
          trackingUrl: trackingInfo.trackingUrl || null,
        },
        updatedAt: Timestamp.now(),
      });
      setOrder({
        ...order,
        shipping: {
          ...order.shipping,
          method: "Standard",
          carrier: trackingInfo.carrier || null,
          trackingNumber: trackingInfo.trackingNumber || null,
          trackingUrl: trackingInfo.trackingUrl || null,
          estimatedDelivery: order.shipping?.estimatedDelivery || null,
          shippedAt: order.shipping?.shippedAt || null,
          deliveredAt: order.shipping?.deliveredAt || null,
        },
      });
      alert("Tracking info updated!");
    } catch (error) {
      console.error("Error updating tracking:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      await updateDoc(docs.order(orderId), {
        adminNotes: adminNotes || null,
        updatedAt: Timestamp.now(),
      });
      setOrder({ ...order, adminNotes: adminNotes || null });
      alert("Notes saved!");
    } catch (error) {
      console.error("Error updating notes:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`);
      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order?.orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 bg-muted animate-pulse rounded w-48 mb-8" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Image
          src="/logo.svg"
          alt="Lucky Bee Press"
          width={64}
          height={64}
          className="mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <Button onClick={() => router.push("/admin/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const createdAt = toDate(order.createdAt);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            ← Back to Orders
          </button>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            {createdAt?.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <Button
            onClick={handleDownloadInvoice}
            variant="outline"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Download Invoice
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-4 py-3 border-b last:border-0"
                >
                  <div className="relative h-14 w-14 shrink-0 rounded bg-muted overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="/logo.svg"
                        alt="Lucky Bee Press"
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.shippingCost > 0
                    ? formatPrice(order.shippingCost)
                    : "Free"}
                </span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-bold mb-3">Shipping Address</h3>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && (
                  <p>{order.shippingAddress.company}</p>
                )}
                <p>{order.shippingAddress.street1}</p>
                {order.shippingAddress.street2 && (
                  <p>{order.shippingAddress.street2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-bold mb-3">Billing Address</h3>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {order.billingAddress.firstName}{" "}
                  {order.billingAddress.lastName}
                </p>
                {order.billingAddress.company && (
                  <p>{order.billingAddress.company}</p>
                )}
                <p>{order.billingAddress.street1}</p>
                {order.billingAddress.street2 && (
                  <p>{order.billingAddress.street2}</p>
                )}
                <p>
                  {order.billingAddress.city}, {order.billingAddress.state}{" "}
                  {order.billingAddress.postalCode}
                </p>
                <p>{order.billingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {order.notes && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-bold mb-3">Customer Notes</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Admin Actions */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-4">Update Status</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Order Status
                </label>
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as OrderStatus)
                  }
                  disabled={updating}
                  className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Status
                </label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) =>
                    handlePaymentStatusChange(e.target.value as PaymentStatus)
                  }
                  disabled={updating}
                  className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tracking Info */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-4">Tracking Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Carrier
                </label>
                <input
                  type="text"
                  value={trackingInfo.carrier}
                  onChange={(e) =>
                    setTrackingInfo({
                      ...trackingInfo,
                      carrier: e.target.value,
                    })
                  }
                  placeholder="USPS, UPS, FedEx..."
                  className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingInfo.trackingNumber}
                  onChange={(e) =>
                    setTrackingInfo({
                      ...trackingInfo,
                      trackingNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tracking URL
                </label>
                <input
                  type="url"
                  value={trackingInfo.trackingUrl}
                  onChange={(e) =>
                    setTrackingInfo({
                      ...trackingInfo,
                      trackingUrl: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button
                onClick={handleUpdateTracking}
                disabled={updating}
                variant="outline"
                className="w-full"
              >
                {updating ? "Saving..." : "Save Tracking"}
              </Button>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-4">Admin Notes</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Internal notes (not visible to customer)..."
              className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <Button
              onClick={handleUpdateNotes}
              disabled={updating}
              variant="outline"
              className="w-full mt-3"
            >
              {updating ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
