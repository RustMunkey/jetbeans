"use server"

import { headers } from "next/headers"
import { eq, and, desc, count, inArray, sql } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { orders, orderItems, orderNotes, users, payments, addresses, inventory, auditLog } from "@jetbeans/db/schema"
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

const ORDER_STATUSES = ["pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled", "refunded", "partially_refunded", "returned"] as const

interface GetOrdersParams {
	page?: number
	pageSize?: number
	status?: string
	search?: string
}

export async function getOrders(params: GetOrdersParams = {}) {
	const { page = 1, pageSize = 20, status, search } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (status && status !== "all") {
		conditions.push(eq(orders.status, status))
	}
	if (search) {
		conditions.push(sql`(${orders.orderNumber} ILIKE ${`%${search}%`} OR ${users.name} ILIKE ${`%${search}%`})`)
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: orders.id,
				orderNumber: orders.orderNumber,
				status: orders.status,
				total: orders.total,
				customerName: users.name,
				customerEmail: users.email,
				createdAt: orders.createdAt,
			})
			.from(orders)
			.leftJoin(users, eq(orders.userId, users.id))
			.where(where)
			.orderBy(desc(orders.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(orders).leftJoin(users, eq(orders.userId, users.id)).where(where),
	])

	return { items, totalCount: Number(total.count) }
}

export async function getOrdersByStatus(statuses: string[]) {
	return db
		.select({
			id: orders.id,
			orderNumber: orders.orderNumber,
			status: orders.status,
			total: orders.total,
			customerName: users.name,
			trackingNumber: orders.trackingNumber,
			createdAt: orders.createdAt,
		})
		.from(orders)
		.leftJoin(users, eq(orders.userId, users.id))
		.where(inArray(orders.status, statuses))
		.orderBy(desc(orders.createdAt))
		.limit(100)
}

export async function getOrder(id: string) {
	const [order] = await db
		.select()
		.from(orders)
		.where(eq(orders.id, id))
		.limit(1)

	if (!order) throw new Error("Order not found")

	const [customer] = await db
		.select({ name: users.name, email: users.email, phone: users.phone })
		.from(users)
		.where(eq(users.id, order.userId))
		.limit(1)

	const items = await db
		.select()
		.from(orderItems)
		.where(eq(orderItems.orderId, id))

	const payment = await db
		.select()
		.from(payments)
		.where(eq(payments.orderId, id))
		.limit(1)
		.then((r) => r[0] ?? null)

	const shippingAddress = order.shippingAddressId
		? await db.select().from(addresses).where(eq(addresses.id, order.shippingAddressId)).limit(1).then((r) => r[0] ?? null)
		: null

	return { ...order, customer, items, payment, shippingAddress }
}

export async function updateOrderStatus(id: string, status: string) {
	await requireAdmin()

	if (!ORDER_STATUSES.includes(status as any)) {
		throw new Error("Invalid status")
	}

	const updates: Record<string, unknown> = { status, updatedAt: new Date() }
	if (status === "shipped") updates.shippedAt = new Date()
	if (status === "delivered") updates.deliveredAt = new Date()

	const [order] = await db
		.update(orders)
		.set(updates)
		.where(eq(orders.id, id))
		.returning()

	await logAudit({
		action: "order.updated",
		targetType: "order",
		targetId: id,
		targetLabel: order.orderNumber,
		metadata: { newStatus: status },
	})

	return order
}

export async function addTracking(id: string, trackingNumber: string, trackingUrl?: string) {
	await requireAdmin()

	const [order] = await db
		.update(orders)
		.set({
			trackingNumber,
			trackingUrl: trackingUrl || null,
			updatedAt: new Date(),
		})
		.where(eq(orders.id, id))
		.returning()

	await logAudit({
		action: "order.updated",
		targetType: "order",
		targetId: id,
		targetLabel: order.orderNumber,
		metadata: { action: "tracking_added", trackingNumber },
	})

	return order
}

export async function removeTracking(id: string) {
	await requireAdmin()

	const [order] = await db
		.update(orders)
		.set({
			trackingNumber: null,
			trackingUrl: null,
			updatedAt: new Date(),
		})
		.where(eq(orders.id, id))
		.returning()

	await logAudit({
		action: "order.updated",
		targetType: "order",
		targetId: id,
		targetLabel: order.orderNumber,
		metadata: { action: "tracking_removed" },
	})

	return order
}


