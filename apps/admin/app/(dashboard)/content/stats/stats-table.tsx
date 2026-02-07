"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createStatsItem, updateStatsItem, deleteStatsItem } from "../actions"

type StatItem = {
	id: string
	title: string
	value: string
	description: string | null
	icon: string | null
	sortOrder: number | null
	isActive: boolean | null
	createdAt: Date
}

export function StatsTable({ items }: { items: StatItem[] }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [editItem, setEditItem] = useState<StatItem | null>(null)
	const [loading, setLoading] = useState(false)

	const handleSave = async (formData: FormData) => {
		setLoading(true)
		try {
			const data = {
				title: formData.get("title") as string,
				value: formData.get("value") as string,
				description: (formData.get("description") as string) || undefined,
				icon: (formData.get("icon") as string) || undefined,
				sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
				isActive: formData.get("isActive") === "on",
			}
			if (editItem) {
				await updateStatsItem(editItem.id, data)
				toast.success("Stat updated")
			} else {
				await createStatsItem(data)
				toast.success("Stat created")
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
			await deleteStatsItem(id)
			toast.success("Stat deleted")
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || "Failed to delete")
		}
	}

	const handleToggleActive = async (item: StatItem) => {
		try {
			await updateStatsItem(item.id, { isActive: !item.isActive })
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || "Failed to update")
		}
	}

	const columns: Column<StatItem>[] = [
		{
			key: "sortOrder",
			header: "#",
			cell: (row) => <span className="text-muted-foreground">{row.sortOrder}</span>,
		},
		{
			key: "title",
			header: "Title",
			cell: (row) => <span className="font-medium">{row.title}</span>,
		},
		{
			key: "value",
			header: "Value",
			cell: (row) => <span className="font-mono">{row.value}</span>,
		},
		{
			key: "icon",
			header: "Icon",
			cell: (row) => <span className="text-muted-foreground">{row.icon || "—"}</span>,
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
		<DataTable
			data={items}
			columns={columns}
			searchKey="title"
			searchPlaceholder="Search stats..."
			getId={(row) => row.id}
			filters={
				<Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null) }}>
					<DialogTrigger asChild>
						<Button size="sm" className="h-9">New Stat</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{editItem ? "Edit Stat" : "New Stat"}</DialogTitle>
						</DialogHeader>
						<form action={handleSave} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="title">Title</Label>
									<Input id="title" name="title" placeholder="Happy Customers" defaultValue={editItem?.title || ""} required />
								</div>
								<div className="space-y-2">
									<Label htmlFor="value">Value</Label>
									<Input id="value" name="value" placeholder="1,000+" defaultValue={editItem?.value || ""} required />
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea id="description" name="description" rows={2} defaultValue={editItem?.description || ""} />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="icon">Icon</Label>
									<Input id="icon" name="icon" placeholder="e.g. star, gem" defaultValue={editItem?.icon || ""} />
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
	)
}
