"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
	Check,
	X,
	Pencil,
	ChevronLeft,
	ChevronRight,
	Package,
	Mail,
	AlertCircle,
	ExternalLink,
	Shield,
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
	DialogDescription,
	DialogFooter,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
	approveTracking,
	rejectTracking,
	updateTrackingOrder,
	addTrustedSender,
} from "../../actions"

interface PendingTrackingItem {
	id: string
	trackingNumber: string
	status: string
	source: string | null
	sourceDetails: {
		sender?: string
		subject?: string
		confidence?: string
	} | null
	createdAt: Date
	order: {
		id: string
		orderNumber: string
		customerName: string | null
	} | null
	carrier: {
		id: string
		name: string
		code: string
	} | null
}

interface PendingTrackingClientProps {
	items: PendingTrackingItem[]
	totalCount: number
	currentPage: number
}

export function PendingTrackingClient({
	items,
	totalCount,
	currentPage,
}: PendingTrackingClientProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [selectedItem, setSelectedItem] = useState<PendingTrackingItem | null>(null)
	const [selectedOrderId, setSelectedOrderId] = useState<string>("")

	const pageSize = 30
	const totalPages = Math.ceil(totalCount / pageSize)

	const handleApprove = async (id: string, senderEmail?: string) => {
		startTransition(async () => {
			const result = await approveTracking(id)
			if (result.success) {
				toast.success("Tracking approved and order updated")

				// Optionally trust the sender
				if (senderEmail) {
					const trustSender = window.confirm(
						`Do you want to auto-approve future emails from ${senderEmail}?`
					)
					if (trustSender) {
						await addTrustedSender(senderEmail)
						toast.success(`${senderEmail} added to trusted senders`)
					}
				}

				router.refresh()
			} else {
				toast.error(result.error || "Failed to approve tracking")
			}
		})
	}

	const handleReject = async (id: string) => {
		if (!confirm("Are you sure you want to reject this tracking? It will be deleted.")) {
			return
		}

		startTransition(async () => {
			const result = await rejectTracking(id)
			if (result.success) {
				toast.success("Tracking rejected")
				router.refresh()
			} else {
				toast.error(result.error || "Failed to reject tracking")
			}
		})
	}

	const handleEdit = (item: PendingTrackingItem) => {
		setSelectedItem(item)
		setSelectedOrderId(item.order?.id || "")
		setEditDialogOpen(true)
	}

	const handleSaveEdit = async () => {
		if (!selectedItem || !selectedOrderId) return

		startTransition(async () => {
			const result = await updateTrackingOrder(selectedItem.id, selectedOrderId)
			if (result.success) {
				toast.success("Tracking updated")
				setEditDialogOpen(false)
				router.refresh()
			} else {
				toast.error(result.error || "Failed to update tracking")
			}
		})
	}

	const handlePageChange = (page: number) => {
		router.push(`/shipping/tracking/pending?page=${page}`)
	}

	const getConfidenceBadge = (confidence: string | undefined) => {
		switch (confidence) {
			case "high":
				return <Badge variant="default" className="bg-green-500">High Confidence</Badge>
			case "medium":
				return <Badge variant="secondary">Medium Confidence</Badge>
			case "low":
				return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Low Confidence</Badge>
			default:
				return <Badge variant="outline">Unknown</Badge>
		}
	}

	const getSourceIcon = (source: string | null) => {
		switch (source) {
			case "email":
				return <Mail className="h-4 w-4" />
			case "api":
				return <ExternalLink className="h-4 w-4" />
			default:
				return <Package className="h-4 w-4" />
		}
	}

	if (items.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Pending Review
					</CardTitle>
					<CardDescription>
						Tracking numbers that need manual review before being associated with orders
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Check className="h-12 w-12 text-green-500 mb-4" />
						<h3 className="text-lg font-semibold">All caught up!</h3>
						<p className="text-muted-foreground">
							No tracking numbers pending review
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<AlertCircle className="h-5 w-5 text-yellow-500" />
								Pending Review ({totalCount})
							</CardTitle>
							<CardDescription>
								Review and approve tracking numbers before they're associated with orders
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Source</TableHead>
								<TableHead>Tracking Number</TableHead>
								<TableHead>Carrier</TableHead>
								<TableHead>Matched Order</TableHead>
								<TableHead>Confidence</TableHead>
								<TableHead>Received</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									<TableCell>
										<div className="flex items-center gap-2">
											{getSourceIcon(item.source)}
											<div className="flex flex-col">
												<span className="text-sm capitalize">{item.source || "manual"}</span>
												{item.sourceDetails?.sender && (
													<span className="text-xs text-muted-foreground truncate max-w-[150px]">
														{item.sourceDetails.sender}
													</span>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<code className="text-sm bg-muted px-2 py-1 rounded">
											{item.trackingNumber}
										</code>
									</TableCell>
									<TableCell>
										{item.carrier?.name || (
											<span className="text-muted-foreground">Unknown</span>
										)}
									</TableCell>
									<TableCell>
										{item.order ? (
											<div className="flex flex-col">
												<span className="font-medium">{item.order.orderNumber}</span>
												<span className="text-xs text-muted-foreground">
													{item.order.customerName}
												</span>
											</div>
										) : (
											<Badge variant="outline" className="border-red-500 text-red-600">
												No Match
											</Badge>
										)}
									</TableCell>
									<TableCell>
										{getConfidenceBadge(item.sourceDetails?.confidence)}
									</TableCell>
									<TableCell>
										<span className="text-sm text-muted-foreground">
											{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleEdit(item)}
												disabled={isPending}
												title="Edit order association"
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-green-600 hover:text-green-700 hover:bg-green-50"
												onClick={() => handleApprove(item.id, item.sourceDetails?.sender)}
												disabled={isPending || !item.order}
												title={item.order ? "Approve" : "Assign order first"}
											>
												<Check className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
												onClick={() => handleReject(item.id)}
												disabled={isPending}
												title="Reject"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

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

			{/* Edit Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Tracking Association</DialogTitle>
						<DialogDescription>
							Update the order associated with this tracking number
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Tracking Number</Label>
							<Input
								value={selectedItem?.trackingNumber || ""}
								disabled
							/>
						</div>
						<div className="space-y-2">
							<Label>Carrier</Label>
							<Input
								value={selectedItem?.carrier?.name || "Unknown"}
								disabled
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="orderId">Order ID</Label>
							<Input
								id="orderId"
								value={selectedOrderId}
								onChange={(e) => setSelectedOrderId(e.target.value)}
								placeholder="Enter order ID or order number"
							/>
							<p className="text-xs text-muted-foreground">
								Enter the order ID to associate this tracking with
							</p>
						</div>
						{selectedItem?.sourceDetails?.subject && (
							<div className="space-y-2">
								<Label>Email Subject</Label>
								<p className="text-sm text-muted-foreground bg-muted p-2 rounded">
									{selectedItem.sourceDetails.subject}
								</p>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSaveEdit} disabled={isPending || !selectedOrderId}>
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
