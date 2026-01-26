"use server"

import { headers } from "next/headers"
import { eq, and, desc, sql, count, lte, ilike, or } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { inventory, inventoryLogs, products, productVariants } from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { pusherServer } from "@/lib/pusher-server"
import { fireWebhooks } from "@/lib/webhooks/outgoing"

async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Not authenticated")
	if (session.user.role !== "owner" && session.user.role !== "admin") {
		throw new Error("Insufficient permissions")
	}
	return session.user
}

interface GetInventoryParams {
	page?: number
	pageSize?: number
	search?: string
	filter?: string // all | low | out
}

export async function getInventory(params: GetInventoryParams = {}) {
	const { page = 1, pageSize = 30, search, filter } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (search) {
		conditions.push(
			or(
				ilike(products.name, `%${search}%`),
				ilike(productVariants.sku, `%${search}%`),
				ilike(productVariants.name, `%${search}%`)
			)
		)
	}
	if (filter === "low") {
		conditions.push(
			and(
				sql`${inventory.quantity} - ${inventory.reservedQuantity} <= ${inventory.lowStockThreshold}`,
				sql`${inventory.quantity} - ${inventory.reservedQuantity} > 0`
			)
		)
	} else if (filter === "out") {
		conditions.push(lte(sql`${inventory.quantity} - ${inventory.reservedQuantity}`, 0))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: inventory.id,
				variantId: inventory.variantId,
				quantity: inventory.quantity,
				reservedQuantity: inventory.reservedQuantity,
				lowStockThreshold: inventory.lowStockThreshold,
				updatedAt: inventory.updatedAt,
				variantName: productVariants.name,
				variantSku: productVariants.sku,
				productName: products.name,
				productId: products.id,
			})
			.from(inventory)
			.innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
			.innerJoin(products, eq(productVariants.productId, products.id))
			.where(where)
			.orderBy(desc(inventory.updatedAt))
			.limit(pageSize)
			.offset(offset),
		db
			.select({ count: count() })
			.from(inventory)
			.innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
			.innerJoin(products, eq(productVariants.productId, products.id))
			.where(where),
	])

	return { items, totalCount: total.count }
}

export async function getAlerts(params: { page?: number; pageSize?: number } = {}) {
	const { page = 1, pageSize = 30 } = params
	const offset = (page - 1) * pageSize

	const whereCondition = sql`${inventory.quantity} - ${inventory.reservedQuantity} <= ${inventory.lowStockThreshold}`

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: inventory.id,
				variantId: inventory.variantId,
				quantity: inventory.quantity,
				reservedQuantity: inventory.reservedQuantity,
				lowStockThreshold: inventory.lowStockThreshold,
				updatedAt: inventory.updatedAt,
				variantName: productVariants.name,
				variantSku: productVariants.sku,
				productName: products.name,
				productId: products.id,
			})
			.from(inventory)
			.innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
			.innerJoin(products, eq(productVariants.productId, products.id))
			.where(whereCondition)
			.orderBy(sql`${inventory.quantity} - ${inventory.reservedQuantity} ASC`)
			.limit(pageSize)
			.offset(offset),
		db
			.select({ count: count() })
			.from(inventory)
			.innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
			.innerJoin(products, eq(productVariants.productId, products.id))
			.where(whereCondition),
	])

	return { items, totalCount: total.count }
}

export async function getInventoryLogs(params: { page?: number; pageSize?: number } = {}) {
	const { page = 1, pageSize = 30 } = params
	const offset = (page - 1) * pageSize

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: inventoryLogs.id,
				variantId: inventoryLogs.variantId,
				previousQuantity: inventoryLogs.previousQuantity,
				newQuantity: inventoryLogs.newQuantity,
				reason: inventoryLogs.reason,
				orderId: inventoryLogs.orderId,
				createdAt: inventoryLogs.createdAt,
				variantName: productVariants.name,
				variantSku: productVariants.sku,
				productName: products.name,
			})
			.from(inventoryLogs)
			.innerJoin(productVariants, eq(inventoryLogs.variantId, productVariants.id))
			.innerJoin(products, eq(productVariants.productId, products.id))
			.orderBy(desc(inventoryLogs.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(inventoryLogs),
	])

	return { items, totalCount: total.count }
}

