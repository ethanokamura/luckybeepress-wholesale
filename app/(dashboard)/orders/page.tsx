"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDocs, query, where, orderBy } from "firebase/firestore";
import { collections, formatPrice, toDate } from "@/lib/firebase-helpers";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types";
import Image from "next/image";

export default function OrdersPage() {
  const { firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collections.orders,
          where("userId", "==", firebaseUser.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [firebaseUser]);

  if (loading) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-muted animate-pulse rounded w-32 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth requireApproval>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Your Orders</h1>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Image
              src="/logo.svg"
              alt="Lucky Bee Press"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h2 className="text-xl font-medium mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven&apos;t placed any orders yet. Start shopping!
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const createdAt = toDate(order.createdAt);
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-card border rounded-lg p-6 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold">{order.orderNumber}</h3>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {createdAt?.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-sm text-primary">View Details →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
