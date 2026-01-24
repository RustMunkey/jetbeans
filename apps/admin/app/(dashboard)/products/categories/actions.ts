"use server"

import { headers } from "next/headers"
import { eq } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { categories } from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { slugify } from "@/lib/format"

async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Not authenticated")
	if (session.user.role !== "owner" && session.user.role !== "admin") {
		throw new Error("Insufficient permissions")
	}
	return session.user
}

export async function getAllCategories() {
	return db.select().from(categories).orderBy(categories.sortOrder)
}

export async function getCategory(id: string) {
	const [category] = await db
		.select()
		.from(categories)
		.where(eq(categories.id, id))
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
	await requireAdmin()

	const slug = data.slug || slugify(data.name)

	const [category] = await db
		.insert(categories)
		.values({
			name: data.name,
			slug,
			description: data.description || null,
			parentId: data.parentId || null,
			sortOrder: data.sortOrder ?? 0,
			image: data.image || null,
		})
		.returning()

	await logAudit({
		action: "product.updated",
		targetType: "category",
		targetId: category.id,
		targetLabel: category.name,
		metadata: { action: "category_created" },
	})

	return category
}

export async function updateCategory(id: string, data: Partial<CategoryData>) {
	await requireAdmin()

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
		.where(eq(categories.id, id))
		.returning()

	await logAudit({
		action: "product.updated",
		targetType: "category",
		targetId: id,
		targetLabel: category.name,
		metadata: { action: "category_updated" },
	})

	return category
}

export async function deleteCategory(id: string) {
	await requireAdmin()

	const [category] = await db
		.select({ name: categories.name })
		.from(categories)
		.where(eq(categories.id, id))
		.limit(1)

	await db.delete(categories).where(eq(categories.id, id))

	await logAudit({
		action: "product.updated",
		targetType: "category",
		targetId: id,
		targetLabel: category?.name,
		metadata: { action: "category_deleted" },
	})
}
