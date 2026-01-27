"use server"

import { headers } from "next/headers"
import { eq, and, desc, count, inArray, sql } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { orders, orderItems, orderNotes, users, payments, addresses, inventory, auditLog } from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { pusherServer } from "@/lib/pusher-server"
import { fireWebhooks } from "@/lib/webhooks/outgoing"
import { registerTracking, isTracktryConfigured } from "@/lib/tracking/service"
import { detectCarrier } from "@/lib/tracking/carrier-detector"
import { sendShippingNotification } from "@/lib/email/shipping-notifications"

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
	const { page = 1, pageSize = 30, status, search } = params
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

interface GetOrdersByStatusParams {
	statuses: string[]
	page?: number
	pageSize?: number
}

export async function getOrdersByStatus(params: GetOrdersByStatusParams) {
	const { statuses, page = 1, pageSize = 30 } = params
	const offset = (page - 1) * pageSize

	const [items, [total]] = await Promise.all([
		db
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
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(orders).where(inArray(orders.status, statuses)),
	])

	return { items, totalCount: Number(total.count) }
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

	// Broadcast real-time order update
	if (pusherServer) {
		await pusherServer.trigger("private-orders", "order:updated", {
			orderId: order.id,
			orderNumber: order.orderNumber,
			status: order.status,
			previousStatus: status,
		})
	}

	// Fire outgoing webhooks based on status
	const webhookData = {
		orderId: order.id,
		orderNumber: order.orderNumber,
		status: order.status,
		total: order.total,
		updatedAt: order.updatedAt?.toISOString(),
	}

	await fireWebhooks("order.updated", webhookData)

	if (status === "shipped") {
		await fireWebhooks("order.shipped", {
			...webhookData,
			shippedAt: order.shippedAt?.toISOString(),
			trackingNumber: order.trackingNumber,
		})
	} else if (status === "delivered") {
		await fireWebhooks("order.delivered", {
			...webhookData,
			deliveredAt: order.deliveredAt?.toISOString(),
		})
	}

	return order
}

export async function addTracking(id: string, trackingNumber: string, trackingUrl?: string) {
	await requireAdmin()

	// Auto-detect carrier from tracking number
	const detectedCarrier = detectCarrier(trackingNumber)

	// Generate tracking URL if not provided and carrier detected
	const finalTrackingUrl = trackingUrl || detectedCarrier?.trackingUrl || null

	const [order] = await db
		.update(orders)
		.set({
			trackingNumber,
			trackingUrl: finalTrackingUrl,
			updatedAt: new Date(),
		})
		.where(eq(orders.id, id))
		.returning()

	await logAudit({
		action: "order.updated",
		targetType: "order",
		targetId: id,
		targetLabel: order.orderNumber,
		metadata: {
			action: "tracking_added",
			trackingNumber,
			carrier: detectedCarrier?.name,
		},
	})

	// Register with Tracktry for live updates (if configured)
	if (isTracktryConfigured() && detectedCarrier) {
		const result = await registerTracking(
			trackingNumber,
			detectedCarrier.code,
			order.id
		)
		if (result.success) {
			console.log(`[Tracking] Registered ${trackingNumber} with Tracktry`)
		} else {
			console.warn(`[Tracking] Failed to register with Tracktry: ${result.error}`)
		}
	}

	// Fire webhook for order update
	await fireWebhooks("order.updated", {
		orderId: order.id,
		orderNumber: order.orderNumber,
		status: order.status,
		trackingNumber: order.trackingNumber,
		trackingUrl: order.trackingUrl,
		carrier: detectedCarrier?.name,
		updatedAt: order.updatedAt?.toISOString(),
	})

	// Send "shipped" notification to customer (non-blocking)
	sendShippingNotification({
		orderId: order.id,
		trackingNumber,
		trackingUrl: finalTrackingUrl || undefined,
		carrierName: detectedCarrier?.name,
		status: "shipped",
	}).catch((err) => {
		console.error("[Order] Failed to send shipped notification:", err)
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

	// Fire webhook for order update
	await fireWebhooks("order.updated", {
		orderId: order.id,
		orderNumber: order.orderNumber,
		status: order.status,
		trackingNumber: null,
		trackingUrl: null,
		updatedAt: order.updatedAt?.toISOString(),
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

	// Fire webhook for refund
	await fireWebhooks("order.refunded", {
		orderId: order.id,
		orderNumber: order.orderNumber,
		refundAmount,
		isFullRefund,
		reason,
		status: isFullRefund ? "refunded" : "partially_refunded",
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

	// Fire webhook for cancellation
	await fireWebhooks("order.cancelled", {
		orderId: order.id,
		orderNumber: order.orderNumber,
		total: order.total,
		itemsRestored: items.length,
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

	// Fire webhooks for each order in bulk update
	for (const orderId of ids) {
		await fireWebhooks("order.updated", {
			orderId,
			status,
			bulk: true,
		})

		if (status === "shipped") {
			await fireWebhooks("order.shipped", {
				orderId,
				status,
				shippedAt: new Date().toISOString(),
			})
		} else if (status === "delivered") {
			await fireWebhooks("order.delivered", {
				orderId,
				status,
				deliveredAt: new Date().toISOString(),
			})
		}
	}
}
