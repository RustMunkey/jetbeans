import { HugeiconsIcon } from "@hugeicons/react"
import {
  DollarCircleIcon,
  ShoppingBag01Icon,
  RepeatIcon,
  Invoice02Icon,
} from "@hugeicons/core-free-icons"
import { RevenueChart } from "./dashboard-charts"
import {
  getRevenueStats,
  getOrderCount,
  getMRR,
  getActiveSubscriptions,
  getRevenueOverTime,
  getRecentOrders,
  getTopProducts,
  getPendingOrdersCount,
} from "@/lib/analytics"

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) return <span className="text-xs text-muted-foreground">No change</span>
  const isUp = change > 0
  return (
    <span className={`text-xs ${isUp ? "text-stat-up" : "text-stat-down"}`}>
      {isUp ? "+" : ""}{change}%
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    refunded: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  )
}

export default async function DashboardPage() {
  const range = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }

  const [revenue, orderCount, mrr, activeSubs, pendingOrders, revenueOverTime, recentOrders, topProducts] =
    await Promise.all([
      getRevenueStats(range),
      getOrderCount(range),
      getMRR(),
      getActiveSubscriptions(),
      getPendingOrdersCount(),
      getRevenueOverTime(range),
      getRecentOrders(5),
      getTopProducts(range),
    ])

  const stats = [
    { label: "Revenue (30d)", icon: DollarCircleIcon, value: formatCurrency(revenue.value), change: revenue.change },
    { label: "Orders (30d)", icon: ShoppingBag01Icon, value: orderCount.value.toLocaleString(), change: orderCount.change },
    { label: "MRR", icon: RepeatIcon, value: formatCurrency(mrr.value), change: mrr.change },
    { label: "Pending Orders", icon: Invoice02Icon, value: pendingOrders.toLocaleString(), change: 0 },
  ]

  const chartData = revenueOverTime.map((p) => ({ date: p.date, revenue: p.value }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of your store performance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <HugeiconsIcon icon={stat.icon} size={16} className="text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
              <ChangeIndicator change={stat.change} />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Revenue</h3>
          <p className="text-xs text-muted-foreground">Daily revenue over the last 30 days</p>
        </div>
        <RevenueChart data={chartData} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Recent Orders</h3>
            <p className="text-xs text-muted-foreground">Latest orders from your store</p>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Top Products</h3>
            <p className="text-xs text-muted-foreground">Best sellers this month</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No products yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{product.units} units</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
