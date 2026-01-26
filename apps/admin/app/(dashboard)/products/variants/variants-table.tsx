"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
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

interface VariantsTableProps {
	variants: Variant[]
	totalCount: number
	currentPage: number
	currentFilter?: string
}

export function VariantsTable({ variants, totalCount, currentPage, currentFilter }: VariantsTableProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const updateFilter = (value: string) => {
		const params = new URLSearchParams(searchParams.toString())
		if (value === "all") {
			params.delete("filter")
		} else {
			params.set("filter", value)
		}
		params.delete("page") // Reset to page 1 on filter change
		router.push(`${pathname}?${params.toString()}`)
	}

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
			data={variants}
			totalCount={totalCount}
			currentPage={currentPage}
			pageSize={30}
			searchPlaceholder="Search variants..."
			getId={(row) => row.id}
			onRowClick={(row) => router.push(`/products/${row.productId}`)}
			emptyMessage="No variants yet"
			emptyDescription="Variants are created from product pages."
			filters={
				<Select value={currentFilter || "all"} onValueChange={updateFilter}>
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
