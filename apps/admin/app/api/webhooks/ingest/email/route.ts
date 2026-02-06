import { NextResponse } from "next/server"
import { eq, sql, desc } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import {
	webhookEvents,
	shipmentTracking,
	shippingCarriers,
	orders,
	inboxEmails,
} from "@jetbeans/db/schema"
import { pusherServer } from "@/lib/pusher-server"
import { wsChannel } from "@/lib/pusher-channels"
import { parseShippingEmail, isShippingEmail } from "@/lib/tracking/parser"
import { registerTracking, isTracktryConfigured } from "@/lib/tracking/service"
import { env } from "@/env"
import crypto from "crypto"

/**
 * Email Ingestion Endpoint
 *
 * Receives inbound emails via Resend/SendGrid webhook and parses
 * shipping information to auto-update order tracking.
 *
 * POST /api/webhooks/ingest/email
 */

interface ResendInboundEmail {
	from: string
	to: string
	subject: string
	text?: string
	html?: string
	attachments?: Array<{
		filename: string
		content: string
		contentType: string
	}>
}

// Verify Resend webhook signature
function verifyResendSignature(payload: string, signature: string | null): boolean {
	if (!env.RESEND_WEBHOOK_SECRET || !signature) return false

	const expectedSig = crypto
		.createHmac("sha256", env.RESEND_WEBHOOK_SECRET)
		.update(payload)
		.digest("hex")

	return signature === `sha256=${expectedSig}` || signature === expectedSig
}

