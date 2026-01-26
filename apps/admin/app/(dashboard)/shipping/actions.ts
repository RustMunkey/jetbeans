"use server"

import { headers } from "next/headers"
import { eq, and, desc, count, sql } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import {
	shippingCarriers,
	shippingRates,
	shippingZones,
	shippingZoneRates,
	shippingLabels,
	shipmentTracking,
	trustedSenders,
	orders,
} from "@jetbeans/db/schema"
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

// --- CARRIERS ---

interface GetCarriersParams {
	page?: number
	pageSize?: number
}

export async function getCarriers(params: GetCarriersParams = {}) {
	const { page = 1, pageSize = 30 } = params
	const offset = (page - 1) * pageSize

	const [items, [total]] = await Promise.all([
		db
			.select()
			.from(shippingCarriers)
			.orderBy(desc(shippingCarriers.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(shippingCarriers),
	])

	return { items, totalCount: total.count }
}

export async function getCarrier(id: string) {
	const [carrier] = await db
		.select()
		.from(shippingCarriers)
		.where(eq(shippingCarriers.id, id))
		.limit(1)

	if (!carrier) return null

	const rates = await db
		.select()
		.from(shippingRates)
		.where(eq(shippingRates.carrierId, id))
		.orderBy(shippingRates.name)

	return { ...carrier, rates }
}

export async function createCarrier(data: { name: string; code: string; trackingUrlTemplate?: string }) {
	await requireAdmin()

	const [carrier] = await db
		.insert(shippingCarriers)
		.values(data)
		.returning()

	await logAudit({
		action: "carrier.created",
		targetType: "carrier",
		targetId: carrier.id,
		metadata: { name: data.name },
	})

	return carrier
}

export async function updateCarrier(id: string, data: { name?: string; code?: string; trackingUrlTemplate?: string; isActive?: boolean }) {
	await requireAdmin()

	await db
		.update(shippingCarriers)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(shippingCarriers.id, id))

	await logAudit({
		action: "carrier.updated",
		targetType: "carrier",
		targetId: id,
	})
}

export async function deleteCarrier(id: string) {
	await requireAdmin()

	await db.delete(shippingCarriers).where(eq(shippingCarriers.id, id))

	await logAudit({
		action: "carrier.deleted",
		targetType: "carrier",
		targetId: id,
	})
}

// --- RATES ---

export async function createRate(data: {
	carrierId: string
	name: string
	minWeight?: string
	maxWeight?: string
	flatRate?: string
	perKgRate?: string
	estimatedDays?: string
}) {
	await requireAdmin()

	const [rate] = await db.insert(shippingRates).values(data).returning()

	await logAudit({
		action: "rate.created",
		targetType: "rate",
		targetId: rate.id,
		metadata: { name: data.name, carrierId: data.carrierId },
	})

	return rate
}

export async function updateRate(id: string, data: {
	name?: string
	minWeight?: string
	maxWeight?: string
	flatRate?: string
	perKgRate?: string
	estimatedDays?: string
	isActive?: boolean
}) {
	await requireAdmin()

	await db.update(shippingRates).set(data).where(eq(shippingRates.id, id))

	await logAudit({
		action: "rate.updated",
		targetType: "rate",
		targetId: id,
	})
}

export async function deleteRate(id: string) {
	await requireAdmin()

	await db.delete(shippingRates).where(eq(shippingRates.id, id))

	await logAudit({
		action: "rate.deleted",
		targetType: "rate",
		targetId: id,
	})
}

// --- ZONES ---

interface GetZonesParams {
	page?: number
	pageSize?: number
}

export async function getZones(params: GetZonesParams = {}) {
	const { page = 1, pageSize = 30 } = params
	const offset = (page - 1) * pageSize

	const [items, [total]] = await Promise.all([
		db
			.select()
			.from(shippingZones)
			.orderBy(shippingZones.name)
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(shippingZones),
	])

	return { items, totalCount: total.count }
}

export async function getZone(id: string) {
	const [zone] = await db
		.select()
		.from(shippingZones)
		.where(eq(shippingZones.id, id))
		.limit(1)

	if (!zone) return null

	const rates = await db
		.select({
			id: shippingZoneRates.id,
			zoneId: shippingZoneRates.zoneId,
			carrierId: shippingZoneRates.carrierId,
			rateId: shippingZoneRates.rateId,
			priceOverride: shippingZoneRates.priceOverride,
			isActive: shippingZoneRates.isActive,
			carrierName: shippingCarriers.name,
			rateName: shippingRates.name,
			flatRate: shippingRates.flatRate,
			estimatedDays: shippingRates.estimatedDays,
		})
		.from(shippingZoneRates)
		.innerJoin(shippingCarriers, eq(shippingZoneRates.carrierId, shippingCarriers.id))
		.innerJoin(shippingRates, eq(shippingZoneRates.rateId, shippingRates.id))
		.where(eq(shippingZoneRates.zoneId, id))

	return { ...zone, rates }
}

export async function createZone(data: { name: string; countries?: string[]; regions?: string[] }) {
	await requireAdmin()

	const [zone] = await db.insert(shippingZones).values(data).returning()

	await logAudit({
		action: "zone.created",
		targetType: "zone",
		targetId: zone.id,
		metadata: { name: data.name },
	})

	return zone
}

export async function updateZone(id: string, data: { name?: string; countries?: string[]; regions?: string[]; isActive?: boolean }) {
	await requireAdmin()

	await db
		.update(shippingZones)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(shippingZones.id, id))

	await logAudit({
		action: "zone.updated",
		targetType: "zone",
		targetId: id,
	})
}

