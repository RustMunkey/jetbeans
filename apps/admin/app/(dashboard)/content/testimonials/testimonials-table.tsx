"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTestimonial, updateTestimonial, deleteTestimonial } from "../actions"

type Testimonial = {
	id: string
	reviewerName: string
	reviewerEmail: string | null
	rating: number
	title: string | null
	content: string
	status: string
	isFeatured: boolean | null
	createdAt: Date
}

const statusColors: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
	rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export function TestimonialsTable({ items, currentStatus }: { items: Testimonial[]; currentStatus: string }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [editItem, setEditItem] = useState<Testimonial | null>(null)
	const [loading, setLoading] = useState(false)

	const handleSave = async (formData: FormData) => {
		setLoading(true)
		try {
			const data = {
				reviewerName: formData.get("reviewerName") as string,
				reviewerEmail: (formData.get("reviewerEmail") as string) || undefined,
				rating: parseInt(formData.get("rating") as string) || 5,
				title: (formData.get("title") as string) || undefined,
				content: formData.get("content") as string,
				status: formData.get("status") as string || "pending",
			}
			if (editItem) {
				await updateTestimonial(editItem.id, data)
				toast.success("Testimonial updated")
			} else {
				await createTestimonial(data)
				toast.success("Testimonial created")
			}
			setOpen(false)
			setEditItem(null)
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || "Failed to save")
		} finally {
			setLoading(false)
		}
	}

	const handleStatusChange = async (id: string, status: string) => {
		try {
			await updateTestimonial(id, { status })
			toast.success(`Testimonial ${status}`)
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || "Failed to update")
		}
	}

	const handleToggleFeatured = async (item: Testimonial) => {
		try {
			await updateTestimonial(item.id, { isFeatured: !item.isFeatured })
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || "Failed to update")
		}
	}

	const handleDelete = async (id: string) => {
		try {
			await deleteTestimonial(id)
			toast.success("Testimonial deleted")
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || "Failed to delete")
		}
	}

	const columns: Column<Testimonial>[] = [
		{
			key: "reviewerName",
			header: "Reviewer",
			cell: (row) => (
				<div>
					<span className="font-medium">{row.reviewerName}</span>
					{row.reviewerEmail && <p className="text-xs text-muted-foreground">{row.reviewerEmail}</p>}
				</div>
			),
		},
		{
			key: "rating",
			header: "Rating",
			cell: (row) => <span>{"★".repeat(row.rating)}{"☆".repeat(5 - row.rating)}</span>,
		},
		{
			key: "content",
			header: "Content",
			cell: (row) => <span className="line-clamp-1 max-w-[300px]">{row.content}</span>,
		},
		{
			key: "status",
			header: "Status",
			cell: (row) => <Badge className={statusColors[row.status] || ""}>{row.status}</Badge>,
		},
		{
			key: "isFeatured",
			header: "Featured",
			cell: (row) => <Switch checked={row.isFeatured ?? false} onCheckedChange={() => handleToggleFeatured(row)} />,
		},
		{
			key: "actions",
			header: "",
			cell: (row) => (
				<div className="flex gap-1">
					{row.status === "pending" && (
						<>
							<Button size="sm" variant="ghost" className="text-green-600" onClick={(e) => { e.stopPropagation(); handleStatusChange(row.id, "approved") }}>Approve</Button>
							<Button size="sm" variant="ghost" className="text-red-600" onClick={(e) => { e.stopPropagation(); handleStatusChange(row.id, "rejected") }}>Reject</Button>
						</>
					)}
					<Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditItem(row); setOpen(true) }}>Edit</Button>
					<Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}>Delete</Button>
				</div>
			),
		},
	]

	return (
		<DataTable
			data={items}
			columns={columns}
			searchKey="reviewerName"
			searchPlaceholder="Search testimonials..."
			getId={(row) => row.id}
			filters={
				<div className="flex gap-2">
					<Select value={currentStatus} onValueChange={(v) => router.push(v === "all" ? "/content/testimonials" : `/content/testimonials?status=${v}`)}>
						<SelectTrigger className="w-[140px] h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="approved">Approved</SelectItem>
							<SelectItem value="rejected">Rejected</SelectItem>
						</SelectContent>
					</Select>
					<Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null) }}>
						<DialogTrigger asChild>
							<Button size="sm" className="h-9">New Testimonial</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{editItem ? "Edit Testimonial" : "New Testimonial"}</DialogTitle>
							</DialogHeader>
							<form action={handleSave} className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="reviewerName">Name</Label>
										<Input id="reviewerName" name="reviewerName" defaultValue={editItem?.reviewerName || ""} required />
									</div>
									<div className="space-y-2">
										<Label htmlFor="reviewerEmail">Email</Label>
										<Input id="reviewerEmail" name="reviewerEmail" type="email" defaultValue={editItem?.reviewerEmail || ""} />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="rating">Rating</Label>
										<Select name="rating" defaultValue={String(editItem?.rating || 5)}>
											<SelectTrigger><SelectValue /></SelectTrigger>
											<SelectContent>
												{[5, 4, 3, 2, 1].map(n => <SelectItem key={n} value={String(n)}>{"★".repeat(n)} ({n})</SelectItem>)}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="status">Status</Label>
										<Select name="status" defaultValue={editItem?.status || "pending"}>
											<SelectTrigger><SelectValue /></SelectTrigger>
											<SelectContent>
												<SelectItem value="pending">Pending</SelectItem>
												<SelectItem value="approved">Approved</SelectItem>
												<SelectItem value="rejected">Rejected</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="title">Title</Label>
									<Input id="title" name="title" defaultValue={editItem?.title || ""} />
								</div>
								<div className="space-y-2">
									<Label htmlFor="content">Content</Label>
									<Textarea id="content" name="content" rows={4} defaultValue={editItem?.content || ""} required />
								</div>
								<Button type="submit" disabled={loading} className="w-full">{editItem ? "Update" : "Create"}</Button>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			}
		/>
	)
}
