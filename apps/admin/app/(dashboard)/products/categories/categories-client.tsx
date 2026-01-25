"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { slugify } from "@/lib/format"
import { createCategory, updateCategory, deleteCategory } from "./actions"
import { useDraft, type Draft } from "@/lib/use-draft"
import { DraftIndicator, DraftStatus } from "@/components/drafts-manager"

interface Category {
	id: string
	name: string
	slug: string
	description: string | null
	parentId: string | null
	sortOrder: number | null
	image: string | null
}

interface CategoriesClientProps {
	categories: Category[]
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
	const router = useRouter()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [deleteId, setDeleteId] = useState<string | null>(null)
	const [editing, setEditing] = useState<Category | null>(null)
	const [loading, setLoading] = useState(false)

	const [name, setName] = useState("")
	const [slug, setSlug] = useState("")
	const [description, setDescription] = useState("")
	const [parentId, setParentId] = useState("")

	// Draft support
	type CategoryFormData = {
		name: string
		slug: string
		description: string
		parentId: string
	}

	const {
		lastSaved: draftLastSaved,
		isSaving: draftIsSaving,
		debouncedSave: saveDraft,
		discardDraft,
		loadDraft,
		clearCurrentDraft,
	} = useDraft<CategoryFormData>({
		key: "category",
		getTitle: (data) => data.name || "Untitled Category",
		autoSave: true,
	})

	// Auto-save draft when form data changes (only when creating new)
	useEffect(() => {
		if (dialogOpen && !editing && name) {
			saveDraft({ name, slug, description, parentId })
		}
	}, [dialogOpen, editing, name, slug, description, parentId, saveDraft])

	function handleLoadDraft(draft: Draft) {
		const data = draft.data as CategoryFormData
		setName(data.name || "")
		setSlug(data.slug || "")
		setDescription(data.description || "")
		setParentId(data.parentId || "")
		loadDraft(draft)
		setEditing(null)
		setDialogOpen(true)
	}

	const openCreate = () => {
		setEditing(null)
		setName("")
		setSlug("")
		setDescription("")
		setParentId("")
		clearCurrentDraft()
		setDialogOpen(true)
	}

	const openEdit = (cat: Category) => {
		setEditing(cat)
		setName(cat.name)
		setSlug(cat.slug)
		setDescription(cat.description ?? "")
		setParentId(cat.parentId ?? "")
		setDialogOpen(true)
	}

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("Name is required")
			return
		}
		setLoading(true)
		try {
			const data = {
				name: name.trim(),
				slug: slug.trim() || slugify(name),
				description: description.trim(),
				parentId: parentId || undefined,
			}
			if (editing) {
				await updateCategory(editing.id, data)
				toast.success("Category updated")
			} else {
				await createCategory(data)
				toast.success("Category created")
				discardDraft()
			}
			setDialogOpen(false)
			router.refresh()
		} catch (e: any) {
			toast.error(e.message)
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async () => {
		if (!deleteId) return
		try {
			await deleteCategory(deleteId)
			toast.success("Category deleted")
			setDeleteId(null)
			router.refresh()
		} catch (e: any) {
			toast.error(e.message)
		}
	}

	// Build tree structure
	const roots = categories.filter((c) => !c.parentId)
	const children = (parentId: string) => categories.filter((c) => c.parentId === parentId)

	const renderCategory = (cat: Category, depth: number = 0) => (
		<div key={cat.id}>
			<div
				className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
				style={{ paddingLeft: `${16 + depth * 24}px` }}
			>
				<div className="space-y-0.5">
					<span className="text-sm font-medium">{cat.name}</span>
					{cat.description && (
						<p className="text-xs text-muted-foreground">{cat.description}</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
						Edit
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="text-destructive"
						onClick={() => setDeleteId(cat.id)}
					>
						Delete
					</Button>
				</div>
			</div>
			{children(cat.id).map((child) => renderCategory(child, depth + 1))}
		</div>
	)

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Categories</h2>
					<p className="text-sm text-muted-foreground">
						Organize products into categories.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<DraftIndicator
						draftKey="category"
						onSelect={handleLoadDraft}
					/>
					<Button size="sm" onClick={openCreate}>Add Category</Button>
				</div>
			</div>

			{categories.length === 0 ? (
				<div className="rounded-lg border px-4 py-12 text-center">
					<p className="text-sm text-muted-foreground">No categories yet</p>
					<p className="text-xs text-muted-foreground/60 mt-1">
						Create categories to organize your products.
					</p>
				</div>
			) : (
				<div className="rounded-lg border divide-y">
					{roots.map((cat) => renderCategory(cat))}
				</div>
			)}

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="cat-name">Name</Label>
							<Input
								id="cat-name"
								value={name}
								onChange={(e) => {
									setName(e.target.value)
									if (!editing) setSlug(slugify(e.target.value))
								}}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="cat-slug">Slug</Label>
							<Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="cat-desc">Description</Label>
							<Input id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="cat-parent">Parent Category</Label>
							<Select value={parentId || "none"} onValueChange={(val) => setParentId(val === "none" ? "" : val)}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="None (top level)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None (top level)</SelectItem>
									{categories
										.filter((c) => c.id !== editing?.id)
										.map((c) => (
											<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter className="flex-col sm:flex-row gap-2">
						{!editing && (
							<div className="flex-1 flex items-center">
								<DraftStatus lastSaved={draftLastSaved} isSaving={draftIsSaving} />
							</div>
						)}
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
							<Button onClick={handleSave} disabled={loading}>
								{loading ? "Saving..." : editing ? "Update" : "Create"}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Category</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove the category. Products in this category will become uncategorized.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