export async function deleteZone(id: string) {
	await requireAdmin()

	await db.delete(shippingZones).where(eq(shippingZones.id, id))

	await logAudit({
		action: "zone.deleted",
		targetType: "zone",
		targetId: id,
	})
}

export async function addZoneRate(data: { zoneId: string; carrierId: string; rateId: string; priceOverride?: string }) {
	await requireAdmin()

	const [zr] = await db.insert(shippingZoneRates).values(data).returning()

	await logAudit({
		action: "zone_rate.created",
		targetType: "zone_rate",
		targetId: zr.id,
	})

	return zr
}

export async function removeZoneRate(id: string) {
	await requireAdmin()

	await db.delete(shippingZoneRates).where(eq(shippingZoneRates.id, id))

	await logAudit({
		action: "zone_rate.deleted",
		targetType: "zone_rate",
		targetId: id,
	})
}

// --- LABELS ---

interface GetLabelsParams {
	page?: number
	pageSize?: number
	status?: string
}

export async function getLabels(params: GetLabelsParams = {}) {
	const { page = 1, pageSize = 30, status } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (status) {
		conditions.push(eq(shippingLabels.status, status))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: shippingLabels.id,
				orderId: shippingLabels.orderId,
				carrierId: shippingLabels.carrierId,
				trackingNumber: shippingLabels.trackingNumber,
				labelUrl: shippingLabels.labelUrl,
				status: shippingLabels.status,
				weight: shippingLabels.weight,
				cost: shippingLabels.cost,
				createdAt: shippingLabels.createdAt,
				carrierName: shippingCarriers.name,
				orderNumber: orders.orderNumber,
			})
			.from(shippingLabels)
			.innerJoin(shippingCarriers, eq(shippingLabels.carrierId, shippingCarriers.id))
			.innerJoin(orders, eq(shippingLabels.orderId, orders.id))
			.where(where)
			.orderBy(desc(shippingLabels.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(shippingLabels).where(where),
	])

	return { items, totalCount: total.count }
}

export async function getLabel(id: string) {
	const [label] = await db
		.select({
			id: shippingLabels.id,
			orderId: shippingLabels.orderId,
			carrierId: shippingLabels.carrierId,
			trackingNumber: shippingLabels.trackingNumber,
			labelUrl: shippingLabels.labelUrl,
			status: shippingLabels.status,
			weight: shippingLabels.weight,
			dimensions: shippingLabels.dimensions,
			cost: shippingLabels.cost,
			createdAt: shippingLabels.createdAt,
			carrierName: shippingCarriers.name,
			orderNumber: orders.orderNumber,
		})
		.from(shippingLabels)
		.innerJoin(shippingCarriers, eq(shippingLabels.carrierId, shippingCarriers.id))
		.innerJoin(orders, eq(shippingLabels.orderId, orders.id))
		.where(eq(shippingLabels.id, id))
		.limit(1)

	return label ?? null
}

export async function updateLabelStatus(id: string, status: string) {
	await requireAdmin()

	await db
		.update(shippingLabels)
		.set({ status })
		.where(eq(shippingLabels.id, id))

	await logAudit({
		action: `label.${status}`,
		targetType: "label",
		targetId: id,
	})
}

// --- TRACKING ---

interface GetTrackingParams {
	page?: number
	pageSize?: number
	status?: string
}

