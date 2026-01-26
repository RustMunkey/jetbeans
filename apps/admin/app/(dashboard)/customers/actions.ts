"use server"

import { eq, desc, sql, ne, count, and, inArray } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { users, orders, customerSegments, customerSegmentMembers, loyaltyPoints } from "@jetbeans/db/schema"

interface GetCustomersParams {
	page?: number
	pageSize?: number
	search?: string
	segment?: string
}

export async function getCustomers(params: GetCustomersParams = {}) {
	const { page = 1, pageSize = 30, search, segment } = params
	const offset = (page - 1) * pageSize

	// Customers are users who are NOT admin/owner role (or have placed orders)
	// For now, exclude admin-panel users by role
	const baseConditions = [ne(users.role, "owner"), ne(users.role, "admin")]
	if (search) {
		baseConditions.push(
			sql`(${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})`
		)
	}

	// If filtering by segment, add the segment condition to the query
	if (segment) {
		const segmentSubquery = db
			.select({ userId: customerSegmentMembers.userId })
			.from(customerSegmentMembers)
			.where(eq(customerSegmentMembers.segmentId, segment))
		baseConditions.push(inArray(users.id, segmentSubquery))
	}

	const where = and(...baseConditions)

	// Get customers with pagination applied AFTER segment filter
	const customerRows = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			phone: users.phone,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(where)
		.orderBy(desc(users.createdAt))
		.limit(pageSize)
		.offset(offset)

	const [total] = await db.select({ count: count() }).from(users).where(where)

	// Use customerRows directly (segment filtering now happens in SQL)
	const filteredRows = customerRows

	// Get order stats for these users
	const customerIds = filteredRows.map((c) => c.id)
	let orderStats: Record<string, { orderCount: number; totalSpent: string; lastOrderAt: Date | null }> = {}

	if (customerIds.length > 0) {
		const stats = await db
			.select({
				userId: orders.userId,
				orderCount: count().as("order_count"),
				totalSpent: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`.as("total_spent"),
				lastOrderAt: sql<Date | null>`MAX(${orders.createdAt})`.as("last_order_at"),
			})
			.from(orders)
			.where(inArray(orders.userId, customerIds))
			.groupBy(orders.userId)

		orderStats = Object.fromEntries(
			stats.map((s) => [s.userId, { orderCount: Number(s.orderCount), totalSpent: s.totalSpent, lastOrderAt: s.lastOrderAt }])
		)
	}

	const items = filteredRows.map((c) => ({
		...c,
		orderCount: orderStats[c.id]?.orderCount ?? 0,
		totalSpent: orderStats[c.id]?.totalSpent ?? "0",
		lastOrderAt: orderStats[c.id]?.lastOrderAt ?? null,
	}))

	return { items, totalCount: Number(total.count) }
}

export async function getCustomer(id: string) {
	const [customer] = await db
		.select()
		.from(users)
		.where(eq(users.id, id))
		.limit(1)

	if (!customer) throw new Error("Customer not found")

	// Get order history
	const customerOrders = await db
		.select({
			id: orders.id,
			orderNumber: orders.orderNumber,
			status: orders.status,
			total: orders.total,
			createdAt: orders.createdAt,
		})
		.from(orders)
		.where(eq(orders.userId, id))
		.orderBy(desc(orders.createdAt))
		.limit(20)

	// Get segments
	const segments = await db
		.select({
			id: customerSegments.id,
			name: customerSegments.name,
			color: customerSegments.color,
		})
		.from(customerSegmentMembers)
		.innerJoin(customerSegments, eq(customerSegments.id, customerSegmentMembers.segmentId))
		.where(eq(customerSegmentMembers.userId, id))

	// Get loyalty
	const [loyalty] = await db
		.select()
		.from(loyaltyPoints)
		.where(eq(loyaltyPoints.userId, id))
		.limit(1)

	// Aggregates
	const orderCount = customerOrders.length
	const totalSpent = customerOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)

	return {
		...customer,
		orders: customerOrders,
		segments,
		loyalty: loyalty ?? null,
		orderCount,
		totalSpent,
	}
}