export async function processRefund(id: string, amount: string, reason: string) {
	await requireAdmin()

	const [order] = await db
		.select()
		.from(orders)
		.where(eq(orders.id, id))
		.limit(1)

	if (!order) throw new Error("Order not found")

	const refundAmount = parseFloat(amount)
	const orderTotal = parseFloat(order.total)
	const isFullRefund = refundAmount >= orderTotal

	await db
		.update(orders)
		.set({
			status: isFullRefund ? "refunded" : "partially_refunded",
			updatedAt: new Date(),
		})
		.where(eq(orders.id, id))

	// Update payment if exists
	await db
		.update(payments)
		.set({ status: "refunded", refundedAt: new Date() })
		.where(eq(payments.orderId, id))

	await logAudit({
		action: "order.refunded",
		targetType: "order",
		targetId: id,
		targetLabel: order.orderNumber,
		metadata: { amount: refundAmount, reason, isFullRefund },
	})
}

export async function cancelOrder(id: string) {
	await requireAdmin()

	const [order] = await db
		.select()
		.from(orders)
		.where(eq(orders.id, id))
		.limit(1)

	if (!order) throw new Error("Order not found")

	await db
		.update(orders)
		.set({ status: "cancelled", updatedAt: new Date() })
		.where(eq(orders.id, id))

	// Restore inventory for order items
	const items = await db
		.select()
		.from(orderItems)
		.where(eq(orderItems.orderId, id))

	for (const item of items) {
		await db
			.update(inventory)
			.set({
				quantity: sql`${inventory.quantity} + ${item.quantity}`,
				updatedAt: new Date(),
			})
			.where(eq(inventory.variantId, item.variantId))
	}

	await logAudit({
		action: "order.updated",
		targetType: "order",
		targetId: id,
		targetLabel: order.orderNumber,
		metadata: { action: "cancelled" },
	})
}

// --- Order Notes CRUD ---

export async function getOrderNotes(orderId: string) {
	await requireAdmin()

	return db
		.select({
			id: orderNotes.id,
			content: orderNotes.content,
			createdAt: orderNotes.createdAt,
			updatedAt: orderNotes.updatedAt,
			authorName: users.name,
			authorEmail: users.email,
		})
		.from(orderNotes)
		.leftJoin(users, eq(orderNotes.createdBy, users.id))
		.where(eq(orderNotes.orderId, orderId))
		.orderBy(desc(orderNotes.createdAt))
}

export async function addOrderNote(orderId: string, content: string) {
	const user = await requireAdmin()

	const [note] = await db
		.insert(orderNotes)
		.values({
			orderId,
			content,
			createdBy: user.id,
		})
		.returning()

	return note
}

export async function updateOrderNote(noteId: string, content: string) {
	await requireAdmin()

	const [note] = await db
		.update(orderNotes)
		.set({ content, updatedAt: new Date() })
		.where(eq(orderNotes.id, noteId))
		.returning()

	return note
}

export async function deleteOrderNote(noteId: string) {
	await requireAdmin()

	await db.delete(orderNotes).where(eq(orderNotes.id, noteId))
}

export async function getOrderActivity(orderId: string) {
	await requireAdmin()

	return db
		.select({
			id: auditLog.id,
			action: auditLog.action,
			userName: auditLog.userName,
			metadata: auditLog.metadata,
			createdAt: auditLog.createdAt,
		})
		.from(auditLog)
		.where(and(eq(auditLog.targetType, "order"), eq(auditLog.targetId, orderId)))
		.orderBy(desc(auditLog.createdAt))
		.limit(20)
}

export async function clearOrderActivity(orderId: string) {
	await requireAdmin()

	await db
		.delete(auditLog)
		.where(and(eq(auditLog.targetType, "order"), eq(auditLog.targetId, orderId)))
}

export async function bulkUpdateOrderStatus(ids: string[], status: string) {
	await requireAdmin()

	const updates: Record<string, unknown> = { status, updatedAt: new Date() }
	if (status === "shipped") updates.shippedAt = new Date()

	await db
		.update(orders)
		.set(updates)
		.where(inArray(orders.id, ids))

	await logAudit({
		action: "order.updated",
		targetType: "order",
		metadata: { count: ids.length, newStatus: status, bulk: true },
	})
}
