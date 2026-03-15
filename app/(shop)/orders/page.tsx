import { getCurrentUser } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/queries/orders";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/queries/catalog";
import { EmptyState } from "@/components/shop/empty-state";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";

const statusBorderColor: Record<string, string> = {
  pending: "border-l-primary",
  confirmed: "border-l-primary",
  shipped: "border-l-blue-500",
  delivered: "border-l-success",
  cancelled: "border-l-destructive",
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orderList = await getCustomerOrders(user.id);

  return (
    <div className="flex flex-col gap-8">
      <h1>Orders</h1>

      {orderList.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Once you place an order, it will appear here."
          actionLabel="Browse catalog"
          actionHref="/catalog"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {orderList.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className={`flex items-center justify-between rounded-xl border border-l-4 bg-card p-5 transition-all duration-200 hover:shadow-sm hover:border-primary/20 ${statusBorderColor[order.status] ?? "border-l-muted-foreground"}`}
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium font-mono text-sm tabular-nums">
                  {order.orderNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-mono font-semibold tabular-nums">
                    {formatCents(order.total)}
                  </span>
                  {order.itemCount > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>
                <OrderStatusBadge status={order.status} />
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
