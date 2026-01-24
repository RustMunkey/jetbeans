"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type RevenuePoint = { date: string; revenue: number }
type OrdersPoint = { date: string; orders: number }
type CategoryPoint = { name: string; revenue: number }

const revenueConfig = {
  revenue: { label: "Revenue", color: "oklch(0.55 0.15 35)" },
} satisfies ChartConfig

const ordersConfig = {
  orders: { label: "Orders", color: "oklch(0.60 0.12 45)" },
} satisfies ChartConfig

const categoryConfig = {
  revenue: { label: "Revenue", color: "oklch(0.55 0.15 35)" },
} satisfies ChartConfig

const categoryColors = [
  "oklch(0.55 0.15 35)",
  "oklch(0.60 0.12 45)",
  "oklch(0.65 0.10 55)",
  "oklch(0.70 0.08 65)",
  "oklch(0.75 0.06 75)",
]

function formatDateTick(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`
  return `$${value}`
}

function EmptyChart({ height = "h-[220px]" }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center`}>
      <p className="text-sm text-muted-foreground">No data yet</p>
    </div>
  )
}

export function AnalyticsCharts({
  revenueData,
  ordersData,
  categoryData,
}: {
  revenueData: RevenuePoint[]
  ordersData: OrdersPoint[]
  categoryData: CategoryPoint[]
}) {
  return (
    <div className="space-y-4">
      {/* Revenue + Orders side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 min-w-0 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Revenue Trend</h3>
            <p className="text-xs text-muted-foreground">Daily revenue</p>
          </div>
          {revenueData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ChartContainer config={revenueConfig} className="h-[280px] sm:h-[250px] w-full">
              <AreaChart data={revenueData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                <defs>
                  <linearGradient id="analyticsRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                  tickFormatter={formatDateTick}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tickFormatter={formatCompactCurrency}
                  fontSize={12}
                  width={45}
                />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  fill="url(#analyticsRevenueGradient)"
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 min-w-0 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Orders</h3>
            <p className="text-xs text-muted-foreground">Daily order count</p>
          </div>
          {ordersData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ChartContainer config={ordersConfig} className="h-[280px] sm:h-[250px] w-full">
              <BarChart data={ordersData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                  tickFormatter={formatDateTick}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  fontSize={12}
                  width={30}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="orders"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                >
                  {ordersData.map((_, i) => (
                    <Cell key={i} fill={categoryColors[i % categoryColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </div>

      {/* Sales by Category */}
      <div className="rounded-xl border bg-card p-4 min-w-0 overflow-hidden">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Sales by Category</h3>
          <p className="text-xs text-muted-foreground">Revenue breakdown by product category</p>
        </div>
        {categoryData.length === 0 ? (
          <EmptyChart height="h-[250px]" />
        ) : (
          <ChartContainer config={categoryConfig} className="h-[280px] sm:h-[250px] w-full">
            <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactCurrency}
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={80}
                fontSize={12}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />} />
              <Bar
                dataKey="revenue"
                radius={[0, 4, 4, 0]}
                animationDuration={1400}
                animationEasing="ease-in-out"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={categoryColors[i % categoryColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}
