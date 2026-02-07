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
import { createFaqItem, updateFaqItem, deleteFaqItem } from "../actions"

type FaqItem = {
	id: string
	question: string
	answer: string
	category: string | null
	sortOrder: number | null
	isActive: boolean | null
	isFeatured: boolean | null
	createdAt: Date
}

export function FaqTable({ items }: { items: FaqItem[] }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [editItem, setEditItem] = useState<FaqItem | null>(null)
	const [loading, setLoading] = useState(false)

	const handleSave = async (formData: FormData) => {
		setLoading(true)
		try {
			const data = {
				question: formData.get("question") as string,
				answer: formData.get("answer") as string,
				category: (formData.get("category") as string) || "general",
				sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
				isActive: formData.get("isActive") === "on",
			}
			if (editItem) {
				await updateFaqItem(editItem.id, data)
				toast.success("FAQ updated")
			} else {
				await createFaqItem(data)
				toast.success("FAQ created")
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

	const handleDelete = async (id: string) => {
		try {
			await deleteFaqItem(id)
			toast.success("FAQ deleted")
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || "Failed to delete")
		}
	}

	const handleToggleActive = async (item: FaqItem) => {
		try {
			await updateFaqItem(item.id, { isActive: !item.isActive })
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || "Failed to update")
		}
	}

	const columns: Column<FaqItem>[] = [
		{
			key: "sortOrder",
			header: "#",
			cell: (row) => <span className="text-muted-foreground">{row.sortOrder}</span>,
		},
		{
			key: "question",
			header: "Question",
			cell: (row) => <span className="font-medium line-clamp-1">{row.question}</span>,
		},
		{
			key: "category",
			header: "Category",
			cell: (row) => <Badge variant="outline">{row.category || "general"}</Badge>,
		},
		{
			key: "isActive",
			header: "Active",
			cell: (row) => <Switch checked={row.isActive ?? false} onCheckedChange={() => handleToggleActive(row)} />,
		},
		{
			key: "actions",
			header: "",
			cell: (row) => (
				<div className="flex gap-2">
					<Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditItem(row); setOpen(true) }}>Edit</Button>
					<Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}>Delete</Button>
				</div>
			),
		},
	]

	return (
		<>
			<DataTable
				data={items}
				columns={columns}
				searchKey="question"
				searchPlaceholder="Search FAQ..."
				getId={(row) => row.id}
				filters={
					<Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null) }}>
						<DialogTrigger asChild>
							<Button size="sm" className="h-9">New FAQ</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{editItem ? "Edit FAQ" : "New FAQ"}</DialogTitle>
							</DialogHeader>
							<form action={handleSave} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="question">Question</Label>
									<Input id="question" name="question" defaultValue={editItem?.question || ""} required />
								</div>
								<div className="space-y-2">
									<Label htmlFor="answer">Answer</Label>
									<Textarea id="answer" name="answer" rows={4} defaultValue={editItem?.answer || ""} required />
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="category">Category</Label>
										<Input id="category" name="category" defaultValue={editItem?.category || "general"} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="sortOrder">Sort Order</Label>
										<Input id="sortOrder" name="sortOrder" type="number" defaultValue={editItem?.sortOrder ?? 0} />
									</div>
								</div>
								<div className="flex items-center gap-2">
									<input type="checkbox" id="isActive" name="isActive" defaultChecked={editItem?.isActive ?? true} />
									<Label htmlFor="isActive">Active</Label>
								</div>
								<Button type="submit" disabled={loading} className="w-full">{editItem ? "Update" : "Create"}</Button>
							</form>
						</DialogContent>
					</Dialog>
				}
			/>
		</>
	)
}
