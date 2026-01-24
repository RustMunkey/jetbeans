"use server"

import { headers } from "next/headers"
import { eq, desc, count, and } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import {
	suppliers,
	purchaseOrders,
	purchaseOrderItems,
	productVariants,
	products,
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

// --- SUPPLIERS ---

export async function getSuppliers() {
	return db.select().from(suppliers).orderBy(desc(suppliers.createdAt))
}

export async function getSupplier(id: string) {
	const [supplier] = await db
		.select()
		.from(suppliers)
		.where(eq(suppliers.id, id))
		.limit(1)

	return supplier ?? null
}

export async function createSupplier(data: {
	name: string
	contactEmail?: string
	contactPhone?: string
	website?: string
	country?: string
	averageLeadTimeDays?: string
	notes?: string
}) {
	await requireAdmin()

	const [supplier] = await db.insert(suppliers).values(data).returning()

	await logAudit({
		action: "supplier.created",
		targetType: "supplier",
		targetId: supplier.id,
		metadata: { name: data.name },
	})

	return supplier
}

export async function updateSupplier(id: string, data: {
	name?: string
	contactEmail?: string
	contactPhone?: string
	website?: string
	country?: string
	averageLeadTimeDays?: string
	notes?: string
}) {
	await requireAdmin()

	await db
		.update(suppliers)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(suppliers.id, id))

	await logAudit({
		action: "supplier.updated",
		targetType: "supplier",
		targetId: id,
	})
}

export async function deleteSupplier(id: string) {
	await requireAdmin()

	await db.delete(suppliers).where(eq(suppliers.id, id))

	await logAudit({
		action: "supplier.deleted",
		targetType: "supplier",
		targetId: id,
	})
}

// --- PURCHASE ORDERS ---

interface GetPurchaseOrdersParams {
	page?: number
	pageSize?: number
	status?: string
}

export async function getPurchaseOrders(params: GetPurchaseOrdersParams = {}) {
	const { page = 1, pageSize = 20, status } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (status) {
		conditions.push(eq(purchaseOrders.status, status))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: purchaseOrders.id,
				poNumber: purchaseOrders.poNumber,
				supplierId: purchaseOrders.supplierId,
				status: purchaseOrders.status,
				total: purchaseOrders.total,
				expectedDelivery: purchaseOrders.expectedDelivery,
				receivedAt: purchaseOrders.receivedAt,
				createdAt: purchaseOrders.createdAt,
				supplierName: suppliers.name,
			})
			.from(purchaseOrders)
			.innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
			.where(where)
			.orderBy(desc(purchaseOrders.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(purchaseOrders).where(where),
	])

	return { items, totalCount: total.count }
}

export async function getPurchaseOrder(id: string) {
	const [po] = await db
		.select({
			id: purchaseOrders.id,
			poNumber: purchaseOrders.poNumber,
			supplierId: purchaseOrders.supplierId,
			status: purchaseOrders.status,
			subtotal: purchaseOrders.subtotal,
			shippingCost: purchaseOrders.shippingCost,
			total: purchaseOrders.total,
			expectedDelivery: purchaseOrders.expectedDelivery,
			receivedAt: purchaseOrders.receivedAt,
			notes: purchaseOrders.notes,
			createdAt: purchaseOrders.createdAt,
			updatedAt: purchaseOrders.updatedAt,
			supplierName: suppliers.name,
		})
		.from(purchaseOrders)
		.innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
		.where(eq(purchaseOrders.id, id))
		.limit(1)

	if (!po) return null

	const items = await db
		.select({
			id: purchaseOrderItems.id,
			variantId: purchaseOrderItems.variantId,
			quantity: purchaseOrderItems.quantity,
			unitCost: purchaseOrderItems.unitCost,
			totalCost: purchaseOrderItems.totalCost,
			receivedQuantity: purchaseOrderItems.receivedQuantity,
			variantName: productVariants.name,
			variantSku: productVariants.sku,
			productName: products.name,
		})
		.from(purchaseOrderItems)
		.innerJoin(productVariants, eq(purchaseOrderItems.variantId, productVariants.id))
		.innerJoin(products, eq(productVariants.productId, products.id))
		.where(eq(purchaseOrderItems.purchaseOrderId, id))

	return { ...po, items }
}

export async function createPurchaseOrder(data: {
	supplierId: string
	notes?: string
	expectedDelivery?: Date
}) {
	await requireAdmin()

	const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`

	const [po] = await db
		.insert(purchaseOrders)
		.values({
			poNumber,
			supplierId: data.supplierId,
			notes: data.notes,
			expectedDelivery: data.expectedDelivery,
		})
		.returning()

	await logAudit({
		action: "purchase_order.created",
		targetType: "purchase_order",
		targetId: po.id,
		metadata: { poNumber },
	})

	return po
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
	await requireAdmin()

	const updates: Record<string, unknown> = {
		status,
		updatedAt: new Date(),
	}

	if (status === "received") {
		updates.receivedAt = new Date()
	}

	await db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.id, id))

	await logAudit({
		action: `purchase_order.${status}`,
		targetType: "purchase_order",
		targetId: id,
	})
}

export async function deletePurchaseOrder(id: string) {
	await requireAdmin()

	await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id))

	await logAudit({
		action: "purchase_order.deleted",
		targetType: "purchase_order",
		targetId: id,
	})
}
