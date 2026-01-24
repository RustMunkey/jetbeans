"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DataTable, type Column } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { formatCurrency } from "@/lib/format"

interface Variant {
	id: string
	name: string
	sku: string
	price: string | null
	productId: string
	productName: string | null
	quantity: number | null
	lowStockThreshold: number | null
}

export function VariantsTable({ variants }: { variants: Variant[] }) {
	const router = useRouter()
	const [stockFilter, setStockFilter] = useState("all")

	const filtered = stockFilter === "all"
		? variants
		: variants.filter((v) => {
			const qty = v.quantity ?? 0
			const threshold = v.lowStockThreshold ?? 10
			if (stockFilter === "out") return qty === 0
			if (stockFilter === "low") return qty > 0 && qty <= threshold
			if (stockFilter === "in") return qty > threshold
			return true
		})

	const columns: Column<Variant>[] = [
		{
			key: "productName",
			header: "Product",
			cell: (row) => (
				<span className="text-sm truncate max-w-[150px] inline-block">{row.productName ?? "—"}</span>
			),
		},
		{
			key: "name",
			header: "Variant",
			cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
		},
		{
			key: "sku",
			header: "SKU",
			cell: (row) => <span className="text-xs text-muted-foreground">{row.sku}</span>,
		},
		{
			key: "price",
			header: "Price",
			cell: (row) => row.price ? formatCurrency(row.price) : "—",
		},
		{
			key: "stock",
			header: "Stock",
			cell: (row) => {
				const qty = row.quantity ?? 0
				const threshold = row.lowStockThreshold ?? 10
				if (qty === 0) {
					return <Badge variant="destructive" className="text-[10px]">Out of stock</Badge>
				}
				if (qty <= threshold) {
					return (
						<Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
							Low: {qty}
						</Badge>
					)
				}
				return <span className="text-xs text-muted-foreground">{qty} in stock</span>
			},
		},
	]

	return (
		<DataTable
			columns={columns}
			data={filtered}
			searchPlaceholder="Search variants..."
			getId={(row) => row.id}
			onRowClick={(row) => router.push(`/products/${row.productId}`)}
			emptyMessage="No variants yet"
			emptyDescription="Variants are created from product pages."
			filters={
				<Select value={stockFilter} onValueChange={setStockFilter}>
					<SelectTrigger className="h-9 w-full sm:w-[150px]">
						<SelectValue placeholder="All Stock" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Stock</SelectItem>
						<SelectItem value="in">In Stock</SelectItem>
						<SelectItem value="low">Low Stock</SelectItem>
						<SelectItem value="out">Out of Stock</SelectItem>
					</SelectContent>
				</Select>
			}
		/>
	)
}
