"use server"

import { headers } from "next/headers"
import { eq, desc, sql } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { loyaltyProgram, loyaltyPoints, loyaltyTransactions, users } from "@jetbeans/db/schema"
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

export async function getLoyaltyConfig() {
	const [config] = await db.select().from(loyaltyProgram).limit(1)
	return config ?? null
}

export async function updateLoyaltyConfig(data: {
	pointsPerDollar: number
	pointsRedemptionRate: string
	tiers: Array<{ name: string; minPoints: number; perks: string[] }>
	isActive: boolean
}) {
	await requireAdmin()

	const [existing] = await db.select().from(loyaltyProgram).limit(1)

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
			.where(eq(loyaltyProgram.id, existing.id))
			.returning()
		return updated
	} else {
		const [created] = await db
			.insert(loyaltyProgram)
			.values({
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
		.orderBy(desc(loyaltyPoints.points))
		.limit(limit)

	return holders
}

export async function getRecentTransactions(limit = 50) {
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
		.orderBy(desc(loyaltyTransactions.createdAt))
		.limit(limit)

	return transactions
}

export async function adjustPoints(userId: string, points: number, reason: string) {
	await requireAdmin()

	const type = points > 0 ? "earned" : "adjusted"

	// Upsert loyalty points
	const [existing] = await db
		.select()
		.from(loyaltyPoints)
		.where(eq(loyaltyPoints.userId, userId))
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
			.where(eq(loyaltyPoints.userId, userId))
	} else {
		await db.insert(loyaltyPoints).values({
			userId,
			points: Math.max(0, points),
			lifetimePoints: Math.max(0, points),
		})
	}

	// Record transaction
	await db.insert(loyaltyTransactions).values({
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
