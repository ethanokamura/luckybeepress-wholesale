import {
  getBestSellers,
  getCategoryPerformance,
  getCustomerLifetimeValue,
  getSeasonalTrends,
  getAtRiskCustomers,
  getRevenueForecast,
  getSeasonalPlanner,
  getPlatformSettings,
} from "@/lib/admin/queries";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatCentsFromString(value: string | null): string {
  if (!value) return "$0.00";
  const cents = parseInt(value, 10);
  if (isNaN(cents)) return "$0.00";
  return formatCents(cents);
}

export default async function AdminAnalyticsPage() {
  const [
    bestSellers,
    categoryPerformance,
    customerLTV,
    seasonalTrends,
    atRiskCustomers,
    revenueForecast,
    seasonalPlanner,
    platformSettings,
  ] = await Promise.all([
    getBestSellers(90),
    getCategoryPerformance(90),
    getCustomerLifetimeValue(),
    getSeasonalTrends(),
    getAtRiskCustomers(60),
    getRevenueForecast(),
    getSeasonalPlanner(),
    getPlatformSettings(),
  ]);

  // Revenue forecast projections
  const monthlyRevenues = revenueForecast.monthlyRevenue.map((m) =>
    parseInt(m.revenue ?? "0", 10),
  );
  const avgMonthlyRevenue =
    monthlyRevenues.length > 0
      ? monthlyRevenues.reduce((a, b) => a + b, 0) / monthlyRevenues.length
      : 0;
  const forecast30 = Math.round(avgMonthlyRevenue);
  const forecast60 = Math.round(avgMonthlyRevenue * 2);
  const forecast90 = Math.round(avgMonthlyRevenue * 3);

  // Build seasonal trends matrix
  const trendMonths = [...new Set(seasonalTrends.map((t) => t.month))].sort();
  const trendCategories = [
    ...new Set(seasonalTrends.map((t) => t.categoryName)),
  ].sort();
  const trendMap = new Map<string, number>();
  for (const t of seasonalTrends) {
    trendMap.set(`${t.month}::${t.categoryName}`, t.totalUnits ?? 0);
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Analytics &amp; Reporting</h1>

      {/* Revenue Forecast */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Revenue Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">30-Day Projection</p>
            <p className="text-2xl font-bold font-mono">
              {formatCents(forecast30)}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">60-Day Projection</p>
            <p className="text-2xl font-bold font-mono">
              {formatCents(forecast60)}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">90-Day Projection</p>
            <p className="text-2xl font-bold font-mono">
              {formatCents(forecast90)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Active Customers</p>
            <p className="text-2xl font-bold">
              {revenueForecast.activeCustomerCount}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              Returning Customers
            </p>
            <p className="text-2xl font-bold">
              {revenueForecast.returningCustomerStats.length}
            </p>
          </div>
        </div>

        {/* Monthly Revenue History */}
        {revenueForecast.monthlyRevenue.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Month</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue</th>
                  <th className="px-4 py-2 text-right font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {revenueForecast.monthlyRevenue.map((m) => (
                  <tr key={m.month} className="border-b last:border-0">
                    <td className="px-4 py-2">{m.month}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCentsFromString(m.revenue)}
                    </td>
                    <td className="px-4 py-2 text-right">{m.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Best Sellers (90 days) */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Best Sellers (Last 90 Days)</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Product</th>
                <th className="px-4 py-2 text-right font-medium">Units Sold</th>
                <th className="px-4 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No data available.
                  </td>
                </tr>
              ) : (
                bestSellers.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-2">{item.productName}</td>
                    <td className="px-4 py-2 text-right">
                      {item.totalUnits}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCentsFromString(item.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category Performance */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Category Performance (Last 90 Days)
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Category</th>
                <th className="px-4 py-2 text-right font-medium">Units</th>
                <th className="px-4 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {categoryPerformance.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No data available.
                  </td>
                </tr>
              ) : (
                categoryPerformance.map((item) => (
                  <tr
                    key={item.categoryId}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-2">{item.categoryName}</td>
                    <td className="px-4 py-2 text-right">{item.totalUnits}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCentsFromString(item.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Customer Lifetime Value */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Customer Lifetime Value</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Business</th>
                <th className="px-4 py-2 text-left font-medium">Contact</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-right font-medium">Orders</th>
                <th className="px-4 py-2 text-right font-medium">
                  Total Spent
                </th>
              </tr>
            </thead>
            <tbody>
              {customerLTV.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No data available.
                  </td>
                </tr>
              ) : (
                customerLTV.map((c) => (
                  <tr
                    key={c.userId}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-2 font-medium">
                      {c.businessName}
                    </td>
                    <td className="px-4 py-2">{c.ownerName}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {c.email}
                    </td>
                    <td className="px-4 py-2 text-right">{c.orderCount}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCentsFromString(c.totalSpent)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* At-Risk Customers */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          At-Risk Customers (60+ days inactive)
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Business</th>
                <th className="px-4 py-2 text-left font-medium">Contact</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-right font-medium">Orders</th>
                <th className="px-4 py-2 text-right font-medium">
                  Total Spent
                </th>
                <th className="px-4 py-2 text-left font-medium">
                  Last Order
                </th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No at-risk customers.
                  </td>
                </tr>
              ) : (
                atRiskCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-2 font-medium">
                      {c.businessName}
                    </td>
                    <td className="px-4 py-2">{c.ownerName}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {c.email}
                    </td>
                    <td className="px-4 py-2 text-right">{c.orderCount}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCentsFromString(c.totalSpent)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {c.lastOrderDate
                        ? new Date(c.lastOrderDate).toLocaleDateString()
                        : "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Seasonal Trends Matrix */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Seasonal Trends (Units Sold - Last 12 Months)
        </h2>
        {trendMonths.length === 0 ? (
          <div className="rounded-md border p-6 text-center text-muted-foreground text-sm">
            No seasonal data available.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Category</th>
                  {trendMonths.map((m) => (
                    <th
                      key={m}
                      className="px-3 py-2 text-right font-medium whitespace-nowrap"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trendCategories.map((cat) => (
                  <tr key={cat} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {cat}
                    </td>
                    {trendMonths.map((m) => {
                      const val = trendMap.get(`${m}::${cat}`) ?? 0;
                      return (
                        <td
                          key={m}
                          className={`px-3 py-2 text-right ${
                            val > 0 ? "" : "text-muted-foreground"
                          }`}
                        >
                          {val || "--"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Platform Settings Reference */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Platform Settings</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Key</th>
                <th className="px-4 py-2 text-left font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {platformSettings.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No settings configured.
                  </td>
                </tr>
              ) : (
                platformSettings.map((s) => (
                  <tr key={s.key} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{s.key}</td>
                    <td className="px-4 py-2">{s.value}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
