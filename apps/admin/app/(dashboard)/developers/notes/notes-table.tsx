"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getDeveloperNotes, createDeveloperNote, updateDeveloperNote, deleteDeveloperNote } from "./actions"

type DeveloperNote = {
	id: string
	title: string
	body: string
	type: string
	status: string
	priority: string
	authorId: string
	authorName: string | null
	authorImage: string | null
	assignedTo: string | null
	resolvedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

type TeamMember = {
	id: string
	name: string | null
	email: string
	image: string | null
}

const TYPE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
	bug: { label: "Bug", variant: "destructive" },
	feature: { label: "Feature", variant: "default" },
	issue: { label: "Issue", variant: "secondary" },
	note: { label: "Note", variant: "outline" },
	working: { label: "Working", variant: "default" },
	broken: { label: "Broken", variant: "destructive" },
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
	open: { label: "Open", className: "bg-blue-500/10 text-blue-500" },
	in_progress: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-500" },
	resolved: { label: "Resolved", className: "bg-green-500/10 text-green-500" },
	closed: { label: "Closed", className: "bg-gray-500/10 text-gray-500" },
}

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
	low: { label: "Low", className: "text-gray-500" },
	medium: { label: "Medium", className: "text-blue-500" },
	high: { label: "High", className: "text-orange-500" },
	critical: { label: "Critical", className: "text-red-500 font-semibold" },
}

function getInitials(name: string | null) {
	if (!name) return "?"
	return name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.toUpperCase()
		.slice(0, 2)
}

