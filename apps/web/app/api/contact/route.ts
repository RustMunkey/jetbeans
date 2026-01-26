import { NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@jetbeans/db/client"
import { inboxEmails } from "@jetbeans/db/schema"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
	try {
		const { name, email, subject, message } = await request.json()

		if (!name || !email || !subject || !message) {
			return NextResponse.json({ error: "All fields are required" }, { status: 400 })
		}

		// Save to inbox database
		await db.insert(inboxEmails).values({
			fromName: name,
			fromEmail: email,
			subject: subject,
			body: message,
			source: "contact_form",
		})

		// If Resend not configured, just log and return success (for dev)
		if (!resend) {
			console.log("[Contact Form] Saved to inbox, Resend not configured")
			return NextResponse.json({ success: true, dev: true })
		}

		// Send confirmation to user
		await resend.emails.send({
			from: "JetBeans <noreply@jetbeans.cafe>",
			to: [email],
			subject: "We received your message",
			text: `Hi ${name},\n\nThanks for reaching out! We've received your message and will get back to you soon.\n\nBest,\nThe JetBeans Team`,
			html: `
				<div style="font-family: sans-serif; max-width: 600px;">
					<h2>Thanks for reaching out!</h2>
					<p>Hi ${name},</p>
					<p>We've received your message and will get back to you soon.</p>
					<p>Best,<br/>The JetBeans Team</p>
				</div>
			`,
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("[Contact Form] Error:", error)
		return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
	}
}
