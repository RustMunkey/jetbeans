"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import { bulkModerate } from "./actions"

interface Review {
	id: string
	rating: number
	title: string | null
	body: string | null
	status: string
	isVerifiedPurchase: boolean | null
	helpfulCount: number | null
	reportCount: number | null
	createdAt: Date
	productName: string | null
	productId: string
	customerName: string | null
	customerEmail: string | null
}

interface ReviewsTableProps {
	reviews: Review[]
	totalCount: number
	currentPage: number
	currentStatus?: string
}

function Stars({ rating }: { rating: number }) {
	return (
		<span className="text-amber-500 text-xs">
			{"★".repeat(rating)}{"☆".repeat(5 - rating)}
		</span>
	)
}

export function ReviewsTable({ reviews, totalCount, currentPage, currentStatus }: ReviewsTableProps) {
	const router = useRouter()
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [loading, setLoading] = useState(false)

	const columns: Column<Review>[] = [
		{
			key: "product",
			header: "Product",
			cell: (row) => (
				<span className="text-sm">{row.productName ?? "—"}</span>
			),
		},
		{
			key: "customer",
			header: "Customer",
			cell: (row) => (
				<div>
					<span className="text-sm">{row.customerName ?? "—"}</span>
					{row.isVerifiedPurchase && (
						<span className="ml-1 text-[10px] text-green-600">Verified</span>
					)}
				</div>
			),
		},
		{
			key: "rating",
			header: "Rating",
			cell: (row) => <Stars rating={row.rating} />,
		},
		{
			key: "body",
			header: "Review",
			cell: (row) => (
				<span className="text-xs text-muted-foreground truncate max-w-[200px] inline-block">
					{row.title || row.body || "—"}
				</span>
			),
		},
		{
			key: "status",
			header: "Status",
			cell: (row) => <StatusBadge status={row.status} type="review" />,
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

	const handleBulk = async (action: "approved" | "rejected") => {
		setLoading(true)
		try {
			await bulkModerate(selectedIds, action)
			setSelectedIds([])
			router.refresh()
			toast.success(`${selectedIds.length} review(s) ${action}`)
		} catch (e: any) {
			toast.error(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<DataTable
			columns={columns}
			data={reviews}
			totalCount={totalCount}
			currentPage={currentPage}
			pageSize={20}
			selectable
			selectedIds={selectedIds}
			onSelectionChange={setSelectedIds}
			getId={(row) => row.id}
			onRowClick={(row) => router.push(`/reviews/${row.id}`)}
			emptyMessage="No reviews yet"
			emptyDescription="Customer reviews will appear here for moderation."
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
						router.push(`/reviews?${params.toString()}`)
					}}
				>
					<SelectTrigger className="h-9 w-full sm:w-[140px]">
						<SelectValue placeholder="All Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="approved">Approved</SelectItem>
						<SelectItem value="rejected">Rejected</SelectItem>
						<SelectItem value="reported">Reported</SelectItem>
					</SelectContent>
				</Select>
			}
			bulkActions={
				<div className="flex gap-2 w-full sm:w-auto">
					<Button size="sm" variant="outline" className="flex-1 sm:flex-initial" disabled={loading} onClick={() => handleBulk("approved")}>
						Approve
					</Button>
					<Button size="sm" variant="destructive" className="flex-1 sm:flex-initial" disabled={loading} onClick={() => handleBulk("rejected")}>
						Reject
					</Button>
				</div>
			}
		/>
	)
}
