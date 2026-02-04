"use server"

import { eq, desc, sql, and } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { loyaltyProgram, loyaltyPoints, loyaltyTransactions, users } from "@jetbeans/db/schema"
import { logAudit } from "@/lib/audit"
import { requireWorkspace, checkWorkspacePermission } from "@/lib/workspace"

async function requireLoyaltyPermission() {
	const workspace = await requireWorkspace()
	const canManage = await checkWorkspacePermission("canManageCustomers")
	if (!canManage) {
		throw new Error("You don't have permission to manage loyalty")
	}
	return workspace
}

export async function getLoyaltyConfig() {
	const workspace = await requireWorkspace()
	const [config] = await db
		.select()
		.from(loyaltyProgram)
		.where(eq(loyaltyProgram.workspaceId, workspace.id))
		.limit(1)
	return config ?? null
}

export async function updateLoyaltyConfig(data: {
	pointsPerDollar: number
	pointsRedemptionRate: string
	tiers: Array<{ name: string; minPoints: number; perks: string[] }>
	isActive: boolean
}) {
	const workspace = await requireLoyaltyPermission()

	const [existing] = await db
		.select()
		.from(loyaltyProgram)
		.where(eq(loyaltyProgram.workspaceId, workspace.id))
		.limit(1)

	if (existing) {
		const [updated] = await db
			.update(loyaltyProgram)
			.set({
				pointsPerDollar: data.pointsPerDollar,
				pointsRedemptionRate: data.pointsRedemptionRate,
				tiers: data.tiers,
				isActive: data.isActive,
				updatedAt: new Date(),
			})
			.where(and(eq(loyaltyProgram.id, existing.id), eq(loyaltyProgram.workspaceId, workspace.id)))
			.returning()
		return updated
	} else {
		const [created] = await db
			.insert(loyaltyProgram)
			.values({
				workspaceId: workspace.id,
				pointsPerDollar: data.pointsPerDollar,
				pointsRedemptionRate: data.pointsRedemptionRate,
				tiers: data.tiers,
				isActive: data.isActive,
			})
			.returning()
		return created
	}
}

export async function getTopPointHolders(limit = 20) {
	const workspace = await requireWorkspace()
	const holders = await db
		.select({
			userId: loyaltyPoints.userId,
			points: loyaltyPoints.points,
			lifetimePoints: loyaltyPoints.lifetimePoints,
			tier: loyaltyPoints.tier,
			userName: users.name,
			userEmail: users.email,
		})
		.from(loyaltyPoints)
		.innerJoin(users, eq(users.id, loyaltyPoints.userId))
		.where(eq(loyaltyPoints.workspaceId, workspace.id))
		.orderBy(desc(loyaltyPoints.points))
		.limit(limit)

	return holders
}

export async function getRecentTransactions(limit = 50) {
	const workspace = await requireWorkspace()
	const transactions = await db
		.select({
			id: loyaltyTransactions.id,
			userId: loyaltyTransactions.userId,
			type: loyaltyTransactions.type,
			points: loyaltyTransactions.points,
			description: loyaltyTransactions.description,
			createdAt: loyaltyTransactions.createdAt,
			userName: users.name,
			userEmail: users.email,
		})
		.from(loyaltyTransactions)
		.innerJoin(users, eq(users.id, loyaltyTransactions.userId))
		.where(eq(loyaltyTransactions.workspaceId, workspace.id))
		.orderBy(desc(loyaltyTransactions.createdAt))
		.limit(limit)

	return transactions
}

export async function adjustPoints(userId: string, points: number, reason: string) {
	const workspace = await requireLoyaltyPermission()

	const type = points > 0 ? "earned" : "adjusted"

	// Upsert loyalty points
	const [existing] = await db
		.select()
		.from(loyaltyPoints)
		.where(and(eq(loyaltyPoints.userId, userId), eq(loyaltyPoints.workspaceId, workspace.id)))
		.limit(1)

	if (existing) {
		await db
			.update(loyaltyPoints)
			.set({
				points: sql`${loyaltyPoints.points} + ${points}`,
				lifetimePoints: points > 0
					? sql`${loyaltyPoints.lifetimePoints} + ${points}`
					: loyaltyPoints.lifetimePoints,
				updatedAt: new Date(),
			})
			.where(and(eq(loyaltyPoints.userId, userId), eq(loyaltyPoints.workspaceId, workspace.id)))
	} else {
		await db.insert(loyaltyPoints).values({
			workspaceId: workspace.id,
			userId,
			points: Math.max(0, points),
			lifetimePoints: Math.max(0, points),
		})
	}

	// Record transaction
	await db.insert(loyaltyTransactions).values({
		workspaceId: workspace.id,
		userId,
		type,
		points,
		description: reason,
	})

	await logAudit({
		action: "loyalty.adjusted",
		targetType: "user",
		targetId: userId,
		targetLabel: `${points > 0 ? "+" : ""}${points} points: ${reason}`,
	})
}
