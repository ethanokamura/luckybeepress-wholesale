"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { collections, docs, toDate } from "@/lib/firebase-helpers";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import Image from "next/image";

type AccountStatus = "pending" | "active" | "suspended" | "all";

const statusFilters: { value: AccountStatus; label: string }[] = [
  { value: "all", label: "All Customers" },
  { value: "pending", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export default function AdminCustomersPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as AccountStatus) || "all";

  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] =
    useState<AccountStatus>(initialStatus);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        let q;
        if (statusFilter === "all") {
          q = query(collections.users, orderBy("createdAt", "desc"));
        } else {
          q = query(
            collections.users,
            where("accountStatus", "==", statusFilter),
            orderBy("createdAt", "desc")
          );
        }
        const snapshot = await getDocs(q);
        setCustomers(snapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [statusFilter]);

  const handleApprove = async (userId: string) => {
    setUpdating(userId);
    try {
      await updateDoc(docs.user(userId), {
        accountStatus: "active",
        updatedAt: Timestamp.now(),
      });
      setCustomers(
        customers.map((c) =>
          c.id === userId ? { ...c, accountStatus: "active" } : c
        )
      );
    } catch (error) {
      console.error("Error approving customer:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm("Are you sure you want to suspend this customer?")) return;
    setUpdating(userId);
    try {
      await updateDoc(docs.user(userId), {
        accountStatus: "suspended",
        updatedAt: Timestamp.now(),
      });
      setCustomers(
        customers.map((c) =>
          c.id === userId ? { ...c, accountStatus: "suspended" } : c
        )
      );
    } catch (error) {
      console.error("Error suspending customer:", error);
    } finally {
      setUpdating(null);
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
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-32" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customers</h1>

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

      {customers.length > 0 ? (
        <div className="bg-card border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="p-4">Customer</TableHead>
                <TableHead className="p-4">Email</TableHead>
                <TableHead className="p-4">Phone</TableHead>
                <TableHead className="p-4">Joined</TableHead>
                <TableHead className="p-4">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const createdAt = toDate(customer.createdAt);

                return (
                  <TableRow key={customer.id}>
                    <TableCell className="p-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {(customer.displayName ||
                              customer.email)[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer.displayName || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.role === "admin" ? "Admin" : "Customer"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4">{customer.email}</TableCell>
                    <TableCell className="p-4">
                      {customer.phone || "—"}
                    </TableCell>
                    <TableCell className="p-4">
                      {createdAt?.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          customer.accountStatus
                        )}`}
                      >
                        {customer.accountStatus}
                      </span>
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {customer.accountStatus === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(customer.id)}
                            disabled={updating === customer.id}
                          >
                            {updating === customer.id ? "..." : "Approve"}
                          </Button>
                        )}
                        {customer.accountStatus === "active" &&
                          customer.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSuspend(customer.id)}
                              disabled={updating === customer.id}
                            >
                              Suspend
                            </Button>
                          )}
                        {customer.accountStatus === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(customer.id)}
                            disabled={updating === customer.id}
                          >
                            Reactivate
                          </Button>
                        )}
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="text-sm text-primary hover:underline ml-2"
                        >
                          View
                        </Link>
                      </div>
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
          <h2 className="text-xl font-medium mb-2">No customers found</h2>
          <p className="text-muted-foreground">
            {statusFilter === "all"
              ? "No customers have signed up yet."
              : `No customers with status "${statusFilter}".`}
          </p>
        </div>
      )}
    </div>
  );
}
