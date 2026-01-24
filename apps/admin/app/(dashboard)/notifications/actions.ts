"use server"

import { db } from "@jetbeans/db/client"
import * as schema from "@jetbeans/db/schema"
import { eq, desc } from "@jetbeans/db/drizzle"

// --- EMAIL TEMPLATES ---
export async function getEmailTemplates() {
	return db
		.select()
		.from(schema.emailTemplates)
		.orderBy(schema.emailTemplates.name)
}

export async function getEmailTemplate(id: string) {
	const [template] = await db
		.select()
		.from(schema.emailTemplates)
		.where(eq(schema.emailTemplates.id, id))
	return template ?? null
}

export async function createEmailTemplate(data: {
	name: string
	slug: string
	subject: string
	body?: string
	variables?: string[]
}) {
	const [template] = await db
		.insert(schema.emailTemplates)
		.values({
			name: data.name,
			slug: data.slug,
			subject: data.subject,
			body: data.body || undefined,
			variables: data.variables || [],
		})
		.returning()
	return template
}

export async function updateEmailTemplate(id: string, data: {
	name?: string
	slug?: string
	subject?: string
	body?: string
	variables?: string[]
	isActive?: boolean
}) {
	const [template] = await db
		.update(schema.emailTemplates)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(schema.emailTemplates.id, id))
		.returning()
	return template
}

export async function toggleTemplate(id: string, isActive: boolean) {
	await db
		.update(schema.emailTemplates)
		.set({ isActive, updatedAt: new Date() })
		.where(eq(schema.emailTemplates.id, id))
}

export async function deleteEmailTemplate(id: string) {
	await db.delete(schema.emailTemplates).where(eq(schema.emailTemplates.id, id))
}

// --- MESSAGES ---
export async function getMessages() {
	return db
		.select()
		.from(schema.messages)
		.orderBy(desc(schema.messages.sentAt))
}

export async function createMessage(data: {
	templateId?: string
	recipientEmail: string
	subject: string
	body?: string
}) {
	const [message] = await db
		.insert(schema.messages)
		.values(data)
		.returning()
	return message
}

// --- ALERT RULES ---
export async function getAlertRules() {
	return db
		.select()
		.from(schema.alertRules)
		.orderBy(schema.alertRules.name)
}

export async function createAlertRule(data: {
	name: string
	type: string
	channel: string
	threshold?: number
	recipients?: string[]
}) {
	const [rule] = await db
		.insert(schema.alertRules)
		.values({
			name: data.name,
			type: data.type,
			channel: data.channel,
			threshold: data.threshold || undefined,
			recipients: data.recipients || [],
		})
		.returning()
	return rule
}

export async function updateAlertRule(id: string, data: {
	name?: string
	type?: string
	channel?: string
	threshold?: number
	isActive?: boolean
	recipients?: string[]
}) {
	const [rule] = await db
		.update(schema.alertRules)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(schema.alertRules.id, id))
		.returning()
	return rule
}

export async function toggleAlertRule(id: string, isActive: boolean) {
	await db
		.update(schema.alertRules)
		.set({ isActive, updatedAt: new Date() })
		.where(eq(schema.alertRules.id, id))
}

export async function deleteAlertRule(id: string) {
	await db.delete(schema.alertRules).where(eq(schema.alertRules.id, id))
}
