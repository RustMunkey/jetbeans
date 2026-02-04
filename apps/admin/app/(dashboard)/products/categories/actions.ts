"use server"

import { eq, and } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { categories } from "@jetbeans/db/schema"
import { logAudit } from "@/lib/audit"
import { slugify } from "@/lib/format"
import { requireWorkspace, checkWorkspacePermission } from "@/lib/workspace"

async function requireCategoriesPermission() {
	const workspace = await requireWorkspace()
	const canManage = await checkWorkspacePermission("canManageProducts")
	if (!canManage) {
		throw new Error("You don't have permission to manage categories")
	}
	return workspace
}

export async function getAllCategories() {
	const workspace = await requireWorkspace()
	return db
		.select()
		.from(categories)
		.where(eq(categories.workspaceId, workspace.id))
		.orderBy(categories.sortOrder)
}

export async function getCategory(id: string) {
	const workspace = await requireWorkspace()
	const [category] = await db
		.select()
		.from(categories)
		.where(and(eq(categories.id, id), eq(categories.workspaceId, workspace.id)))
		.limit(1)
	if (!category) throw new Error("Category not found")
	return category
}

interface CategoryData {
	name: string
	slug?: string
	description?: string
	parentId?: string
	sortOrder?: number
	image?: string
}

export async function createCategory(data: CategoryData) {
	const workspace = await requireCategoriesPermission()

	const slug = data.slug || slugify(data.name)

	const [category] = await db
		.insert(categories)
		.values({
			workspaceId: workspace.id,
			name: data.name,
			slug,
			description: data.description || null,
			parentId: data.parentId || null,
			sortOrder: data.sortOrder ?? 0,
			image: data.image || null,
		})
		.returning()

	await logAudit({
		action: "category.created",
		targetType: "category",
		targetId: category.id,
		targetLabel: category.name,
	})

	return category
}

export async function updateCategory(id: string, data: Partial<CategoryData>) {
	const workspace = await requireCategoriesPermission()

	const updates: Record<string, unknown> = {}
	if (data.name !== undefined) updates.name = data.name
	if (data.slug !== undefined) updates.slug = data.slug
	if (data.description !== undefined) updates.description = data.description || null
	if (data.parentId !== undefined) updates.parentId = data.parentId || null
	if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder
	if (data.image !== undefined) updates.image = data.image || null

	const [category] = await db
		.update(categories)
		.set(updates)
		.where(and(eq(categories.id, id), eq(categories.workspaceId, workspace.id)))
		.returning()

	await logAudit({
		action: "category.updated",
		targetType: "category",
		targetId: id,
		targetLabel: category?.name,
	})

	return category
}

export async function deleteCategory(id: string) {
	const workspace = await requireCategoriesPermission()

	const [category] = await db
		.select({ name: categories.name })
		.from(categories)
		.where(and(eq(categories.id, id), eq(categories.workspaceId, workspace.id)))
		.limit(1)

	if (!category) throw new Error("Category not found")

	await db.delete(categories).where(and(eq(categories.id, id), eq(categories.workspaceId, workspace.id)))

	await logAudit({
		action: "category.deleted",
		targetType: "category",
		targetId: id,
		targetLabel: category?.name,
	})
}
