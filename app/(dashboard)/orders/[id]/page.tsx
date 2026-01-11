"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getDoc } from "firebase/firestore";
import { docs, formatPrice, toDate } from "@/lib/firebase-helpers";
import { AuthGuard } from "@/components/shared/AuthGuard";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types";

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const orderId = params.id as string;
  const isNewOrder = searchParams.get("new") === "true";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(docs.order(orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          // Verify this order belongs to the current user
          if (orderData.userId === firebaseUser?.uid) {
            setOrder(orderData);
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (firebaseUser) {
      fetchOrder();
    }
  }, [orderId, firebaseUser]);

  if (loading) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mb-8" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AuthGuard>
    );
  }

  if (!order) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="max-w-4xl mx-auto text-center py-16">
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This order doesn&apos;t exist or you don&apos;t have permission to
            view it.
          </p>
          <Button onClick={() => router.push("/orders")}>
            View All Orders
          </Button>
        </div>
      </AuthGuard>
    );
  }

  const createdAt = toDate(order.createdAt);

  return (
    <AuthGuard requireAuth requireApproval>
      <div className="max-w-4xl mx-auto">
        {/* Success Message for New Orders */}
        {isNewOrder && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <h2 className="font-bold text-green-800">
                  Order Placed Successfully!
                </h2>
                <p className="text-green-700 text-sm">
                  Thank you for your order. We&apos;ll be in touch soon to
                  confirm payment and shipping details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/orders"
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
            >
              ← Back to Orders
            </Link>
            <h1 className="text-3xl font-bold text-foreground">
              {order.orderNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              Placed on{" "}
              {createdAt?.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 py-4 border-b last:border-0"
                  >
                    <div className="relative h-16 w-16 shrink-0 rounded-md bg-muted overflow-hidden">
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
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">
                        {formatPrice(item.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Shipping Address</h2>
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
                {order.shippingAddress.phone && (
                  <p className="mt-2">{order.shippingAddress.phone}</p>
                )}
              </div>
            </div>

            {/* Tracking Info */}
            {order.shipping?.trackingNumber && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4">Tracking Information</h2>
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Carrier: {order.shipping.carrier || "—"}
                  </p>
                  <p className="font-medium mt-1">
                    Tracking: {order.shipping.trackingNumber}
                  </p>
                  {order.shipping.trackingUrl && (
                    <a
                      href={order.shipping.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-2 inline-block"
                    >
                      Track Package →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4">Order Notes</h2>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
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
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link href="/products">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
