"use client"

import { useState } from "react"
import { DataTable, type Column } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { formatDate } from "@/lib/format"

interface LogItem {
	id: string
	variantId: string
	previousQuantity: number
	newQuantity: number
	reason: string
	orderId: string | null
	createdAt: Date
	variantName: string
	variantSku: string
	productName: string
}

export function ActivityClient({ items, totalCount, currentPage }: {
	items: LogItem[]
	totalCount: number
	currentPage: number
}) {
	const [reasonFilter, setReasonFilter] = useState("all")
	const columns: Column<LogItem>[] = [
		{
			key: "product",
			header: "Product",
			cell: (row) => (
				<div>
					<span className="text-sm font-medium">{row.productName}</span>
					<span className="block text-xs text-muted-foreground">{row.variantName}</span>
				</div>
			),
		},
		{
			key: "sku",
			header: "SKU",
			cell: (row) => (
				<span className="text-xs text-muted-foreground font-mono">{row.variantSku}</span>
			),
		},
		{
			key: "change",
			header: "Change",
			cell: (row) => {
				const diff = row.newQuantity - row.previousQuantity
				return (
					<div className="flex items-center gap-1.5">
						<span className="text-xs text-muted-foreground">{row.previousQuantity}</span>
						<span className="text-muted-foreground">→</span>
						<span className="text-sm font-medium">{row.newQuantity}</span>
						<Badge
							variant="secondary"
							className={`text-[10px] px-1 py-0 border-0 ${
								diff > 0
									? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
									: diff < 0
										? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
										: ""
							}`}
						>
							{diff > 0 ? `+${diff}` : diff}
						</Badge>
					</div>
				)
			},
		},
		{
			key: "reason",
			header: "Reason",
			cell: (row) => (
				<div>
					<span className="text-sm">{row.reason}</span>
					{row.orderId && (
						<span className="block text-[10px] text-muted-foreground font-mono">
							Order: {row.orderId.slice(0, 8)}...
						</span>
					)}
				</div>
			),
		},
		{
			key: "date",
			header: "Date",
			cell: (row) => (
				<span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
			),
		},
	]

	const filteredItems = reasonFilter === "all"
		? items
		: items.filter((i) => i.reason.toLowerCase().includes(reasonFilter))

	return (
		<DataTable
			columns={columns}
			data={filteredItems}
			searchPlaceholder="Search activity..."
			totalCount={totalCount}
			currentPage={currentPage}
			pageSize={30}
			getId={(row) => row.id}
			emptyMessage="No inventory activity"
			emptyDescription="Stock changes will be logged here."
			filters={
				<Select value={reasonFilter} onValueChange={setReasonFilter}>
					<SelectTrigger className="h-9 w-full sm:w-[160px]">
						<SelectValue placeholder="All Reasons" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Reasons</SelectItem>
						<SelectItem value="restock">Restock</SelectItem>
						<SelectItem value="order">Order Fulfilled</SelectItem>
						<SelectItem value="damaged">Damaged</SelectItem>
						<SelectItem value="correction">Correction</SelectItem>
						<SelectItem value="supplier">Supplier Shipment</SelectItem>
						<SelectItem value="returned">Returned</SelectItem>
					</SelectContent>
				</Select>
			}
		/>
	)
}
