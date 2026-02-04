"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, Home01Icon, Logout02Icon, Mail01Icon, Navigation04Icon, Settings01Icon } from "@hugeicons/core-free-icons"
import { Store, Users, Building2, Sparkles, Loader2 } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
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
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { setActiveWorkspace, createWorkspaceAction, deleteWorkspaceAction, leaveWorkspaceAction } from "@/lib/workspace"
import type { WorkspaceWithRole } from "@/lib/workspace"

function getInitials(name: string) {
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()
}

function NotificationBadge({ count }: { count: number }) {
	if (count <= 0) return null

	return (
		<span className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-[9px] font-medium text-primary-foreground ring-2 ring-sidebar">
			{count > 99 ? "99+" : count}
		</span>
	)
}

function WorkspaceIcon({
	workspace,
	isActive,
	onClick,
	onDelete,
	onLeave,
	onSettings,
}: {
	workspace: WorkspaceWithRole
	isActive: boolean
	onClick: () => void
	onDelete: () => void
	onLeave: () => void
	onSettings: () => void
}) {
	const initials = getInitials(workspace.name)
	const isOwner = workspace.role === "owner"

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div className="w-full">
					<Tooltip delayDuration={0}>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={onClick}
								className="relative group flex items-center justify-center w-full"
							>
								{/* Active indicator pill */}
								<div
									className={cn(
										"absolute left-0 w-1 rounded-r-full bg-foreground transition-all duration-200",
										isActive ? "h-8" : "h-0 group-hover:h-4"
									)}
								/>

								{/* Workspace avatar */}
								<div className="relative overflow-visible">
									<div className={cn(
										"size-10 rounded-lg flex items-center justify-center transition-colors duration-200",
										isActive
											? "bg-primary text-primary-foreground"
											: "bg-muted text-foreground"
									)}>
										{workspace.logo ? (
											<img
												src={workspace.logo}
												alt={workspace.name}
												className="size-6 object-contain"
											/>
										) : (
											<span className="text-sm font-semibold">{initials}</span>
										)}
									</div>
									<NotificationBadge count={0} />
								</div>
							</button>
						</TooltipTrigger>
						<TooltipContent side="right" sideOffset={8}>
							<div>
								<p className="font-medium">{workspace.name}</p>
								<p className="text-xs text-muted-foreground capitalize">{workspace.role}</p>
							</div>
						</TooltipContent>
					</Tooltip>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				<ContextMenuItem onClick={onSettings}>
					<HugeiconsIcon icon={Settings01Icon} size={14} className="mr-2" />
					Workspace Settings
				</ContextMenuItem>
				<ContextMenuSeparator />
				{isOwner ? (
					<ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
						<HugeiconsIcon icon={Delete02Icon} size={14} className="mr-2" />
						Delete Workspace
					</ContextMenuItem>
				) : (
					<ContextMenuItem onClick={onLeave} className="text-destructive focus:text-destructive">
						<HugeiconsIcon icon={Logout02Icon} size={14} className="mr-2" />
						Leave Workspace
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
	)
}

function NavButton({ icon, label, onClick }: { icon: typeof Home01Icon; label: string; onClick: () => void }) {
	return (
		<Tooltip delayDuration={0}>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={onClick}
					className="relative group flex items-center justify-center w-full"
				>
					<Avatar className="size-10 rounded-lg transition-all duration-200">
						<AvatarFallback className="rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
							<HugeiconsIcon icon={icon} size={18} />
						</AvatarFallback>
					</Avatar>
				</button>
			</TooltipTrigger>
			<TooltipContent side="right" sideOffset={8}>
				<p className="font-medium">{label}</p>
			</TooltipContent>
		</Tooltip>
	)
}

function AddWorkspaceButton({ onClick }: { onClick: () => void }) {
	return (
		<Tooltip delayDuration={0}>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={onClick}
					className="relative group flex items-center justify-center w-full"
				>
					<Avatar className="size-10 rounded-lg transition-all duration-200">
						<AvatarFallback className="rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
							<HugeiconsIcon icon={Add01Icon} size={18} />
						</AvatarFallback>
					</Avatar>
				</button>
			</TooltipTrigger>
			<TooltipContent side="right" sideOffset={8}>
				<p className="font-medium">Create Workspace</p>
			</TooltipContent>
		</Tooltip>
	)
}

const workspaceTypes = [
	{ id: "ecommerce", label: "Online Store", icon: Store, description: "Sell products online" },
	{ id: "community", label: "Community", icon: Users, description: "Build a community" },
	{ id: "agency", label: "Agency", icon: Building2, description: "Manage clients" },
	{ id: "other", label: "Other", icon: Sparkles, description: "Something else" },
]

function CreateWorkspaceDialog({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreated: (workspaceId: string) => void
}) {
	const [name, setName] = React.useState("")
	const [workspaceType, setWorkspaceType] = React.useState("ecommerce")
	const [isPending, setIsPending] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim() || isPending) return

		setIsPending(true)
		setError(null)

		try {
			const result = await createWorkspaceAction(name.trim(), workspaceType)
			if (result.error) {
				setError(result.error)
			} else if (result.workspaceId) {
				setName("")
				setWorkspaceType("ecommerce")
				onOpenChange(false)
				onCreated(result.workspaceId)
			}
		} catch (err) {
			setError("Failed to create workspace")
		} finally {
			setIsPending(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create Workspace</DialogTitle>
						<DialogDescription>
							Your workspace is where you'll manage everything for your store or project.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="workspace-name">Workspace name</Label>
							<Input
								id="workspace-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="My Awesome Store"
								autoFocus
							/>
						</div>

						<div className="space-y-2">
							<Label>What will you use it for?</Label>
							<div className="grid grid-cols-2 gap-2">
								{workspaceTypes.map((type) => (
									<button
										key={type.id}
										type="button"
										onClick={() => setWorkspaceType(type.id)}
										className={cn(
											"flex flex-col items-start gap-1 p-3 rounded-lg border-2 transition-all text-left",
											workspaceType === type.id
												? "border-primary bg-primary/5"
												: "border-transparent bg-muted hover:bg-muted/80"
										)}
									>
										<type.icon className="size-4 text-muted-foreground" />
										<span className="font-medium text-sm">{type.label}</span>
									</button>
								))}
							</div>
						</div>

						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending || !name.trim()}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Workspace"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

interface WorkspaceSidebarProps {
	workspaces: WorkspaceWithRole[]
	activeWorkspaceId: string | null
}

export function WorkspaceSidebar({ workspaces, activeWorkspaceId }: WorkspaceSidebarProps) {
	const router = useRouter()
	const [switching, setSwitching] = React.useState(false)
	const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
	const [deleteWorkspace, setDeleteWorkspace] = React.useState<WorkspaceWithRole | null>(null)
	const [leaveWorkspace, setLeaveWorkspace] = React.useState<WorkspaceWithRole | null>(null)
	const [actionPending, setActionPending] = React.useState(false)

	const handleWorkspaceSwitch = async (workspaceId: string) => {
		if (switching || workspaceId === activeWorkspaceId) return

		setSwitching(true)
		try {
			await setActiveWorkspace(workspaceId)
			router.refresh()
		} catch (error) {
			console.error("Failed to switch workspace:", error)
		} finally {
			setSwitching(false)
		}
	}

	const handleWorkspaceCreated = async (workspaceId: string) => {
		await setActiveWorkspace(workspaceId)
		router.refresh()
	}

	const handleDelete = async () => {
		if (!deleteWorkspace || actionPending) return
		setActionPending(true)
		try {
			const result = await deleteWorkspaceAction(deleteWorkspace.id)
			if (result.error) {
				console.error(result.error)
			} else {
				router.refresh()
			}
		} finally {
			setActionPending(false)
			setDeleteWorkspace(null)
		}
	}

	const handleLeave = async () => {
		if (!leaveWorkspace || actionPending) return
		setActionPending(true)
		try {
			const result = await leaveWorkspaceAction(leaveWorkspace.id)
			if (result.error) {
				console.error(result.error)
			} else {
				router.refresh()
			}
		} finally {
			setActionPending(false)
			setLeaveWorkspace(null)
		}
	}

	return (
		<>
			<aside className="shrink-0 w-16 h-screen flex flex-col items-center py-3 bg-sidebar border-r border-sidebar-border overflow-visible">
				{/* All buttons in one vertical flow */}
				<div className="flex flex-col items-center gap-2 w-full">
					{/* Workspace list */}
					{workspaces.map((workspace) => (
						<WorkspaceIcon
							key={workspace.id}
							workspace={workspace}
							isActive={activeWorkspaceId === workspace.id}
							onClick={() => handleWorkspaceSwitch(workspace.id)}
							onDelete={() => setDeleteWorkspace(workspace)}
							onLeave={() => setLeaveWorkspace(workspace)}
							onSettings={() => router.push("/settings")}
						/>
					))}

					{/* Navigation buttons */}
					<NavButton
						icon={Home01Icon}
						label="Home"
						onClick={() => router.push("/")}
					/>
					<NavButton
						icon={Mail01Icon}
						label="Messages"
						onClick={() => router.push("/notifications/messages")}
					/>
					<NavButton
						icon={Navigation04Icon}
						label="Discover"
						onClick={() => router.push("/discover")}
					/>

					{/* Add workspace button */}
					<AddWorkspaceButton onClick={() => setCreateDialogOpen(true)} />
				</div>
			</aside>

			{/* Create Workspace Dialog */}
			<CreateWorkspaceDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
				onCreated={handleWorkspaceCreated}
			/>

			{/* Delete Workspace Confirmation */}
			<AlertDialog open={!!deleteWorkspace} onOpenChange={(open) => !open && setDeleteWorkspace(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete workspace?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete &quot;{deleteWorkspace?.name}&quot; and all its data including
							products, orders, customers, and settings. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={actionPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={actionPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{actionPending ? "Deleting..." : "Delete Workspace"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Leave Workspace Confirmation */}
			<AlertDialog open={!!leaveWorkspace} onOpenChange={(open) => !open && setLeaveWorkspace(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Leave workspace?</AlertDialogTitle>
						<AlertDialogDescription>
							You will lose access to &quot;{leaveWorkspace?.name}&quot;. You&apos;ll need to be
							invited again to rejoin this workspace.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={actionPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleLeave}
							disabled={actionPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{actionPending ? "Leaving..." : "Leave Workspace"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
