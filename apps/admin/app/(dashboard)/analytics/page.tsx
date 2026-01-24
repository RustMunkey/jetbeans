import { HugeiconsIcon } from "@hugeicons/react"
import {
  DollarCircleIcon,
  ShoppingBag01Icon,
  UserGroupIcon,
  CreditCardIcon,
  MouseLeftClick01Icon,
  DeliveryReturn01Icon,
} from "@hugeicons/core-free-icons"
import { AnalyticsCharts } from "./analytics-charts"
import {
  getRevenueStats,
  getOrderCount,
  getAvgOrderValue,
  getNewCustomers,
  getRevenueOverTime,
  getOrdersOverTime,
  getRevenueByCategory,
} from "@/lib/analytics"

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) return <span className="text-xs text-muted-foreground">No change</span>
  const isUp = change > 0
  return (
    <span className={`text-xs ${isUp ? "text-stat-up" : "text-stat-down"}`}>
      {isUp ? "+" : ""}{change}% vs prev period
    </span>
  )
}

export default async function AnalyticsOverviewPage() {
  const range = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }

  const [revenue, orders, avgOrder, newCustomers, revenueOverTime, ordersOverTime, categoryBreakdown] =
    await Promise.all([
      getRevenueStats(range),
      getOrderCount(range),
      getAvgOrderValue(range),
      getNewCustomers(range),
      getRevenueOverTime(range),
      getOrdersOverTime(range),
      getRevenueByCategory(range),
    ])

  const stats = [
    { label: "Total Revenue", icon: DollarCircleIcon, value: formatCurrency(revenue.value), change: revenue.change },
    { label: "Total Orders", icon: ShoppingBag01Icon, value: orders.value.toLocaleString(), change: orders.change },
    { label: "Avg Order Value", icon: CreditCardIcon, value: formatCurrency(avgOrder.value), change: avgOrder.change },
    { label: "New Customers", icon: UserGroupIcon, value: newCustomers.value.toLocaleString(), change: newCustomers.change },
    { label: "Conversion Rate", icon: MouseLeftClick01Icon, value: "—", change: 0 },
    { label: "Return Rate", icon: DeliveryReturn01Icon, value: "—", change: 0 },
  ]

  const revenueData = revenueOverTime.map((p) => ({ date: p.date, revenue: p.value }))
  const ordersData = ordersOverTime.map((p) => ({ date: p.date, orders: p.value }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h2 className="text-lg font-semibold">Analytics Overview</h2>
        <p className="text-sm text-muted-foreground">
          Store performance for the last 30 days.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Charts */}
      <AnalyticsCharts
        revenueData={revenueData}
        ordersData={ordersData}
        categoryData={categoryBreakdown}
      />
    </div>
  )
}
