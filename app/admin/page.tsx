import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  getPendingApplicationsCount,
  getNewOrdersSinceLastLogin,
  getAtRiskCustomersCount,
  get30DaySummary,
  getPlatformSettings,
} from "@/lib/admin/queries";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ShoppingCart, Receipt, AlertTriangle } from "lucide-react";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminDashboardPage() {
  const [admin, settings] = await Promise.all([
    requireAdmin(),
    getPlatformSettings(),
  ]);
  const lastLoginAt = admin?.lastLoginAt ?? null;

  const atRiskSetting = settings.find(
    (s) => s.key === "at_risk_threshold_days",
  );
  const atRiskThreshold = atRiskSetting ? parseInt(atRiskSetting.value, 10) : 90;

  const [pendingCount, newOrdersCount, atRiskCount, summary] =
    await Promise.all([
      getPendingApplicationsCount(),
      getNewOrdersSinceLastLogin(lastLoginAt),
      getAtRiskCustomersCount(atRiskThreshold),
      get30DaySummary(),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pending Applications */}
        <Link href="/admin/applications" className="block">
          <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-primary-text" />
                Pending Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold tabular-nums">{pendingCount}</p>
                {pendingCount > 0 && (
                  <Badge variant="destructive">{pendingCount} pending</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* New Orders */}
        <Link href="/admin/orders" className="block">
          <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingCart className="size-4 text-primary-text" />
                New Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold tabular-nums">{newOrdersCount}</p>
                {newOrdersCount > 0 && (
                  <Badge variant="secondary">{newOrdersCount} new</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Since last login
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Overdue Invoices */}
        <Link href="/admin/invoices" className="block">
          <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Receipt className="size-4 text-primary-text" />
                Overdue Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">--</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Loaded via Stripe (client-side)
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* At-Risk Customers */}
        <Link href="/admin/customers?status=active" className="block">
          <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 text-primary-text" />
                At-Risk Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold tabular-nums">{atRiskCount}</p>
                {atRiskCount > 0 && (
                  <Badge variant="destructive">{atRiskCount} at risk</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                No order in {atRiskThreshold}+ days
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 30-Day Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              30-Day Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold">{summary.ordersCount}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCents(Number(summary.revenue))}
                </p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.newAccountsApproved}</p>
                <p className="text-sm text-muted-foreground">New Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

