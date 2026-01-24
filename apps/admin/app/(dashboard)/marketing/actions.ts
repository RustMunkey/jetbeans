"use server"

import { db } from "@jetbeans/db/client"
import * as schema from "@jetbeans/db/schema"
import { eq, desc, sql, ilike, and, or, isNull, isNotNull } from "@jetbeans/db/drizzle"

// --- DISCOUNTS ---
export async function getDiscounts(params?: { status?: string }) {
	const conditions = []
	if (params?.status === "active") {
		conditions.push(eq(schema.discounts.isActive, true))
	} else if (params?.status === "inactive") {
		conditions.push(eq(schema.discounts.isActive, false))
	} else if (params?.status === "expired") {
		conditions.push(sql`${schema.discounts.expiresAt} < NOW()`)
	}

	return db
		.select()
		.from(schema.discounts)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(schema.discounts.createdAt))
}

export async function getDiscount(id: string) {
	const [discount] = await db
		.select()
		.from(schema.discounts)
		.where(eq(schema.discounts.id, id))
	return discount ?? null
}

export async function createDiscount(data: {
	name: string
	code?: string
	discountType?: string
	valueType: string
	value: string
	minimumOrderAmount?: string
	maxUses?: number
	maxUsesPerUser?: number
	applicableCategories?: string[]
	isStackable?: boolean
	startsAt?: string
	expiresAt?: string
}) {
	const [discount] = await db
		.insert(schema.discounts)
		.values({
			name: data.name,
			code: data.code || undefined,
			discountType: data.discountType || "code",
			valueType: data.valueType,
			value: data.value,
			minimumOrderAmount: data.minimumOrderAmount || undefined,
			maxUses: data.maxUses || undefined,
			maxUsesPerUser: data.maxUsesPerUser || 1,
			applicableCategories: data.applicableCategories || undefined,
			isStackable: data.isStackable || false,
			startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
			expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
		})
		.returning()
	return discount
}

export async function updateDiscount(id: string, data: Partial<{
	name: string
	code: string
	valueType: string
	value: string
	minimumOrderAmount: string | null
	maxUses: number | null
	isActive: boolean
	isStackable: boolean
	startsAt: string | null
	expiresAt: string | null
}>) {
	const updates: Record<string, unknown> = {}
	if (data.name !== undefined) updates.name = data.name
	if (data.code !== undefined) updates.code = data.code
	if (data.valueType !== undefined) updates.valueType = data.valueType
	if (data.value !== undefined) updates.value = data.value
	if (data.minimumOrderAmount !== undefined) updates.minimumOrderAmount = data.minimumOrderAmount
	if (data.maxUses !== undefined) updates.maxUses = data.maxUses
	if (data.isActive !== undefined) updates.isActive = data.isActive
	if (data.isStackable !== undefined) updates.isStackable = data.isStackable
	if (data.startsAt !== undefined) updates.startsAt = data.startsAt ? new Date(data.startsAt) : null
	if (data.expiresAt !== undefined) updates.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null

	await db.update(schema.discounts).set(updates).where(eq(schema.discounts.id, id))
}

export async function deleteDiscount(id: string) {
	await db.delete(schema.discounts).where(eq(schema.discounts.id, id))
}

export async function toggleDiscount(id: string, isActive: boolean) {
	await db.update(schema.discounts).set({ isActive }).where(eq(schema.discounts.id, id))
}

// --- CAMPAIGNS ---
export async function getCampaigns(params?: { status?: string }) {
	const conditions = []
	if (params?.status && params.status !== "all") {
		conditions.push(eq(schema.campaigns.status, params.status))
	}

	return db
		.select()
		.from(schema.campaigns)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(schema.campaigns.createdAt))
}

export async function getCampaign(id: string) {
	const [campaign] = await db
		.select()
		.from(schema.campaigns)
		.where(eq(schema.campaigns.id, id))
	return campaign ?? null
}

export async function createCampaign(data: {
	name: string
	description?: string
	type: string
	subject?: string
	content?: string
	audience?: string
	discountCode?: string
	scheduledAt?: string
}) {
	const [campaign] = await db
		.insert(schema.campaigns)
		.values({
			name: data.name,
			description: data.description || undefined,
			type: data.type,
			subject: data.subject || undefined,
			content: data.content || undefined,
			audience: data.audience || "all",
			discountCode: data.discountCode || undefined,
			scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
			status: data.scheduledAt ? "scheduled" : "draft",
		})
		.returning()
	return campaign
}

export async function updateCampaignStatus(id: string, status: string) {
	const updates: Record<string, unknown> = { status }
	if (status === "active") updates.startedAt = new Date()
	if (status === "ended" || status === "cancelled") updates.endedAt = new Date()

	await db.update(schema.campaigns).set(updates).where(eq(schema.campaigns.id, id))
}

export async function deleteCampaign(id: string) {
	await db.delete(schema.campaigns).where(eq(schema.campaigns.id, id))
}

// --- REFERRALS ---
export async function getReferrals() {
	const rows = await db
		.select({
			id: schema.referrals.id,
			referrerId: schema.referrals.referrerId,
			referredId: schema.referrals.referredId,
			referralCode: schema.referrals.referralCode,
			status: schema.referrals.status,
			rewardAmount: schema.referrals.rewardAmount,
			rewardType: schema.referrals.rewardType,
			completedAt: schema.referrals.completedAt,
			createdAt: schema.referrals.createdAt,
			referrerName: sql<string | null>`(SELECT name FROM users WHERE id = ${schema.referrals.referrerId})`,
			referrerEmail: sql<string | null>`(SELECT email FROM users WHERE id = ${schema.referrals.referrerId})`,
			referredName: sql<string | null>`(SELECT name FROM users WHERE id = ${schema.referrals.referredId})`,
			referredEmail: sql<string | null>`(SELECT email FROM users WHERE id = ${schema.referrals.referredId})`,
		})
		.from(schema.referrals)
		.orderBy(desc(schema.referrals.createdAt))

	return rows
}

export async function getReferralCodes() {
	const rows = await db
		.select({
			id: schema.referralCodes.id,
			userId: schema.referralCodes.userId,
			code: schema.referralCodes.code,
			totalReferrals: schema.referralCodes.totalReferrals,
			totalEarnings: schema.referralCodes.totalEarnings,
			createdAt: schema.referralCodes.createdAt,
			userName: sql<string | null>`(SELECT name FROM users WHERE id = ${schema.referralCodes.userId})`,
			userEmail: sql<string | null>`(SELECT email FROM users WHERE id = ${schema.referralCodes.userId})`,
		})
		.from(schema.referralCodes)
		.orderBy(desc(schema.referralCodes.totalReferrals))

	return rows
}

// --- SEO ---
export async function getProductsSeo() {
	return db
		.select({
			id: schema.products.id,
			name: schema.products.name,
			slug: schema.products.slug,
			metaTitle: schema.products.metaTitle,
			metaDescription: schema.products.metaDescription,
			isActive: schema.products.isActive,
		})
		.from(schema.products)
		.orderBy(schema.products.name)
}

export async function updateProductSeo(id: string, data: { metaTitle: string | null; metaDescription: string | null }) {
	await db
		.update(schema.products)
		.set({ metaTitle: data.metaTitle, metaDescription: data.metaDescription })
		.where(eq(schema.products.id, id))
}
