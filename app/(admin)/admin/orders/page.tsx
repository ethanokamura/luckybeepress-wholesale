"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDocs, query, where, orderBy } from "firebase/firestore";
import { collections, formatPrice, toDate } from "@/lib/firebase-helpers";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/OrderStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "@/types";
import Image from "next/image";

const statusFilters: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        let q;
        if (statusFilter === "all") {
          q = query(collections.orders, orderBy("createdAt", "desc"));
        } else {
          q = query(
            collections.orders,
            where("status", "==", statusFilter),
            orderBy("createdAt", "desc")
          );
        }
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-32" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {orders.length > 0 ? (
        <div className="bg-card border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="p-4">Order</TableHead>
                <TableHead className="p-4">Customer</TableHead>
                <TableHead className="p-4">Date</TableHead>
                <TableHead className="p-4">Total</TableHead>
                <TableHead className="p-4">Status</TableHead>
                <TableHead className="p-4">Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const createdAt = toDate(order.createdAt);
                return (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell className="p-4">
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </p>
                    </TableCell>
                    <TableCell className="p-4">
                      <p className="text-sm">{order.userEmail}</p>
                    </TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground">
                      {createdAt?.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="p-4 font-medium">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell className="p-4">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </TableCell>
                    <TableCell className="p-4">
                      <PaymentStatusBadge
                        status={order.paymentStatus}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-card border rounded-lg p-12 text-center">
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h2 className="text-xl font-medium mb-2">No orders found</h2>
          <p className="text-muted-foreground">
            {statusFilter === "all"
              ? "No orders have been placed yet."
              : `No orders with status "${statusFilter}".`}
          </p>
        </div>
      )}
    </div>
  );
}