export function NotesTable({
	notes: initialNotes,
	teamMembers,
}: {
	notes: DeveloperNote[]
	teamMembers: TeamMember[]
}) {
	const router = useRouter()
	const [notes, setNotes] = useState(initialNotes)
	const [statusFilter, setStatusFilter] = useState("all")
	const [typeFilter, setTypeFilter] = useState("all")
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingNote, setEditingNote] = useState<DeveloperNote | null>(null)
	const [formData, setFormData] = useState({
		title: "",
		body: "",
		type: "bug",
		priority: "medium",
		status: "open",
		assignedTo: "",
	})
	const [saving, setSaving] = useState(false)

	async function handleFilterChange(status: string, type: string) {
		setStatusFilter(status)
		setTypeFilter(type)
		const filtered = await getDeveloperNotes({
			status: status !== "all" ? status : undefined,
			type: type !== "all" ? type : undefined,
		})
		setNotes(filtered)
	}

	function openCreateDialog() {
		setEditingNote(null)
		setFormData({
			title: "",
			body: "",
			type: "bug",
			priority: "medium",
			status: "open",
			assignedTo: "",
		})
		setDialogOpen(true)
	}

	function openEditDialog(note: DeveloperNote) {
		setEditingNote(note)
		setFormData({
			title: note.title,
			body: note.body,
			type: note.type,
			priority: note.priority,
			status: note.status,
			assignedTo: note.assignedTo || "",
		})
		setDialogOpen(true)
	}

	async function handleSave() {
		if (!formData.title.trim() || !formData.body.trim()) {
			toast.error("Title and description are required")
			return
		}

		setSaving(true)
		try {
			if (editingNote) {
				await updateDeveloperNote(editingNote.id, {
					title: formData.title,
					body: formData.body,
					type: formData.type,
					priority: formData.priority,
					status: formData.status,
					assignedTo: formData.assignedTo || null,
				})
				toast.success("Note updated")
			} else {
				await createDeveloperNote({
					title: formData.title,
					body: formData.body,
					type: formData.type,
					priority: formData.priority,
					assignedTo: formData.assignedTo || undefined,
				})
				toast.success("Note created")
			}
			setDialogOpen(false)
			// Refresh the list
			const refreshed = await getDeveloperNotes({
				status: statusFilter !== "all" ? statusFilter : undefined,
				type: typeFilter !== "all" ? typeFilter : undefined,
			})
			setNotes(refreshed)
		} catch {
			toast.error("Failed to save note")
		} finally {
			setSaving(false)
		}
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this note?")) return
		try {
			await deleteDeveloperNote(id)
			toast.success("Note deleted")
			setNotes((prev) => prev.filter((n) => n.id !== id))
		} catch {
			toast.error("Failed to delete note")
		}
	}

	async function handleQuickStatusChange(note: DeveloperNote, newStatus: string) {
		try {
			await updateDeveloperNote(note.id, { status: newStatus })
			setNotes((prev) =>
				prev.map((n) =>
					n.id === note.id
						? { ...n, status: newStatus, resolvedAt: newStatus === "resolved" || newStatus === "closed" ? new Date() : null }
						: n
				)
			)
			toast.success(`Status updated to ${STATUS_LABELS[newStatus]?.label || newStatus}`)
		} catch {
			toast.error("Failed to update status")
		}
	}

	const columns: Column<DeveloperNote>[] = [
		{
			key: "type",
			header: "Type",
			cell: (row) => {
				const config = TYPE_LABELS[row.type] || { label: row.type, variant: "outline" as const }
				return <Badge variant={config.variant}>{config.label}</Badge>
			},
		},
		{
			key: "title",
			header: "Title",
			cell: (row) => (
				<div className="min-w-[200px]">
					<span className="font-medium">{row.title}</span>
					<p className="text-xs text-muted-foreground truncate max-w-[300px]">{row.body}</p>
				</div>
			),
		},
		{
			key: "priority",
			header: "Priority",
			cell: (row) => {
				const config = PRIORITY_LABELS[row.priority] || { label: row.priority, className: "" }
				return <span className={`text-xs font-medium ${config.className}`}>{config.label}</span>
			},
		},
		{
			key: "status",
			header: "Status",
			cell: (row) => {
				const config = STATUS_LABELS[row.status] || { label: row.status, className: "" }
				return (
					<Select
						value={row.status}
						onValueChange={(value) => handleQuickStatusChange(row, value)}
					>
						<SelectTrigger className={`w-[130px] h-7 text-xs ${config.className}`}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="open">Open</SelectItem>
							<SelectItem value="in_progress">In Progress</SelectItem>
							<SelectItem value="resolved">Resolved</SelectItem>
							<SelectItem value="closed">Closed</SelectItem>
						</SelectContent>
					</Select>
				)
			},
		},
		{
			key: "authorName",
			header: "Reported By",
			cell: (row) => (
				<div className="flex items-center gap-2">
					<Avatar className="h-6 w-6">
						{row.authorImage && <AvatarImage src={row.authorImage} alt={row.authorName || ""} />}
						<AvatarFallback className="text-[10px]">{getInitials(row.authorName)}</AvatarFallback>
					</Avatar>
					<span className="text-sm">{row.authorName || "Unknown"}</span>
				</div>
			),
		},
		{
			key: "createdAt",
			header: "Created",
			cell: (row) => new Date(row.createdAt).toLocaleDateString(),
		},
		{
			key: "actions",
			header: "",
			cell: (row) => (
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="sm" onClick={() => openEditDialog(row)}>
						Edit
					</Button>
					<Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(row.id)}>
						Delete
					</Button>
				</div>
			),
		},
	]

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Developer Notes</h2>
					<p className="text-muted-foreground text-sm">
						Track bugs, issues, and notes for the development team.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Select value={typeFilter} onValueChange={(v) => handleFilterChange(statusFilter, v)}>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value="bug">Bug</SelectItem>
							<SelectItem value="feature">Feature</SelectItem>
							<SelectItem value="issue">Issue</SelectItem>
							<SelectItem value="note">Note</SelectItem>
							<SelectItem value="working">Working</SelectItem>
							<SelectItem value="broken">Broken</SelectItem>
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={(v) => handleFilterChange(v, typeFilter)}>
						<SelectTrigger className="w-[130px]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="open">Open</SelectItem>
							<SelectItem value="in_progress">In Progress</SelectItem>
							<SelectItem value="resolved">Resolved</SelectItem>
							<SelectItem value="closed">Closed</SelectItem>
						</SelectContent>
					</Select>
					<Button onClick={openCreateDialog}>New Note</Button>
				</div>
			</div>

			<DataTable
				data={notes}
				columns={columns}
				searchKey="title"
				searchPlaceholder="Search notes..."
			/>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{editingNote ? "Edit Note" : "Create Note"}</DialogTitle>
						<DialogDescription>
							{editingNote
								? "Update the details of this note."
								: "Report a bug, issue, or add a note for the team."}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
								placeholder="Brief summary..."
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="body">Description</Label>
							<Textarea
								id="body"
								value={formData.body}
								onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
								placeholder="Describe the bug, issue, or note in detail..."
								rows={4}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="type">Type</Label>
								<Select
									value={formData.type}
									onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="bug">Bug</SelectItem>
										<SelectItem value="feature">Feature Request</SelectItem>
										<SelectItem value="issue">Issue</SelectItem>
										<SelectItem value="note">Note</SelectItem>
										<SelectItem value="working">Working</SelectItem>
										<SelectItem value="broken">Broken</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="priority">Priority</Label>
								<Select
									value={formData.priority}
									onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: v }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="low">Low</SelectItem>
										<SelectItem value="medium">Medium</SelectItem>
										<SelectItem value="high">High</SelectItem>
										<SelectItem value="critical">Critical</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						{editingNote && (
							<div className="grid gap-2">
								<Label htmlFor="status">Status</Label>
								<Select
									value={formData.status}
									onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="open">Open</SelectItem>
										<SelectItem value="in_progress">In Progress</SelectItem>
										<SelectItem value="resolved">Resolved</SelectItem>
										<SelectItem value="closed">Closed</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="grid gap-2">
							<Label htmlFor="assignedTo">Assign To (optional)</Label>
							<Select
								value={formData.assignedTo}
								onValueChange={(v) => setFormData((prev) => ({ ...prev, assignedTo: v }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Unassigned" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Unassigned</SelectItem>
									{teamMembers.map((member) => (
										<SelectItem key={member.id} value={member.id}>
											{member.name || member.email}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={saving}>
							{saving ? "Saving..." : editingNote ? "Update" : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
