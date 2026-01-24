import { eq } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { emailTemplates, messages } from "@jetbeans/db/schema"
import { getResend } from "./resend"

type SendTemplateEmailOptions = {
	to: string
	templateSlug: string
	variables?: Record<string, string>
	sentBy?: string
	recipientId?: string
}

export async function sendTemplateEmail({
	to,
	templateSlug,
	variables = {},
	sentBy,
	recipientId,
}: SendTemplateEmailOptions) {
	const resend = getResend()
	if (!resend) return null

	const [template] = await db
		.select()
		.from(emailTemplates)
		.where(eq(emailTemplates.slug, templateSlug))
		.limit(1)

	if (!template || !template.isActive) return null

	// Replace variables in subject and body
	let subject = template.subject
	let body = template.body || ""

	for (const [key, value] of Object.entries(variables)) {
		const placeholder = `{{${key}}}`
		subject = subject.replaceAll(placeholder, value)
		body = body.replaceAll(placeholder, value)
	}

	const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@jetbeans.app"

	const result = await resend.emails.send({
		from: fromEmail,
		to,
		subject,
		html: body,
	})

	// Log to messages table
	await db.insert(messages).values({
		templateId: template.id,
		recipientEmail: to,
		recipientId: recipientId || null,
		subject,
		body,
		status: result.error ? "failed" : "sent",
		sentBy: sentBy || null,
	})

	return result
}
