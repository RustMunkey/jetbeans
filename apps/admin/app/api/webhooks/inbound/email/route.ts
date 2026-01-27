import { NextResponse } from "next/server"
import { db } from "@jetbeans/db/client"
import { inboxEmails } from "@jetbeans/db/schema"
import { pusherServer } from "@/lib/pusher-server"

// Types for different inbound email formats
interface ContactFormPayload {
	type: "contact_form"
	name: string
	email: string
	subject?: string
	message: string
}

interface ResendInboundPayload {
	type: "email.received"
	data: {
		email_id: string
		from: string
		to: string[]
		subject: string
		text?: string
		html?: string
		created_at: string
	}
}

interface GenericEmailPayload {
	type?: "email" | "forward"
	from_name?: string
	from_email: string
	to?: string
	subject: string
	body: string
	body_html?: string
	source_id?: string
}

type InboundPayload = ContactFormPayload | ResendInboundPayload | GenericEmailPayload

function parseFromHeader(from: string): { name: string; email: string } {
	// Parse "Name <email@example.com>" or just "email@example.com"
	const match = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+@[^>]+)>?$/)
	if (match) {
		return {
			name: match[1]?.trim() || match[2],
			email: match[2].trim(),
		}
	}
	return { name: from, email: from }
}

export async function POST(request: Request) {
	let payload: InboundPayload

	try {
		payload = await request.json()
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
	}

	let fromName: string
	let fromEmail: string
	let subject: string
	let body: string
	let bodyHtml: string | undefined
	let source: string
	let sourceId: string | undefined

	// Handle different payload formats
	if ("type" in payload && payload.type === "contact_form") {
		// Contact form submission
		const p = payload as ContactFormPayload
		fromName = p.name
		fromEmail = p.email
		subject = p.subject || "Contact Form Submission"
		body = p.message
		source = "contact_form"
	} else if ("type" in payload && payload.type === "email.received") {
		// Resend inbound email webhook
		const p = payload as ResendInboundPayload
		const parsed = parseFromHeader(p.data.from)
		fromName = parsed.name
		fromEmail = parsed.email
		subject = p.data.subject
		body = p.data.text || ""
		bodyHtml = p.data.html
		source = "resend_inbound"
		sourceId = p.data.email_id
	} else {
		// Generic email forward or direct API call
		const p = payload as GenericEmailPayload
		if (p.from_name) {
			fromName = p.from_name
			fromEmail = p.from_email
		} else {
			const parsed = parseFromHeader(p.from_email)
			fromName = parsed.name
			fromEmail = parsed.email
		}
		subject = p.subject
		body = p.body
		bodyHtml = p.body_html
		source = p.type === "forward" ? "email_forward" : "api"
		sourceId = p.source_id
	}

	// Validate required fields
	if (!fromEmail || !subject || !body) {
		return NextResponse.json(
			{ error: "Missing required fields: from_email, subject, body" },
			{ status: 400 }
		)
	}

	// Basic email validation
	if (!fromEmail.includes("@")) {
		return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
	}

	try {
		// Create inbox email
		const [email] = await db
			.insert(inboxEmails)
			.values({
				fromName,
				fromEmail,
				subject,
				body,
				bodyHtml,
				source,
				sourceId,
			})
			.returning()

		// Broadcast to all admins via Pusher
		if (pusherServer) {
			await pusherServer.trigger("private-inbox", "new-email", {
				id: email.id,
				fromName,
				fromEmail,
				subject,
				body: body.slice(0, 200), // Preview only
				receivedAt: email.receivedAt.toISOString(),
				status: "unread",
			})
		}

		return NextResponse.json({
			success: true,
			id: email.id,
			message: "Email received",
		})
	} catch (error) {
		console.error("[Inbound Email] Failed to save:", error)
		return NextResponse.json(
			{ error: "Failed to save email" },
			{ status: 500 }
		)
	}
}

// Allow GET for health check
export async function GET() {
	return NextResponse.json({ status: "ok", endpoint: "inbound-email" })
}