export async function getTracking(params: GetTrackingParams = {}) {
	const { page = 1, pageSize = 30, status } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (status) {
		conditions.push(eq(shipmentTracking.status, status))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: shipmentTracking.id,
				orderId: shipmentTracking.orderId,
				carrierId: shipmentTracking.carrierId,
				trackingNumber: shipmentTracking.trackingNumber,
				status: shipmentTracking.status,
				estimatedDelivery: shipmentTracking.estimatedDelivery,
				lastUpdatedAt: shipmentTracking.lastUpdatedAt,
				createdAt: shipmentTracking.createdAt,
				carrierName: shippingCarriers.name,
				orderNumber: orders.orderNumber,
			})
			.from(shipmentTracking)
			.innerJoin(shippingCarriers, eq(shipmentTracking.carrierId, shippingCarriers.id))
			.innerJoin(orders, eq(shipmentTracking.orderId, orders.id))
			.where(where)
			.orderBy(desc(shipmentTracking.lastUpdatedAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(shipmentTracking).where(where),
	])

	return { items, totalCount: total.count }
}

export async function getTrackingDetail(id: string) {
	const [item] = await db
		.select({
			id: shipmentTracking.id,
			orderId: shipmentTracking.orderId,
			carrierId: shipmentTracking.carrierId,
			trackingNumber: shipmentTracking.trackingNumber,
			status: shipmentTracking.status,
			statusHistory: shipmentTracking.statusHistory,
			estimatedDelivery: shipmentTracking.estimatedDelivery,
			lastUpdatedAt: shipmentTracking.lastUpdatedAt,
			createdAt: shipmentTracking.createdAt,
			carrierName: shippingCarriers.name,
			orderNumber: orders.orderNumber,
		})
		.from(shipmentTracking)
		.innerJoin(shippingCarriers, eq(shipmentTracking.carrierId, shippingCarriers.id))
		.innerJoin(orders, eq(shipmentTracking.orderId, orders.id))
		.where(eq(shipmentTracking.id, id))
		.limit(1)

	return item ?? null
}

export async function getTrackingByOrderId(orderId: string) {
	const [item] = await db
		.select({
			id: shipmentTracking.id,
			orderId: shipmentTracking.orderId,
			carrierId: shipmentTracking.carrierId,
			trackingNumber: shipmentTracking.trackingNumber,
			status: shipmentTracking.status,
			statusHistory: shipmentTracking.statusHistory,
			estimatedDelivery: shipmentTracking.estimatedDelivery,
			lastUpdatedAt: shipmentTracking.lastUpdatedAt,
			createdAt: shipmentTracking.createdAt,
			carrierName: shippingCarriers.name,
		})
		.from(shipmentTracking)
		.innerJoin(shippingCarriers, eq(shipmentTracking.carrierId, shippingCarriers.id))
		.where(eq(shipmentTracking.orderId, orderId))
		.orderBy(desc(shipmentTracking.createdAt))
		.limit(1)

	return item ?? null
}

// --- REVIEW QUEUE ---

interface GetPendingTrackingParams {
	page?: number
	pageSize?: number
}

