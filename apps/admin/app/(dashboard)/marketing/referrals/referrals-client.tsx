"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/data-table"
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/format"

interface Referral {
	id: string
	referrerId: string
	referredId: string
	referralCode: string
	status: string
	rewardAmount: string | null
	rewardType: string | null
	completedAt: Date | null
	createdAt: Date
	referrerName: string | null
	referrerEmail: string | null
	referredName: string | null
	referredEmail: string | null
}

interface ReferralCode {
	id: string
	userId: string
	code: string
	totalReferrals: number | null
	totalEarnings: string | null
	createdAt: Date
	userName: string | null
	userEmail: string | null
}

const statusColors: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
	rewarded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

export function ReferralsClient({ referrals, codes }: { referrals: Referral[]; codes: ReferralCode[] }) {
	const [tab, setTab] = useState<"referrals" | "codes">("referrals")
	const [statusFilter, setStatusFilter] = useState("all")

	const filteredReferrals = statusFilter === "all"
		? referrals
		: referrals.filter((r) => r.status === statusFilter)

	const referralColumns: Column<Referral>[] = [
		{
			key: "referrer",
			header: "Referrer",
			cell: (row) => (
				<div>
					<span className="text-sm font-medium">{row.referrerName ?? "—"}</span>
					{row.referrerEmail && <p className="text-xs text-muted-foreground">{row.referrerEmail}</p>}
				</div>
			),
		},
		{
			key: "referred",
			header: "Referred",
			cell: (row) => (
				<div>
					<span className="text-sm font-medium">{row.referredName ?? "—"}</span>
					{row.referredEmail && <p className="text-xs text-muted-foreground">{row.referredEmail}</p>}
				</div>
			),
		},
		{
			key: "code",
			header: "Code",
			cell: (row) => <span className="text-xs font-mono text-muted-foreground">{row.referralCode}</span>,
		},
		{
			key: "status",
			header: "Status",
			cell: (row) => (
				<Badge variant="secondary" className={`text-[11px] px-1.5 py-0 border-0 ${statusColors[row.status] ?? ""}`}>
					{row.status.charAt(0).toUpperCase() + row.status.slice(1)}
				</Badge>
			),
		},
		{
			key: "reward",
			header: "Reward",
			cell: (row) => (
				<span className="text-sm">
					{row.rewardAmount ? `${formatCurrency(row.rewardAmount)} (${row.rewardType})` : "—"}
				</span>
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

	const codeColumns: Column<ReferralCode>[] = [
		{
			key: "user",
			header: "User",
			cell: (row) => (
				<div>
					<span className="text-sm font-medium">{row.userName ?? "—"}</span>
					{row.userEmail && <p className="text-xs text-muted-foreground">{row.userEmail}</p>}
				</div>
			),
		},
		{
			key: "code",
			header: "Code",
			cell: (row) => <span className="text-sm font-mono font-medium">{row.code}</span>,
		},
		{
			key: "referrals",
			header: "Referrals",
			cell: (row) => <span className="text-sm">{row.totalReferrals ?? 0}</span>,
		},
		{
			key: "earnings",
			header: "Earnings",
			cell: (row) => (
				<span className="text-sm font-medium">
					{row.totalEarnings ? formatCurrency(row.totalEarnings) : "$0.00"}
				</span>
			),
		},
		{
			key: "created",
			header: "Created",
			cell: (row) => (
				<span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
			),
		},
	]

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Referrals</h2>
					<p className="text-sm text-muted-foreground">Track customer referrals and reward codes.</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						className={`text-sm px-3 py-1.5 rounded-md transition-colors ${tab === "referrals" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
						onClick={() => setTab("referrals")}
					>
						Referrals
					</button>
					<button
						className={`text-sm px-3 py-1.5 rounded-md transition-colors ${tab === "codes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
						onClick={() => setTab("codes")}
					>
						Codes
					</button>
				</div>
			</div>

			{tab === "referrals" ? (
				<DataTable
					columns={referralColumns}
					data={filteredReferrals}
					searchPlaceholder="Search referrals..."
					getId={(row) => row.id}
					emptyMessage="No referrals"
					emptyDescription="Referrals will appear when customers share their codes."
					filters={
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-9 w-full sm:w-[160px]">
								<SelectValue placeholder="All Statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="rewarded">Rewarded</SelectItem>
							</SelectContent>
						</Select>
					}
				/>
			) : (
				<DataTable
					columns={codeColumns}
					data={codes}
					searchPlaceholder="Search codes..."
					getId={(row) => row.id}
					emptyMessage="No referral codes"
					emptyDescription="Referral codes are generated for customers."
				/>
			)}
		</>
	)
}