export async function adjustStock(
	inventoryId: string,
	newQuantity: number,
	reason: string
) {
	const user = await requireAdmin()

	const [itemWithDetails] = await db
		.select({
			id: inventory.id,
			variantId: inventory.variantId,
			quantity: inventory.quantity,
			reservedQuantity: inventory.reservedQuantity,
			lowStockThreshold: inventory.lowStockThreshold,
			variantSku: productVariants.sku,
			variantName: productVariants.name,
			productName: products.name,
			productId: products.id,
		})
		.from(inventory)
		.innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
		.innerJoin(products, eq(productVariants.productId, products.id))
		.where(eq(inventory.id, inventoryId))
		.limit(1)

	if (!itemWithDetails) throw new Error("Inventory record not found")

	const previousAvailable = itemWithDetails.quantity - itemWithDetails.reservedQuantity
	const newAvailable = newQuantity - itemWithDetails.reservedQuantity
	const threshold = itemWithDetails.lowStockThreshold ?? 0

	await db.insert(inventoryLogs).values({
		variantId: itemWithDetails.variantId,
		previousQuantity: itemWithDetails.quantity,
		newQuantity,
		reason,
	})

	await db
		.update(inventory)
		.set({ quantity: newQuantity, updatedAt: new Date() })
		.where(eq(inventory.id, inventoryId))

	await logAudit({
		action: "inventory.adjusted",
		targetType: "inventory",
		targetId: inventoryId,
		metadata: { previous: itemWithDetails.quantity, new: newQuantity, reason },
	})

	// Broadcast real-time inventory updates
	if (pusherServer) {
		// Always broadcast the full updated item for live UI updates
		const fullItemData = {
			id: inventoryId,
			variantId: itemWithDetails.variantId,
			quantity: newQuantity,
			reservedQuantity: itemWithDetails.reservedQuantity,
			lowStockThreshold: itemWithDetails.lowStockThreshold,
			updatedAt: new Date().toISOString(),
			variantName: itemWithDetails.variantName,
			variantSku: itemWithDetails.variantSku,
			productName: itemWithDetails.productName,
			productId: itemWithDetails.productId,
		}

		await pusherServer.trigger("private-inventory", "inventory:updated", fullItemData)

		// Also broadcast alert events for notifications
		const alertData = {
			productId: inventoryId,
			productName: `${itemWithDetails.productName} - ${itemWithDetails.variantName}`,
			sku: itemWithDetails.variantSku || "",
			currentStock: newAvailable,
			threshold,
		}

		if (newAvailable <= 0 && previousAvailable > 0) {
			await pusherServer.trigger("private-inventory", "inventory:out-of-stock", alertData)
		} else if (newAvailable <= threshold && previousAvailable > threshold) {
			await pusherServer.trigger("private-inventory", "inventory:low-stock", alertData)
		} else if (newAvailable > threshold && previousAvailable <= threshold) {
			await pusherServer.trigger("private-inventory", "inventory:restocked", alertData)
		}
	}

	// Fire outgoing webhooks for inventory alerts
	const webhookData = {
		inventoryId,
		variantId: itemWithDetails.variantId,
		productId: itemWithDetails.productId,
		productName: itemWithDetails.productName,
		variantName: itemWithDetails.variantName,
		sku: itemWithDetails.variantSku,
		previousQuantity: itemWithDetails.quantity,
		newQuantity,
		availableStock: newAvailable,
		threshold,
		reason,
	}

	if (newAvailable <= 0 && previousAvailable > 0) {
		await fireWebhooks("inventory.out_of_stock", webhookData)
	} else if (newAvailable <= threshold && previousAvailable > threshold) {
		await fireWebhooks("inventory.low_stock", webhookData)
	} else if (newAvailable > threshold && previousAvailable <= threshold) {
		await fireWebhooks("inventory.restocked", webhookData)
	}
}

export async function updateThreshold(inventoryId: string, threshold: number) {
	const user = await requireAdmin()

	await db
		.update(inventory)
		.set({ lowStockThreshold: threshold, updatedAt: new Date() })
		.where(eq(inventory.id, inventoryId))

	await logAudit({
		action: "inventory.threshold_updated",
		targetType: "inventory",
		targetId: inventoryId,
		metadata: { threshold },
	})
}
