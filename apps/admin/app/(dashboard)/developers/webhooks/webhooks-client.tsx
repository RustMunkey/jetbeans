"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import {
	ChevronLeft,
	ChevronRight,
	CheckCircle2,
	XCircle,
	Clock,
	AlertCircle,
	Eye,
	RefreshCw,
	Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WebhookEvent {
	id: string
	provider: string
	eventType: string | null
	externalId: string | null
	status: string
	errorMessage: string | null
	payload: Record<string, unknown> | null
	createdAt: Date
	processedAt: Date | null
}

interface WebhooksClientProps {
	events: WebhookEvent[]
	totalCount: number
	currentPage: number
	providers: string[]
	currentProvider?: string
	currentStatus?: string
}

export function WebhooksClient({
	events,
	totalCount,
	currentPage,
	providers,
	currentProvider,
	currentStatus,
}: WebhooksClientProps) {
	const router = useRouter()
	const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)
	const [payloadDialogOpen, setPayloadDialogOpen] = useState(false)

	const pageSize = 50
	const totalPages = Math.ceil(totalCount / pageSize)

	const handleFilterChange = (key: string, value: string | undefined) => {
		const params = new URLSearchParams()
		if (key === "provider" && value) params.set("provider", value)
		else if (currentProvider && key !== "provider") params.set("provider", currentProvider)

		if (key === "status" && value) params.set("status", value)
		else if (currentStatus && key !== "status") params.set("status", currentStatus)

		params.set("page", "1")
		router.push(`/developers/webhooks?${params.toString()}`)
	}

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams()
		if (currentProvider) params.set("provider", currentProvider)
		if (currentStatus) params.set("status", currentStatus)
		params.set("page", page.toString())
		router.push(`/developers/webhooks?${params.toString()}`)
	}

	const clearFilters = () => {
		router.push("/developers/webhooks")
	}

	const viewPayload = (event: WebhookEvent) => {
		setSelectedEvent(event)
		setPayloadDialogOpen(true)
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "processed":
				return <CheckCircle2 className="h-4 w-4 text-green-500" />
			case "failed":
				return <XCircle className="h-4 w-4 text-red-500" />
			case "pending":
				return <Clock className="h-4 w-4 text-yellow-500" />
			case "skipped":
				return <AlertCircle className="h-4 w-4 text-gray-400" />
			default:
				return <Clock className="h-4 w-4 text-gray-400" />
		}
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
			processed: "default",
			failed: "destructive",
			pending: "secondary",
			skipped: "outline",
		}
		return (
			<Badge variant={variants[status] || "outline"} className="capitalize">
				{status}
			</Badge>
		)
	}

	const getProviderLabel = (provider: string) => {
		const labels: Record<string, string> = {
			"shipping-17track": "17track",
			"shipping-tracktry": "Tracktry",
			"shipping-generic": "Shipping (Generic)",
			"email-ingest": "Email Ingestion",
			polar: "Polar",
			resend: "Resend",
		}
		return labels[provider] || provider
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Webhook Events</CardTitle>
							<CardDescription>
								View incoming webhook events from external services
							</CardDescription>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.refresh()}
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Refresh
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="flex items-center gap-4 mb-4">
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm text-muted-foreground">Filters:</span>
						</div>
						<Select
							value={currentProvider || "all"}
							onValueChange={(v) => handleFilterChange("provider", v === "all" ? undefined : v)}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="All Providers" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Providers</SelectItem>
								{providers.map((provider) => (
									<SelectItem key={provider} value={provider}>
										{getProviderLabel(provider)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={currentStatus || "all"}
							onValueChange={(v) => handleFilterChange("status", v === "all" ? undefined : v)}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="All Statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value="processed">Processed</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="failed">Failed</SelectItem>
								<SelectItem value="skipped">Skipped</SelectItem>
							</SelectContent>
						</Select>
						{(currentProvider || currentStatus) && (
							<Button variant="ghost" size="sm" onClick={clearFilters}>
								Clear
							</Button>
						)}
						<div className="ml-auto text-sm text-muted-foreground">
							{totalCount} events
						</div>
					</div>

					{/* Table */}
					{events.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold">No webhook events</h3>
							<p className="text-muted-foreground">
								{currentProvider || currentStatus
									? "No events match your filters"
									: "Webhook events will appear here when received"}
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Status</TableHead>
									<TableHead>Provider</TableHead>
									<TableHead>Event Type</TableHead>
									<TableHead>External ID</TableHead>
									<TableHead>Received</TableHead>
									<TableHead>Processed</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{events.map((event) => (
									<TableRow key={event.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												{getStatusIcon(event.status)}
												{getStatusBadge(event.status)}
											</div>
										</TableCell>
										<TableCell>
											<span className="font-medium">
												{getProviderLabel(event.provider)}
											</span>
										</TableCell>
										<TableCell>
											<code className="text-xs bg-muted px-1.5 py-0.5 rounded">
												{event.eventType || "-"}
											</code>
										</TableCell>
										<TableCell>
											{event.externalId ? (
												<code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[120px] block">
													{event.externalId}
												</code>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</TableCell>
										<TableCell>
											<span
												className="text-sm"
												title={format(new Date(event.createdAt), "PPpp")}
											>
												{formatDistanceToNow(new Date(event.createdAt), {
													addSuffix: true,
												})}
											</span>
										</TableCell>
										<TableCell>
											{event.processedAt ? (
												<span
													className="text-sm text-green-600"
													title={format(new Date(event.processedAt), "PPpp")}
												>
													{formatDistanceToNow(new Date(event.processedAt), {
														addSuffix: true,
													})}
												</span>
											) : event.errorMessage ? (
												<span
													className="text-sm text-red-600 truncate max-w-[150px] block"
													title={event.errorMessage}
												>
													{event.errorMessage}
												</span>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => viewPayload(event)}
												title="View payload"
											>
												<Eye className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between mt-4">
							<p className="text-sm text-muted-foreground">
								Showing {(currentPage - 1) * pageSize + 1} to{" "}
								{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
							</p>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage <= 1}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<span className="text-sm">
									Page {currentPage} of {totalPages}
								</span>
								<Button
									variant="outline"
									size="icon"
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage >= totalPages}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Payload Dialog */}
			<Dialog open={payloadDialogOpen} onOpenChange={setPayloadDialogOpen}>
				<DialogContent className="max-w-3xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle>Webhook Payload</DialogTitle>
					</DialogHeader>
					{selectedEvent && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground">Provider:</span>{" "}
									<span className="font-medium">
										{getProviderLabel(selectedEvent.provider)}
									</span>
								</div>
								<div>
									<span className="text-muted-foreground">Event Type:</span>{" "}
									<code className="bg-muted px-1.5 py-0.5 rounded">
										{selectedEvent.eventType || "-"}
									</code>
								</div>
								<div>
									<span className="text-muted-foreground">Status:</span>{" "}
									{getStatusBadge(selectedEvent.status)}
								</div>
								<div>
									<span className="text-muted-foreground">Received:</span>{" "}
									{format(new Date(selectedEvent.createdAt), "PPpp")}
								</div>
								{selectedEvent.errorMessage && (
									<div className="col-span-2">
										<span className="text-muted-foreground">Error:</span>{" "}
										<span className="text-red-600">{selectedEvent.errorMessage}</span>
									</div>
								)}
							</div>
							<div>
								<span className="text-sm text-muted-foreground">Payload:</span>
								<ScrollArea className="h-[400px] mt-2">
									<pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
										{JSON.stringify(selectedEvent.payload, null, 2)}
									</pre>
								</ScrollArea>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}
