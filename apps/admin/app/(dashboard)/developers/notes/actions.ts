"use server"

import { db } from "@jetbeans/db/client"
import { developerNotes, users } from "@jetbeans/db/schema"
import { eq, desc, and } from "@jetbeans/db/drizzle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function getCurrentUser() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) {
		throw new Error("Not authenticated")
	}
	return session.user
}

export async function getDeveloperNotes(params?: { status?: string; type?: string }) {
	await getCurrentUser() // Just verify user is logged in

	const conditions = []
	if (params?.status && params.status !== "all") {
		conditions.push(eq(developerNotes.status, params.status))
	}
	if (params?.type && params.type !== "all") {
		conditions.push(eq(developerNotes.type, params.type))
	}

	return db
		.select({
			id: developerNotes.id,
			title: developerNotes.title,
			body: developerNotes.body,
			type: developerNotes.type,
			status: developerNotes.status,
			priority: developerNotes.priority,
			authorId: developerNotes.authorId,
			authorName: users.name,
			authorImage: users.image,
			assignedTo: developerNotes.assignedTo,
			resolvedAt: developerNotes.resolvedAt,
			createdAt: developerNotes.createdAt,
			updatedAt: developerNotes.updatedAt,
		})
		.from(developerNotes)
		.leftJoin(users, eq(developerNotes.authorId, users.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(developerNotes.createdAt))
		.limit(200)
}

export async function getDeveloperNote(id: string) {
	await getCurrentUser()
	const [note] = await db
		.select({
			id: developerNotes.id,
			title: developerNotes.title,
			body: developerNotes.body,
			type: developerNotes.type,
			status: developerNotes.status,
			priority: developerNotes.priority,
			authorId: developerNotes.authorId,
			authorName: users.name,
			authorImage: users.image,
			assignedTo: developerNotes.assignedTo,
			resolvedAt: developerNotes.resolvedAt,
			createdAt: developerNotes.createdAt,
			updatedAt: developerNotes.updatedAt,
		})
		.from(developerNotes)
		.leftJoin(users, eq(developerNotes.authorId, users.id))
		.where(eq(developerNotes.id, id))
	return note ?? null
}

export async function createDeveloperNote(data: {
	title: string
	body: string
	type?: string
	priority?: string
	assignedTo?: string
}) {
	const user = await getCurrentUser()

	const [note] = await db
		.insert(developerNotes)
		.values({
			title: data.title,
			body: data.body,
			type: data.type || "bug",
			priority: data.priority || "medium",
			authorId: user.id,
			assignedTo: data.assignedTo || null,
			isGlobal: true,
		})
		.returning()
	return note
}

export async function updateDeveloperNote(id: string, data: {
	title?: string
	body?: string
	type?: string
	status?: string
	priority?: string
	assignedTo?: string | null
}) {
	await getCurrentUser()
	const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() }

	// If status changed to resolved or closed, set resolvedAt
	if (data.status === "resolved" || data.status === "closed") {
		updateData.resolvedAt = new Date()
	} else if (data.status === "open" || data.status === "in_progress") {
		updateData.resolvedAt = null
	}

	const [note] = await db
		.update(developerNotes)
		.set(updateData)
		.where(eq(developerNotes.id, id))
		.returning()
	return note
}

export async function deleteDeveloperNote(id: string) {
	await getCurrentUser()
	await db.delete(developerNotes).where(eq(developerNotes.id, id))
}

export async function getAllUsers() {
	await getCurrentUser()
	// Get all users for assignment
	return db
		.select({ id: users.id, name: users.name, email: users.email, image: users.image })
		.from(users)
		.orderBy(users.name)
}
