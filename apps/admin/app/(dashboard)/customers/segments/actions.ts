"use server"

import { headers } from "next/headers"
import { eq, count, and } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { customerSegments, customerSegmentMembers, users } from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Not authenticated")
	if (session.user.role !== "owner" && session.user.role !== "admin") {
		throw new Error("Insufficient permissions")
	}
	return session.user
}

export async function getSegments() {
	const segments = await db.select().from(customerSegments).orderBy(customerSegments.name)

	// Get member counts
	const counts = await db
		.select({
			segmentId: customerSegmentMembers.segmentId,
			count: count(),
		})
		.from(customerSegmentMembers)
		.groupBy(customerSegmentMembers.segmentId)

	const countMap = Object.fromEntries(counts.map((c) => [c.segmentId, Number(c.count)]))

	return segments.map((s) => ({
		...s,
		memberCount: countMap[s.id] ?? 0,
	}))
}

export async function getSegment(id: string) {
	const [segment] = await db
		.select()
		.from(customerSegments)
		.where(eq(customerSegments.id, id))
		.limit(1)

	if (!segment) throw new Error("Segment not found")

	const members = await db
		.select({
			userId: customerSegmentMembers.userId,
			addedAt: customerSegmentMembers.addedAt,
			userName: users.name,
			userEmail: users.email,
		})
		.from(customerSegmentMembers)
		.innerJoin(users, eq(users.id, customerSegmentMembers.userId))
		.where(eq(customerSegmentMembers.segmentId, id))

	return { ...segment, members }
}

interface SegmentData {
	name: string
	description?: string
	type: string
	rules?: Array<{ field: string; operator: string; value: string }>
	color?: string
}

export async function createSegment(data: SegmentData) {
	await requireAdmin()

	const [segment] = await db
		.insert(customerSegments)
		.values({
			name: data.name,
			description: data.description || null,
			type: data.type,
			rules: data.rules || null,
			color: data.color || "gray",
		})
		.returning()

	await logAudit({
		action: "product.created",
		targetType: "segment",
		targetId: segment.id,
		targetLabel: segment.name,
	})

	return segment
}

export async function updateSegment(id: string, data: Partial<SegmentData>) {
	await requireAdmin()

	const updates: Record<string, unknown> = { updatedAt: new Date() }
	if (data.name !== undefined) updates.name = data.name
	if (data.description !== undefined) updates.description = data.description || null
	if (data.type !== undefined) updates.type = data.type
	if (data.rules !== undefined) updates.rules = data.rules
	if (data.color !== undefined) updates.color = data.color

	const [segment] = await db
		.update(customerSegments)
		.set(updates)
		.where(eq(customerSegments.id, id))
		.returning()

	return segment
}

export async function deleteSegment(id: string) {
	await requireAdmin()
	await db.delete(customerSegments).where(eq(customerSegments.id, id))
	await logAudit({
		action: "product.deleted",
		targetType: "segment",
		targetId: id,
	})
}

export async function addSegmentMember(segmentId: string, userId: string) {
	await requireAdmin()
	await db.insert(customerSegmentMembers).values({ segmentId, userId })
}

export async function removeSegmentMember(segmentId: string, userId: string) {
	await requireAdmin()
	await db
		.delete(customerSegmentMembers)
		.where(
			and(
				eq(customerSegmentMembers.segmentId, segmentId),
				eq(customerSegmentMembers.userId, userId)
			)
		)
}
