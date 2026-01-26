import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
	try {
		const { name, email, subject, message } = await request.json()

		if (!name || !email || !subject || !message) {
			return NextResponse.json({ error: "All fields are required" }, { status: 400 })
		}

		// If Resend not configured, just log and return success (for dev)
		if (!resend) {
			console.log("[Contact Form] Resend not configured, logging instead:")
			console.log({ name, email, subject, message })
			return NextResponse.json({ success: true, dev: true })
		}

		// Send to support inbox
		await resend.emails.send({
			from: "JetBeans Contact <noreply@jetbeans.cafe>",
			to: ["support@jetbeans.cafe"],
			replyTo: email,
			subject: `[Contact] ${subject}`,
			text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
			html: `
				<div style="font-family: sans-serif; max-width: 600px;">
					<h2 style="margin-bottom: 16px;">New Contact Form Submission</h2>
					<p><strong>Name:</strong> ${name}</p>
					<p><strong>Email:</strong> ${email}</p>
					<p><strong>Subject:</strong> ${subject}</p>
					<hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
					<p style="white-space: pre-wrap;">${message}</p>
				</div>
			`,
		})

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