export async function getPendingTracking(params: GetPendingTrackingParams = {}) {
	const { page = 1, pageSize = 30 } = params
	const offset = (page - 1) * pageSize

	const [rawItems, [total]] = await Promise.all([
		db
			.select({
				id: shipmentTracking.id,
				trackingNumber: shipmentTracking.trackingNumber,
				status: shipmentTracking.status,
				source: shipmentTracking.source,
				sourceDetails: shipmentTracking.sourceDetails,
				createdAt: shipmentTracking.createdAt,
				orderId: orders.id,
				orderNumber: orders.orderNumber,
				carrierId: shippingCarriers.id,
				carrierName: shippingCarriers.name,
				carrierCode: shippingCarriers.code,
			})
			.from(shipmentTracking)
			.leftJoin(shippingCarriers, eq(shipmentTracking.carrierId, shippingCarriers.id))
			.leftJoin(orders, eq(shipmentTracking.orderId, orders.id))
			.where(eq(shipmentTracking.reviewStatus, "pending_review"))
			.orderBy(desc(shipmentTracking.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(shipmentTracking).where(eq(shipmentTracking.reviewStatus, "pending_review")),
	])

	// Transform to expected shape
	const items = rawItems.map((item) => ({
		id: item.id,
		trackingNumber: item.trackingNumber,
		status: item.status,
		source: item.source,
		sourceDetails: item.sourceDetails,
		createdAt: item.createdAt,
		order: item.orderId
			? {
					id: item.orderId,
					orderNumber: item.orderNumber || "",
					customerName: null as string | null,
				}
			: null,
		carrier: item.carrierId
			? {
					id: item.carrierId,
					name: item.carrierName || "",
					code: item.carrierCode || "",
				}
			: null,
	}))

	return { items, totalCount: total.count }
}

export async function approveTracking(id: string) {
	try {
		await requireAdmin()

		// Get tracking details
		const [tracking] = await db
			.select()
			.from(shipmentTracking)
			.where(eq(shipmentTracking.id, id))
			.limit(1)

		if (!tracking) {
			return { success: false, error: "Tracking not found" }
		}

		if (!tracking.orderId) {
			return { success: false, error: "No order associated with this tracking" }
		}

		// Update review status
		await db
			.update(shipmentTracking)
			.set({ reviewStatus: "approved", lastUpdatedAt: new Date() })
			.where(eq(shipmentTracking.id, id))

		// Get carrier for tracking URL
		const [carrier] = await db
			.select()
			.from(shippingCarriers)
			.where(eq(shippingCarriers.id, tracking.carrierId))
			.limit(1)

		// Update order with tracking info
		const trackingUrl = carrier?.trackingUrlTemplate
			? carrier.trackingUrlTemplate.replace("{tracking}", tracking.trackingNumber)
			: null

		await db
			.update(orders)
			.set({
				trackingNumber: tracking.trackingNumber,
				trackingUrl,
				updatedAt: new Date(),
			})
			.where(eq(orders.id, tracking.orderId))

		await logAudit({
			action: "tracking.approved",
			targetType: "tracking",
			targetId: id,
		})

		return { success: true }
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : "Failed to approve tracking" }
	}
}

export async function rejectTracking(id: string) {
	try {
		await requireAdmin()

		// Delete the tracking record instead of just marking rejected
		await db.delete(shipmentTracking).where(eq(shipmentTracking.id, id))

		await logAudit({
			action: "tracking.rejected",
			targetType: "tracking",
			targetId: id,
		})

		return { success: true }
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : "Failed to reject tracking" }
	}
}

export async function updateTrackingOrder(id: string, orderId: string) {
	try {
		await requireAdmin()

		// Verify order exists
		const [order] = await db
			.select({ id: orders.id })
			.from(orders)
			.where(eq(orders.id, orderId))
			.limit(1)

		if (!order) {
			return { success: false, error: "Order not found" }
		}

		// Update tracking record
		await db
			.update(shipmentTracking)
			.set({ orderId, lastUpdatedAt: new Date() })
			.where(eq(shipmentTracking.id, id))

		// Get tracking details
		const [tracking] = await db
			.select()
			.from(shipmentTracking)
			.where(eq(shipmentTracking.id, id))
			.limit(1)

		if (tracking) {
			// Get carrier for tracking URL
			const [carrier] = await db
				.select()
				.from(shippingCarriers)
				.where(eq(shippingCarriers.id, tracking.carrierId))
				.limit(1)

			// Update order with tracking
			const trackingUrl = carrier?.trackingUrlTemplate
				? carrier.trackingUrlTemplate.replace("{tracking}", tracking.trackingNumber)
				: null

			await db
				.update(orders)
				.set({
					trackingNumber: tracking.trackingNumber,
					trackingUrl,
					updatedAt: new Date(),
				})
				.where(eq(orders.id, orderId))
		}

		await logAudit({
			action: "tracking.order_updated",
			targetType: "tracking",
			targetId: id,
			metadata: { orderId },
		})

		return { success: true }
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : "Failed to update tracking" }
	}
}

// --- TRUSTED SENDERS ---

export async function getTrustedSenders() {
	return db
		.select()
		.from(trustedSenders)
		.orderBy(trustedSenders.email)
}

export async function addTrustedSender(email: string, name?: string) {
	await requireAdmin()

	const [sender] = await db
		.insert(trustedSenders)
		.values({ email: email.toLowerCase(), name })
		.onConflictDoUpdate({
			target: trustedSenders.email,
			set: { name, autoApprove: true },
		})
		.returning()

	await logAudit({
		action: "trusted_sender.created",
		targetType: "trusted_sender",
		targetId: sender.id,
		metadata: { email },
	})

	return sender
}

export async function removeTrustedSender(id: string) {
	await requireAdmin()

	await db.delete(trustedSenders).where(eq(trustedSenders.id, id))

	await logAudit({
		action: "trusted_sender.deleted",
		targetType: "trusted_sender",
		targetId: id,
	})
}

export async function isTrustedSender(email: string): Promise<boolean> {
	const [sender] = await db
		.select()
		.from(trustedSenders)
		.where(and(eq(trustedSenders.email, email.toLowerCase()), eq(trustedSenders.autoApprove, true)))
		.limit(1)

	return !!sender
}
