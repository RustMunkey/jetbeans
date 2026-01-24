"use client"

import { useRouter } from "next/navigation"
import { DataTable, type Column } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/format"

interface Order {
	id: string
	orderNumber: string
	status: string
	total: string
	customerName: string | null
	customerEmail: string | null
	createdAt: Date
}

interface OrdersTableProps {
	orders: Order[]
	totalCount: number
	currentPage: number
	currentStatus?: string
}

const statuses = [
	"pending", "confirmed", "processing", "packed",
	"shipped", "delivered", "cancelled", "refunded",
	"partially_refunded", "returned",
]

export function OrdersTable({ orders, totalCount, currentPage, currentStatus }: OrdersTableProps) {
	const router = useRouter()

	const columns: Column<Order>[] = [
		{
			key: "orderNumber",
			header: "Order",
			cell: (row) => <span className="font-medium">#{row.orderNumber}</span>,
		},
		{
			key: "customer",
			header: "Customer",
			cell: (row) => (
				<div>
					<span className="text-sm">{row.customerName ?? "—"}</span>
					{row.customerEmail && (
						<p className="text-xs text-muted-foreground">{row.customerEmail}</p>
					)}
				</div>
			),
		},
		{
			key: "status",
			header: "Status",
			cell: (row) => <StatusBadge status={row.status} type="order" />,
		},
		{
			key: "total",
			header: "Total",
			cell: (row) => formatCurrency(row.total),
		},
		{
			key: "createdAt",
			header: "Date",
			cell: (row) => (
				<span className="text-xs text-muted-foreground">
					{formatDate(row.createdAt)}
				</span>
			),
		},
	]

	return (
		<DataTable
			columns={columns}
			data={orders}
			searchPlaceholder="Search orders..."
			totalCount={totalCount}
			currentPage={currentPage}
			pageSize={20}
			getId={(row) => row.id}
			onRowClick={(row) => router.push(`/orders/${row.id}`)}
			emptyMessage="No orders yet"
			emptyDescription="Orders will appear here when customers make purchases."
			filters={
				<Select
					value={currentStatus ?? "all"}
					onValueChange={(value) => {
						const params = new URLSearchParams(window.location.search)
						if (value && value !== "all") {
							params.set("status", value)
						} else {
							params.delete("status")
						}
						params.delete("page")
						router.push(`/orders?${params.toString()}`)
					}}
				>
					<SelectTrigger className="h-9 w-full sm:w-[160px]">
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						{statuses.map((s) => (
							<SelectItem key={s} value={s}>
								{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			}
		/>
	)
}
