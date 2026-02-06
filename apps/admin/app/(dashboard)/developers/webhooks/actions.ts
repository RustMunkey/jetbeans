"use server"

import { db } from "@jetbeans/db/client"
import { webhookEvents } from "@jetbeans/db/schema"
import { eq } from "@jetbeans/db/drizzle"

export async function getWebhookEvent(id: string) {
	const [event] = await db
		.select({
			id: webhookEvents.id,
			provider: webhookEvents.provider,
			eventType: webhookEvents.eventType,
			externalId: webhookEvents.externalId,
			status: webhookEvents.status,
			errorMessage: webhookEvents.errorMessage,
			payload: webhookEvents.payload,
			createdAt: webhookEvents.createdAt,
			processedAt: webhookEvents.processedAt,
		})
		.from(webhookEvents)
		.where(eq(webhookEvents.id, id))
		.limit(1)
	return event ?? null
}