export async function POST(request: Request) {
	const rawBody = await request.text()

	// Verify signature if secret is configured
	if (env.RESEND_WEBHOOK_SECRET) {
		const signature = request.headers.get("x-resend-signature") ||
			request.headers.get("x-webhook-signature")

		if (!verifyResendSignature(rawBody, signature)) {
			console.warn("[Email Ingest] Invalid signature")
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
		}
	}

	let payload: ResendInboundEmail
	try {
		payload = JSON.parse(rawBody)
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
	}

	// Parse sender info for inbox
	// Format: "Name <email@example.com>" or just "email@example.com"
	let fromName = ""
	let fromEmail = ""
	if (payload.from) {
		const match = payload.from.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/)
		if (match) {
			fromName = match[1]?.trim() || ""
			fromEmail = match[2]?.trim() || payload.from
		} else {
			fromEmail = payload.from
		}
	}
	if (!fromName && fromEmail) {
		fromName = fromEmail.split("@")[0] || "Unknown"
	}

	// Save ALL emails to inbox (for admin inbox view)
	await db.insert(inboxEmails).values({
		fromName: fromName || "Unknown",
		fromEmail: fromEmail || "unknown@unknown.com",
		subject: payload.subject || "(No Subject)",
		body: payload.text || "",
		bodyHtml: payload.html || null,
		source: "email_forward",
		sourceId: request.headers.get("x-resend-message-id") || null,
	})

	// Log the webhook event
	const [event] = await db
		.insert(webhookEvents)
		.values({
			provider: "email-ingest",
			eventType: "inbound_email",
			externalId: null,
			payload: payload as unknown as Record<string, unknown>,
			headers: Object.fromEntries(request.headers.entries()),
			status: "pending",
		})
		.returning()

	// Check if this looks like a shipping email
	if (!isShippingEmail(payload.from, payload.subject)) {
		await db
			.update(webhookEvents)
			.set({ status: "skipped", errorMessage: "Not a shipping email" })
			.where(eq(webhookEvents.id, event.id))

		return NextResponse.json({ success: true, skipped: true, reason: "Not a shipping email" })
	}

	// Parse the email
	const emailBody = payload.html || payload.text || ""
	const parsed = parseShippingEmail(payload.from, payload.subject, emailBody)

	if (parsed.trackingNumbers.length === 0) {
		await db
			.update(webhookEvents)
			.set({ status: "skipped", errorMessage: "No tracking numbers found" })
			.where(eq(webhookEvents.id, event.id))

		return NextResponse.json({ success: true, skipped: true, reason: "No tracking numbers found" })
	}

	// Try to match to an order
	let matchedOrderId: string | null = null
	if (parsed.orderReferences.length > 0) {
		for (const ref of parsed.orderReferences) {
			const [order] = await db
				.select({ id: orders.id })
				.from(orders)
				.where(sql`${orders.orderNumber} ILIKE ${`%${ref}%`}`)
				.limit(1)

			if (order) {
				matchedOrderId = order.id
				break
			}
		}
	}

	// If no order matched by reference, try to find by email or recent orders
	// (This is a fallback - you might want to customize this logic)

	const results: Array<{
		trackingNumber: string
		carrier: string | null
		orderId: string | null
		status: "created" | "updated" | "pending_review"
	}> = []

	for (const { trackingNumber, carrier } of parsed.trackingNumbers) {
		// Get or create carrier in database
		let carrierId: string | null = null
		if (carrier) {
			const [existingCarrier] = await db
				.select({ id: shippingCarriers.id })
				.from(shippingCarriers)
				.where(eq(shippingCarriers.code, carrier.code))
				.limit(1)

			if (existingCarrier) {
				carrierId = existingCarrier.id
			} else {
				// Create carrier
				const [newCarrier] = await db
					.insert(shippingCarriers)
					.values({
						name: carrier.name,
						code: carrier.code,
						trackingUrlTemplate: carrier.trackingUrl.replace(trackingNumber, "{tracking}"),
					})
					.returning()
				carrierId = newCarrier.id
			}
		}

		// Check if tracking already exists
		const [existing] = await db
			.select()
			.from(shipmentTracking)
			.where(eq(shipmentTracking.trackingNumber, trackingNumber))
			.limit(1)

		if (existing) {
			results.push({
				trackingNumber,
				carrier: carrier?.name || null,
				orderId: existing.orderId,
				status: "updated",
			})
			continue
		}

		// Determine status based on confidence
		const reviewStatus = parsed.confidence === "high" && matchedOrderId
			? "approved"
			: "pending_review"

		if (matchedOrderId && carrierId) {
			// Create tracking record
			const [tracking] = await db
				.insert(shipmentTracking)
				.values({
					orderId: matchedOrderId,
					carrierId,
					trackingNumber,
					status: "pending",
					statusHistory: [],
				})
				.returning()

			// Update order with tracking
			await db
				.update(orders)
				.set({
					trackingNumber,
					trackingUrl: carrier?.trackingUrl || null,
					updatedAt: new Date(),
				})
				.where(eq(orders.id, matchedOrderId))

			// Register with Tracktry
			if (isTracktryConfigured() && carrier) {
				await registerTracking(trackingNumber, carrier.code, matchedOrderId)
			}

			// Broadcast update (workspace-scoped)
			if (pusherServer && matchedOrderId) {
				const [orderForWs] = await db
					.select({ workspaceId: orders.workspaceId })
					.from(orders)
					.where(eq(orders.id, matchedOrderId))
					.limit(1)
				if (orderForWs?.workspaceId) {
					await pusherServer.trigger(wsChannel(orderForWs.workspaceId, "orders"), "tracking:ingested", {
						trackingId: tracking.id,
						trackingNumber,
						orderId: matchedOrderId,
						carrier: carrier?.name,
						source: "email",
						reviewStatus,
					})
				}
			}

			results.push({
				trackingNumber,
				carrier: carrier?.name || null,
				orderId: matchedOrderId,
				status: reviewStatus === "approved" ? "created" : "pending_review",
			})
		} else {
			// No order match - add to pending review
			results.push({
				trackingNumber,
				carrier: carrier?.name || null,
				orderId: null,
				status: "pending_review",
			})
		}
	}

	// Update webhook event status
	await db
		.update(webhookEvents)
		.set({
			status: "processed",
			processedAt: new Date(),
		})
		.where(eq(webhookEvents.id, event.id))

	return NextResponse.json({
		success: true,
		parsed: {
			sender: parsed.sender,
			subject: parsed.subject,
			confidence: parsed.confidence,
			trackingCount: parsed.trackingNumbers.length,
			orderReferences: parsed.orderReferences,
		},
		results,
	})
}
