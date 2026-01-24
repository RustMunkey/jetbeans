"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DataTable, type Column } from "@/components/data-table"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/format"

interface Customer {
	id: string
	name: string
	email: string
	image: string | null
	phone: string | null
	createdAt: Date
	orderCount: number
	totalSpent: string
	lastOrderAt: Date | null
}

interface CustomersTableProps {
	customers: Customer[]
	totalCount: number
	currentPage: number
}

export function CustomersTable({ customers, totalCount, currentPage }: CustomersTableProps) {
	const router = useRouter()
	const [activityFilter, setActivityFilter] = useState("all")

	const columns: Column<Customer>[] = [
		{
			key: "name",
			header: "Customer",
			cell: (row) => (
				<div>
					<span className="text-sm font-medium">{row.name}</span>
					<p className="text-xs text-muted-foreground">{row.email}</p>
				</div>
			),
		},
		{
			key: "orders",
			header: "Orders",
			cell: (row) => <span className="text-sm">{row.orderCount}</span>,
		},
		{
			key: "spent",
			header: "Total Spent",
			cell: (row) => <span className="text-sm">{formatCurrency(row.totalSpent)}</span>,
		},
		{
			key: "lastOrder",
			header: "Last Order",
			cell: (row) => (
				<span className="text-xs text-muted-foreground">
					{row.lastOrderAt ? formatDate(row.lastOrderAt) : "Never"}
				</span>
			),
		},
		{
			key: "joined",
			header: "Joined",
			cell: (row) => (
				<span className="text-xs text-muted-foreground">
					{formatDate(row.createdAt)}
				</span>
			),
		},
	]

	const filtered = activityFilter === "all"
		? customers
		: activityFilter === "active"
			? customers.filter((c) => c.orderCount > 0)
			: customers.filter((c) => c.orderCount === 0)

	return (
		<DataTable
			columns={columns}
			data={filtered}
			searchPlaceholder="Search customers..."
			totalCount={totalCount}
			currentPage={currentPage}
			pageSize={20}
			getId={(row) => row.id}
			onRowClick={(row) => router.push(`/customers/${row.id}`)}
			emptyMessage="No customers yet"
			emptyDescription="Customers will appear here when they create accounts."
			filters={
				<Select value={activityFilter} onValueChange={setActivityFilter}>
					<SelectTrigger className="h-9 w-full sm:w-[150px]">
						<SelectValue placeholder="All Customers" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Customers</SelectItem>
						<SelectItem value="active">Has Orders</SelectItem>
						<SelectItem value="inactive">No Orders</SelectItem>
					</SelectContent>
				</Select>
			}
		/>
	)
}
