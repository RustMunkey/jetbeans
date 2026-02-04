"use server"

import { db } from "@jetbeans/db/client"
import { developerNotes, users, workspaceMembers } from "@jetbeans/db/schema"
import { eq, desc, and } from "@jetbeans/db/drizzle"
import { requireWorkspace, checkWorkspacePermission } from "@/lib/workspace"

async function requireNotesPermission() {
	const workspace = await requireWorkspace()
	const canManage = await checkWorkspacePermission("canManageSettings")
	if (!canManage) {
		throw new Error("You don't have permission to manage developer notes")
	}
	return workspace
}

export async function getDeveloperNotes(params?: { status?: string; type?: string }) {
	const workspace = await requireWorkspace()
	const conditions = [eq(developerNotes.workspaceId, workspace.id)]
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
		.where(and(...conditions))
		.orderBy(desc(developerNotes.createdAt))
}

export async function getDeveloperNote(id: string) {
	const workspace = await requireWorkspace()
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
		.where(and(eq(developerNotes.id, id), eq(developerNotes.workspaceId, workspace.id)))
	return note ?? null
}

export async function createDeveloperNote(data: {
	title: string
	body: string
	type?: string
	priority?: string
	assignedTo?: string
}) {
	const workspace = await requireNotesPermission()

	const [note] = await db
		.insert(developerNotes)
		.values({
			workspaceId: workspace.id,
			title: data.title,
			body: data.body,
			type: data.type || "bug",
			priority: data.priority || "medium",
			authorId: workspace.userId,
			assignedTo: data.assignedTo || null,
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
	const workspace = await requireNotesPermission()
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
		.where(and(eq(developerNotes.id, id), eq(developerNotes.workspaceId, workspace.id)))
		.returning()
	return note
}

export async function deleteDeveloperNote(id: string) {
	const workspace = await requireNotesPermission()
	await db.delete(developerNotes).where(and(eq(developerNotes.id, id), eq(developerNotes.workspaceId, workspace.id)))
}

export async function getTeamMembers() {
	const workspace = await requireWorkspace()
	// Get users who are members of this workspace
	return db
		.select({ id: users.id, name: users.name, email: users.email, image: users.image })
		.from(users)
		.innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
		.where(eq(workspaceMembers.workspaceId, workspace.id))
		.orderBy(users.name)
}
