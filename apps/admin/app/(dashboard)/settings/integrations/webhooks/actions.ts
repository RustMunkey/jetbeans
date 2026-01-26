"use server"

import { headers } from "next/headers"
import { eq, desc, count, and, sql } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import {
	incomingWebhookUrls,
	outgoingWebhookEndpoints,
	outgoingWebhookDeliveries,
	webhookEvents,
} from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"
import { nanoid } from "nanoid"

async function requireOwner() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session || session.user.role !== "owner") {
		throw new Error("Only owners can manage webhooks")
	}
	return session.user
}

// ==============================================
// INCOMING WEBHOOKS (Discord-style messaging)
// ==============================================

export async function getIncomingWebhooks() {
	await requireOwner()

	return db
		.select()
		.from(incomingWebhookUrls)
		.orderBy(desc(incomingWebhookUrls.createdAt))
}

export async function createIncomingWebhook(data: {
	name: string
	channel: string
	defaultUsername?: string
	defaultAvatarUrl?: string
}) {
	await requireOwner()

	const token = nanoid(32) // Secure random token

	const [webhook] = await db
		.insert(incomingWebhookUrls)
		.values({
			name: data.name,
			token,
			channel: data.channel,
			defaultUsername: data.defaultUsername,
			defaultAvatarUrl: data.defaultAvatarUrl,
		})
		.returning()

	return webhook
}

export async function updateIncomingWebhook(
	id: string,
	data: {
		name?: string
		channel?: string
		defaultUsername?: string
		defaultAvatarUrl?: string
		isActive?: boolean
	}
) {
	await requireOwner()

	await db
		.update(incomingWebhookUrls)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(incomingWebhookUrls.id, id))
}

export async function deleteIncomingWebhook(id: string) {
	await requireOwner()

	await db.delete(incomingWebhookUrls).where(eq(incomingWebhookUrls.id, id))
}

export async function regenerateIncomingWebhookToken(id: string) {
	await requireOwner()

	const newToken = nanoid(32)

	await db
		.update(incomingWebhookUrls)
		.set({
			token: newToken,
			updatedAt: new Date(),
		})
		.where(eq(incomingWebhookUrls.id, id))

	return newToken
}

// ==============================================
// OUTGOING WEBHOOKS
// ==============================================

export async function getOutgoingWebhooks() {
	await requireOwner()

	return db
		.select()
		.from(outgoingWebhookEndpoints)
		.orderBy(desc(outgoingWebhookEndpoints.createdAt))
}

export async function createOutgoingWebhook(data: {
	name: string
	url: string
	events: string[]
	headers?: Record<string, string>
}) {
	await requireOwner()

	// Generate a secret for signing
	const secret = nanoid(48)

	const [webhook] = await db
		.insert(outgoingWebhookEndpoints)
		.values({
			name: data.name,
			url: data.url,
			secret,
			events: data.events,
			headers: data.headers || {},
		})
		.returning()

	return webhook
}

export async function updateOutgoingWebhook(
	id: string,
	data: {
		name?: string
		url?: string
		events?: string[]
		headers?: Record<string, string>
		isActive?: boolean
	}
) {
	await requireOwner()

	await db
		.update(outgoingWebhookEndpoints)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(outgoingWebhookEndpoints.id, id))
}

export async function deleteOutgoingWebhook(id: string) {
	await requireOwner()

	await db.delete(outgoingWebhookEndpoints).where(eq(outgoingWebhookEndpoints.id, id))
}

export async function regenerateOutgoingWebhookSecret(id: string) {
	await requireOwner()

	const newSecret = nanoid(48)

	await db
		.update(outgoingWebhookEndpoints)
		.set({
			secret: newSecret,
			updatedAt: new Date(),
		})
		.where(eq(outgoingWebhookEndpoints.id, id))

	return newSecret
}

// ==============================================
// DELIVERY LOGS
// ==============================================

interface GetDeliveryLogsParams {
	page?: number
	pageSize?: number
	endpointId?: string
	status?: string
}

