"use server"

import { headers } from "next/headers"
import { eq, and, desc, count } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { subscriptions, subscriptionItems, users, productVariants, products } from "@jetbeans/db/schema"
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

interface GetSubscriptionsParams {
	page?: number
	pageSize?: number
	status?: string
}

export async function getSubscriptions(params: GetSubscriptionsParams = {}) {
	const { page = 1, pageSize = 20, status } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (status) {
		if (status === "cancelled") {
			conditions.push(eq(subscriptions.status, "cancelled"))
		} else {
			conditions.push(eq(subscriptions.status, status))
		}
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: subscriptions.id,
				userId: subscriptions.userId,
				status: subscriptions.status,
				frequency: subscriptions.frequency,
				pricePerDelivery: subscriptions.pricePerDelivery,
				nextDeliveryAt: subscriptions.nextDeliveryAt,
				lastDeliveryAt: subscriptions.lastDeliveryAt,
				totalDeliveries: subscriptions.totalDeliveries,
				cancelledAt: subscriptions.cancelledAt,
				cancellationReason: subscriptions.cancellationReason,
				createdAt: subscriptions.createdAt,
				customerName: users.name,
				customerEmail: users.email,
			})
			.from(subscriptions)
			.leftJoin(users, eq(subscriptions.userId, users.id))
			.where(where)
			.orderBy(desc(subscriptions.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(subscriptions).where(where),
	])

	return { items, totalCount: total.count }
}

export async function getSubscription(id: string) {
	const [sub] = await db
		.select({
			id: subscriptions.id,
			userId: subscriptions.userId,
			status: subscriptions.status,
			frequency: subscriptions.frequency,
			pricePerDelivery: subscriptions.pricePerDelivery,
			nextDeliveryAt: subscriptions.nextDeliveryAt,
			lastDeliveryAt: subscriptions.lastDeliveryAt,
			totalDeliveries: subscriptions.totalDeliveries,
			cancelledAt: subscriptions.cancelledAt,
			cancellationReason: subscriptions.cancellationReason,
			createdAt: subscriptions.createdAt,
			updatedAt: subscriptions.updatedAt,
			customerName: users.name,
			customerEmail: users.email,
		})
		.from(subscriptions)
		.leftJoin(users, eq(subscriptions.userId, users.id))
		.where(eq(subscriptions.id, id))
		.limit(1)

	if (!sub) return null

	const items = await db
		.select({
			id: subscriptionItems.id,
			quantity: subscriptionItems.quantity,
			variantId: subscriptionItems.variantId,
			variantName: productVariants.name,
			variantSku: productVariants.sku,
			productName: products.name,
			productPrice: products.price,
			variantPrice: productVariants.price,
		})
		.from(subscriptionItems)
		.innerJoin(productVariants, eq(subscriptionItems.variantId, productVariants.id))
		.innerJoin(products, eq(productVariants.productId, products.id))
		.where(eq(subscriptionItems.subscriptionId, id))

	return { ...sub, items }
}

export async function updateSubscriptionStatus(id: string, status: string) {
	await requireAdmin()

	const updates: Record<string, unknown> = {
		status,
		updatedAt: new Date(),
	}

	if (status === "cancelled") {
		updates.cancelledAt = new Date()
		updates.nextDeliveryAt = null
	} else if (status === "active") {
		updates.cancelledAt = null
		updates.cancellationReason = null
	} else if (status === "paused") {
		updates.nextDeliveryAt = null
	}

	await db.update(subscriptions).set(updates).where(eq(subscriptions.id, id))

	await logAudit({
		action: `subscription.${status}`,
		targetType: "subscription",
		targetId: id,
	})
}

export async function cancelSubscription(id: string, reason: string) {
	await requireAdmin()

	await db
		.update(subscriptions)
		.set({
			status: "cancelled",
			cancelledAt: new Date(),
			cancellationReason: reason,
			nextDeliveryAt: null,
			updatedAt: new Date(),
		})
		.where(eq(subscriptions.id, id))

	await logAudit({
		action: "subscription.cancelled",
		targetType: "subscription",
		targetId: id,
		metadata: { reason },
	})
}

export async function resumeSubscription(id: string) {
	await requireAdmin()

	const nextDelivery = new Date()
	nextDelivery.setDate(nextDelivery.getDate() + 7)

	await db
		.update(subscriptions)
		.set({
			status: "active",
			cancelledAt: null,
			cancellationReason: null,
			nextDeliveryAt: nextDelivery,
			updatedAt: new Date(),
		})
		.where(eq(subscriptions.id, id))

	await logAudit({
		action: "subscription.resumed",
		targetType: "subscription",
		targetId: id,
	})
}

export async function updateFrequency(id: string, frequency: string) {
	await requireAdmin()

	await db
		.update(subscriptions)
		.set({ frequency, updatedAt: new Date() })
		.where(eq(subscriptions.id, id))

	await logAudit({
		action: "subscription.frequency_updated",
		targetType: "subscription",
		targetId: id,
		metadata: { frequency },
	})
}
