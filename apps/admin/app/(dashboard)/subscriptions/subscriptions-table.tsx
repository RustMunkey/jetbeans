"use client"

import { useRouter } from "next/navigation"
import { DataTable, type Column } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/format"

interface Subscription {
	id: string
	userId: string
	status: string
	frequency: string
	pricePerDelivery: string
	nextDeliveryAt: Date | null
	lastDeliveryAt: Date | null
	totalDeliveries: number | null
	cancelledAt: Date | null
	cancellationReason: string | null
	createdAt: Date
	customerName: string | null
	customerEmail: string | null
}

interface SubscriptionsTableProps {
	subscriptions: Subscription[]
	totalCount: number
	currentPage: number
	currentStatus?: string
	basePath?: string
	title?: string
	description?: string
}

const statuses = ["active", "paused", "cancelled", "dunning"]

export function SubscriptionsTable({
	subscriptions,
	totalCount,
	currentPage,
	currentStatus,
	basePath = "/subscriptions",
	title = "Subscriptions",
	description = "Manage recurring delivery subscriptions.",
}: SubscriptionsTableProps) {
	const router = useRouter()

	const columns: Column<Subscription>[] = [
		{
			key: "customer",
			header: "Customer",
			cell: (row) => (
				<div>
					<span className="text-sm font-medium">{row.customerName ?? "—"}</span>
					{row.customerEmail && (
						<p className="text-xs text-muted-foreground">{row.customerEmail}</p>
					)}
				</div>
			),
		},
		{
			key: "status",
			header: "Status",
			cell: (row) => <StatusBadge status={row.status} type="subscription" />,
		},
		{
			key: "frequency",
			header: "Frequency",
			cell: (row) => (
				<span className="text-sm capitalize">{row.frequency.replace(/_/g, " ")}</span>
			),
		},
		{
			key: "price",
			header: "Price",
			cell: (row) => (
				<span className="text-sm">{formatCurrency(row.pricePerDelivery)}</span>
			),
		},
		{
			key: "nextDelivery",
			header: "Next Delivery",
			cell: (row) => (
				<span className="text-xs text-muted-foreground">
					{row.nextDeliveryAt ? formatDate(row.nextDeliveryAt) : "—"}
				</span>
			),
		},
		{
			key: "deliveries",
			header: "Deliveries",
			cell: (row) => (
				<span className="text-sm">{row.totalDeliveries ?? 0}</span>
			),
		},
		{
			key: "createdAt",
			header: "Started",
			cell: (row) => (
				<span className="text-xs text-muted-foreground">
					{formatDate(row.createdAt)}
				</span>
			),
		},
	]

	return (
		<>
		<div>
			<h2 className="text-lg font-semibold">{title}</h2>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
		<DataTable
			columns={columns}
			data={subscriptions}
			searchPlaceholder="Search subscriptions..."
			totalCount={totalCount}
			currentPage={currentPage}
			pageSize={20}
			getId={(row) => row.id}
			onRowClick={(row) => router.push(`/subscriptions/${row.id}`)}
			emptyMessage="No subscriptions"
			emptyDescription="Subscriptions will appear here."
			filters={
				<Select
					value={currentStatus ?? "all"}
					onValueChange={(value) => {
						if (value === "all") {
							router.push("/subscriptions")
						} else if (value === "cancelled") {
							router.push("/subscriptions/canceled")
						} else {
							router.push(`/subscriptions/${value}`)
						}
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
		</>
	)
}
