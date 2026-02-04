"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	Add01Icon,
	MoreHorizontalIcon,
	ViewIcon,
	PencilEdit01Icon,
	Delete02Icon,
	Copy01Icon,
	PlayIcon,
	PauseIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataTable, Column } from "@/components/data-table"
import { formatDistanceToNow } from "date-fns"
import { deleteWorkflow, duplicateWorkflow, toggleWorkflow } from "./actions"
import { TRIGGER_CATEGORIES } from "./constants"
import type { Workflow } from "@jetbeans/db/schema"
import { toast } from "sonner"

interface WorkflowsTableProps {
	workflows: Workflow[]
	totalCount: number
}

function getTriggerLabel(trigger: string): string {
	for (const category of Object.values(TRIGGER_CATEGORIES)) {
		const found = category.triggers.find((t) => t.value === trigger)
		if (found) return found.label
	}
	return trigger
}

function getTriggerCategory(trigger: string): string {
	for (const [key, category] of Object.entries(TRIGGER_CATEGORIES)) {
		if (category.triggers.some((t) => t.value === trigger)) {
			return category.label
		}
	}
	return "Unknown"
}

export function WorkflowsTable({ workflows: initialWorkflows, totalCount }: WorkflowsTableProps) {
	const router = useRouter()
	const [workflows, setWorkflows] = React.useState(initialWorkflows)
	const [deleteId, setDeleteId] = React.useState<string | null>(null)
	const [loading, setLoading] = React.useState(false)

	React.useEffect(() => {
		setWorkflows(initialWorkflows)
	}, [initialWorkflows])

	const handleToggle = async (id: string, isActive: boolean) => {
		try {
			await toggleWorkflow(id, isActive)
			setWorkflows((prev) =>
				prev.map((w) => (w.id === id ? { ...w, isActive } : w))
			)
			toast.success(isActive ? "Workflow activated" : "Workflow paused")
		} catch (err) {
			toast.error("Failed to update workflow")
		}
	}

	const handleDelete = async () => {
		if (!deleteId) return
		setLoading(true)
		try {
			await deleteWorkflow(deleteId)
			setWorkflows((prev) => prev.filter((w) => w.id !== deleteId))
			toast.success("Workflow deleted")
			router.refresh()
		} catch (err) {
			toast.error("Failed to delete workflow")
		} finally {
			setLoading(false)
			setDeleteId(null)
		}
	}

	const handleDuplicate = async (id: string) => {
		try {
			const copy = await duplicateWorkflow(id)
			toast.success("Workflow duplicated")
			router.push(`/automation/${copy.id}`)
		} catch (err) {
			toast.error("Failed to duplicate workflow")
		}
	}

	const columns: Column<Workflow>[] = [
		{
			key: "name",
			header: "Workflow",
			cell: (workflow) => (
				<div>
					<p className="font-medium">{workflow.name}</p>
					{workflow.description && (
						<p className="text-xs text-muted-foreground line-clamp-1">
							{workflow.description}
						</p>
					)}
				</div>
			),
		},
		{
			key: "trigger",
			header: "Trigger",
			cell: (workflow) => (
				<div>
					<p className="text-sm">{getTriggerLabel(workflow.trigger)}</p>
					<p className="text-xs text-muted-foreground">
						{getTriggerCategory(workflow.trigger)}
					</p>
				</div>
			),
		},
		{
			key: "status",
			header: "Status",
			cell: (workflow) => (
				<div className="flex items-center gap-2">
					{workflow.isDraft ? (
						<Badge variant="secondary">Draft</Badge>
					) : workflow.isActive ? (
						<Badge variant="default">Active</Badge>
					) : (
						<Badge variant="outline">Paused</Badge>
					)}
				</div>
			),
		},
		{
			key: "runs",
			header: "Runs",
			cell: (workflow) => (
				<div>
					<p className="font-medium">{workflow.runCount}</p>
					{workflow.lastRunAt && (
						<p className="text-xs text-muted-foreground">
							Last: {formatDistanceToNow(new Date(workflow.lastRunAt), { addSuffix: true })}
						</p>
					)}
				</div>
			),
		},
		{
			key: "active",
			header: "Enabled",
			cell: (workflow) => (
				<Switch
					checked={workflow.isActive}
					onCheckedChange={(checked) => handleToggle(workflow.id, checked)}
					disabled={workflow.isDraft}
				/>
			),
		},
		{
			key: "actions",
			header: "",
			cell: (workflow) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="size-8">
							<HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => router.push(`/automation/${workflow.id}`)}>
							<HugeiconsIcon icon={PencilEdit01Icon} size={14} className="mr-2" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleDuplicate(workflow.id)}>
							<HugeiconsIcon icon={Copy01Icon} size={14} className="mr-2" />
							Duplicate
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => setDeleteId(workflow.id)}
							className="text-destructive focus:text-destructive"
						>
							<HugeiconsIcon icon={Delete02Icon} size={14} className="mr-2" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	]

	return (
		<>
			<div className="flex justify-end mb-4">
				<Button size="sm" onClick={() => router.push("/automation/new")}>
					<HugeiconsIcon icon={Add01Icon} size={14} className="mr-1" />
					Create Workflow
				</Button>
			</div>
			<DataTable
				columns={columns}
				data={workflows}
				totalCount={totalCount}
				onRowClick={(workflow) => router.push(`/automation/${workflow.id}`)}
				emptyMessage="No workflows yet. Create one to automate your business."
			/>

			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete workflow?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete this workflow and all its run history.
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={loading}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{loading ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
