"use client"

import { useState } from "react"
import { DataTable, type Column } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/format"

interface Call {
	id: string
	type: string
	status: string
	isGroup: boolean | null
	startedAt: Date | null
	endedAt: Date | null
	createdAt: Date
	endReason: string | null
	durationSeconds: number | null
	initiatorId: string
	initiatorName: string | null
}

interface CallsTableProps {
	calls: Call[]
	totalCount: number
}

function formatDuration(seconds: number | null) {
	if (!seconds) return "—"
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, "0")}`
}

function getStatusBadge(status: string) {
	switch (status) {
		case "connected":
		case "ended":
			return <Badge className="bg-green-600 hover:bg-green-600">{status === "connected" ? "Active" : "Completed"}</Badge>
		case "ringing":
			return <Badge variant="outline">Ringing</Badge>
		case "missed":
			return <Badge variant="destructive">Missed</Badge>
		case "declined":
			return <Badge variant="destructive">Declined</Badge>
		case "failed":
			return <Badge variant="destructive">Failed</Badge>
		default:
			return <Badge variant="secondary">{status}</Badge>
	}
}

export function CallsTable({ calls, totalCount }: CallsTableProps) {
	const [statusFilter, setStatusFilter] = useState("all")

	const filtered = statusFilter === "all"
		? calls
		: calls.filter((c) => c.status === statusFilter)

	const columns: Column<Call>[] = [
		{
			key: "initiator",
			header: "From",
			cell: (row) => (
				<span className="text-sm font-medium">{row.initiatorName || "Unknown"}</span>
			),
		},
		{
			key: "type",
			header: "Type",
			cell: (row) => (
				<Badge variant="secondary" className="text-[10px] capitalize">
					{row.type}{row.isGroup ? " (Group)" : ""}
				</Badge>
			),
		},
		{
			key: "status",
			header: "Status",
			cell: (row) => getStatusBadge(row.status),
		},
		{
			key: "duration",
			header: "Duration",
			cell: (row) => (
				<span className="text-sm text-muted-foreground">{formatDuration(row.durationSeconds)}</span>
			),
		},
		{
			key: "createdAt",
			header: "Date",
			cell: (row) => (
				<span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
			),
		},
	]

	return (
		<DataTable
			columns={columns}
			data={filtered}
			totalCount={totalCount}
			searchPlaceholder="Search calls..."
			getId={(row) => row.id}
			emptyMessage="No calls yet"
			emptyDescription="Your call history will appear here."
			filters={
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="h-9 w-full sm:w-[140px]">
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="ended">Completed</SelectItem>
						<SelectItem value="missed">Missed</SelectItem>
						<SelectItem value="declined">Declined</SelectItem>
					</SelectContent>
				</Select>
			}
		/>
	)
}
