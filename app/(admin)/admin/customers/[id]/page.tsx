"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { docs, collections, formatPrice, toDate } from "@/lib/firebase-helpers";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import type { User, Order } from "@/types";
import Image from "next/image";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customer
        const customerDoc = await getDoc(docs.user(customerId));
        if (customerDoc.exists()) {
          setCustomer(customerDoc.data());
        }

        // Fetch customer orders
        const ordersQuery = query(
          collections.orders,
          where("userId", "==", customerId),
          orderBy("createdAt", "desc")
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        setOrders(ordersSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching customer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  const handleStatusChange = async (newStatus: User["accountStatus"]) => {
    if (!customer) return;
    setUpdating(true);
    try {
      await updateDoc(docs.user(customerId), {
        accountStatus: newStatus,
        updatedAt: Timestamp.now(),
      });
      setCustomer({ ...customer, accountStatus: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRoleChange = async (newRole: User["role"]) => {
    if (!customer) return;
    if (
      newRole === "admin" &&
      !confirm("Are you sure you want to make this user an admin?")
    )
      return;
    setUpdating(true);
    try {
      await updateDoc(docs.user(customerId), {
        role: newRole,
        updatedAt: Timestamp.now(),
      });
      setCustomer({ ...customer, role: newRole });
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      pending: "bg-amber-100 text-amber-800",
      suspended: "bg-red-100 text-red-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.inactive;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-muted animate-pulse rounded w-48 mb-8" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <Image src="/logo.svg" alt="Lucky Bee Press" width={64} height={64} />
        <h1 className="text-2xl font-bold mb-2">Customer Not Found</h1>
        <Button onClick={() => router.push("/admin/customers")}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const createdAt = toDate(customer.createdAt);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          ← Back to Customers
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl text-primary font-bold">
                {(customer.displayName || customer.email)[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {customer.displayName || "No name set"}
              </h1>
              <p className="text-muted-foreground">{customer.email}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
              customer.accountStatus
            )}`}
          >
            {customer.accountStatus}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Orders</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">
                {createdAt?.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">Member Since</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Customer Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{customer.phone || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{customer.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Verified</p>
                <p className="font-medium">
                  {customer.emailVerified ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-card border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">Order History</h2>
            </div>
            {orders.length > 0 ? (
              <div className="divide-y">
                {orders.map((order) => {
                  const orderDate = toDate(order.createdAt);
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {orderDate?.toLocaleDateString()} •{" "}
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">
                          {formatPrice(order.total)}
                        </span>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No orders yet
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Admin Actions */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-4">Account Status</h3>
            <select
              value={customer.accountStatus}
              onChange={(e) =>
                handleStatusChange(e.target.value as User["accountStatus"])
              }
              disabled={updating}
              className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              {customer.accountStatus === "pending" &&
                "Customer is awaiting approval to access products."}
              {customer.accountStatus === "active" &&
                "Customer can browse and place orders."}
              {customer.accountStatus === "suspended" &&
                "Customer cannot access the store."}
            </p>
          </div>

          {/* Role */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-4">User Role</h3>
            <select
              value={customer.role}
              onChange={(e) => handleRoleChange(e.target.value as User["role"])}
              disabled={updating}
              className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              Admins have full access to the admin panel.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {customer.accountStatus === "pending" && (
                <Button
                  onClick={() => handleStatusChange("active")}
                  disabled={updating}
                  className="w-full"
                >
                  Approve Account
                </Button>
              )}
              {customer.accountStatus === "active" && (
                <Button
                  onClick={() => handleStatusChange("suspended")}
                  disabled={updating}
                  variant="destructive"
                  className="w-full"
                >
                  Suspend Account
                </Button>
              )}
              {customer.accountStatus === "suspended" && (
                <Button
                  onClick={() => handleStatusChange("active")}
                  disabled={updating}
                  variant="outline"
                  className="w-full"
                >
                  Reactivate Account
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
