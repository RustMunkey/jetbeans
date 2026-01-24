"use server"

import { headers } from "next/headers"
import { eq, and, desc, count } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import {
	shippingCarriers,
	shippingRates,
	shippingZones,
	shippingZoneRates,
	shippingLabels,
	shipmentTracking,
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

export async function getCarriers() {
	return db
		.select()
		.from(shippingCarriers)
		.orderBy(desc(shippingCarriers.createdAt))
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

export async function getZones() {
	return db
		.select()
		.from(shippingZones)
		.orderBy(shippingZones.name)
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
	const { page = 1, pageSize = 20, status } = params
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
	const { page = 1, pageSize = 20, status } = params
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