export async function getDeliveryLogs(params: GetDeliveryLogsParams = {}) {
	await requireOwner()

	const { page = 1, pageSize = 30, endpointId, status } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (endpointId) {
		conditions.push(eq(outgoingWebhookDeliveries.endpointId, endpointId))
	}
	if (status) {
		conditions.push(eq(outgoingWebhookDeliveries.status, status))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: outgoingWebhookDeliveries.id,
				endpointId: outgoingWebhookDeliveries.endpointId,
				endpointName: outgoingWebhookEndpoints.name,
				event: outgoingWebhookDeliveries.event,
				status: outgoingWebhookDeliveries.status,
				responseCode: outgoingWebhookDeliveries.responseCode,
				attempts: outgoingWebhookDeliveries.attempts,
				errorMessage: outgoingWebhookDeliveries.errorMessage,
				createdAt: outgoingWebhookDeliveries.createdAt,
				deliveredAt: outgoingWebhookDeliveries.deliveredAt,
			})
			.from(outgoingWebhookDeliveries)
			.leftJoin(
				outgoingWebhookEndpoints,
				eq(outgoingWebhookDeliveries.endpointId, outgoingWebhookEndpoints.id)
			)
			.where(where)
			.orderBy(desc(outgoingWebhookDeliveries.createdAt))
			.limit(pageSize)
			.offset(offset),
		db
			.select({ count: count() })
			.from(outgoingWebhookDeliveries)
			.where(where),
	])

	return { items, totalCount: total.count }
}

export async function getDeliveryDetails(id: string) {
	await requireOwner()

	const [delivery] = await db
		.select()
		.from(outgoingWebhookDeliveries)
		.where(eq(outgoingWebhookDeliveries.id, id))
		.limit(1)

	return delivery
}

export async function retryDelivery(id: string) {
	await requireOwner()

	const [delivery] = await db
		.select()
		.from(outgoingWebhookDeliveries)
		.where(eq(outgoingWebhookDeliveries.id, id))
		.limit(1)

	if (!delivery) throw new Error("Delivery not found")

	const [endpoint] = await db
		.select()
		.from(outgoingWebhookEndpoints)
		.where(eq(outgoingWebhookEndpoints.id, delivery.endpointId))
		.limit(1)

	if (!endpoint) throw new Error("Endpoint not found")

	// Import inngest dynamically to avoid circular deps
	const { inngest } = await import("@/lib/inngest")

	await inngest.send({
		name: "webhook/deliver",
		data: {
			deliveryId: delivery.id,
			endpointId: endpoint.id,
			url: endpoint.url,
			secret: endpoint.secret,
			headers: endpoint.headers,
			payload: delivery.payload,
		},
	})

	// Reset status to pending
	await db
		.update(outgoingWebhookDeliveries)
		.set({ status: "pending" })
		.where(eq(outgoingWebhookDeliveries.id, id))

	return { queued: true }
}

// ==============================================
// WEBHOOK EVENTS LOG (incoming webhooks)
// ==============================================

interface GetWebhookEventsParams {
	page?: number
	pageSize?: number
	provider?: string
	status?: string
}

export async function getWebhookEvents(params: GetWebhookEventsParams = {}) {
	await requireOwner()

	const { page = 1, pageSize = 30, provider, status } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (provider) {
		conditions.push(eq(webhookEvents.provider, provider))
	}
	if (status) {
		conditions.push(eq(webhookEvents.status, status))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: webhookEvents.id,
				provider: webhookEvents.provider,
				eventType: webhookEvents.eventType,
				status: webhookEvents.status,
				errorMessage: webhookEvents.errorMessage,
				createdAt: webhookEvents.createdAt,
				processedAt: webhookEvents.processedAt,
			})
			.from(webhookEvents)
			.where(where)
			.orderBy(desc(webhookEvents.createdAt))
			.limit(pageSize)
			.offset(offset),
		db
			.select({ count: count() })
			.from(webhookEvents)
			.where(where),
	])

	return { items, totalCount: total.count }
}
