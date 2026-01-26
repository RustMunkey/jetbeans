"use server"

import { headers } from "next/headers"
import { eq, desc, count } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { giftCards, giftCardTransactions, users } from "@jetbeans/db/schema"
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

function generateCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	let code = ""
	for (let i = 0; i < 16; i++) {
		if (i > 0 && i % 4 === 0) code += "-"
		code += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return code
}

interface GetGiftCardsParams {
	page?: number
	pageSize?: number
}

export async function getGiftCards(params: GetGiftCardsParams = {}) {
	const { page = 1, pageSize = 30 } = params
	const offset = (page - 1) * pageSize

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: giftCards.id,
				code: giftCards.code,
				initialBalance: giftCards.initialBalance,
				currentBalance: giftCards.currentBalance,
				issuedTo: giftCards.issuedTo,
				issuedBy: giftCards.issuedBy,
				status: giftCards.status,
				expiresAt: giftCards.expiresAt,
				createdAt: giftCards.createdAt,
			})
			.from(giftCards)
			.orderBy(desc(giftCards.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(giftCards),
	])

	return { items, totalCount: total.count }
}

export async function getGiftCard(id: string) {
	const [card] = await db
		.select()
		.from(giftCards)
		.where(eq(giftCards.id, id))
		.limit(1)

	if (!card) throw new Error("Gift card not found")

	const transactions = await db
		.select()
		.from(giftCardTransactions)
		.where(eq(giftCardTransactions.giftCardId, id))
		.orderBy(desc(giftCardTransactions.createdAt))

	// Get issued to user info
	let issuedToUser = null
	if (card.issuedTo) {
		const [user] = await db
			.select({ name: users.name, email: users.email })
			.from(users)
			.where(eq(users.id, card.issuedTo))
			.limit(1)
		issuedToUser = user ?? null
	}

	// Get issued by user info
	const [issuedByUser] = await db
		.select({ name: users.name, email: users.email })
		.from(users)
		.where(eq(users.id, card.issuedBy))
		.limit(1)

	return {
		...card,
		transactions,
		issuedToUser,
		issuedByUser: issuedByUser ?? null,
	}
}

interface CreateGiftCardData {
	initialBalance: string
	issuedTo?: string
	expiresAt?: string
}

export async function createGiftCard(data: CreateGiftCardData) {
	const admin = await requireAdmin()

	const code = generateCode()
	const balance = parseFloat(data.initialBalance)
	if (isNaN(balance) || balance <= 0) {
		throw new Error("Invalid balance amount")
	}

	const [card] = await db
		.insert(giftCards)
		.values({
			code,
			initialBalance: data.initialBalance,
			currentBalance: data.initialBalance,
			issuedTo: data.issuedTo || null,
			issuedBy: admin.id,
			expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
		})
		.returning()

	// Record issued transaction
	await db.insert(giftCardTransactions).values({
		giftCardId: card.id,
		type: "issued",
		amount: data.initialBalance,
	})

	await logAudit({
		action: "gift_card.created",
		targetType: "gift_card",
		targetId: card.id,
		targetLabel: `${code} - $${data.initialBalance}`,
	})

	return card
}

export async function deactivateGiftCard(id: string) {
	const admin = await requireAdmin()

	const [card] = await db
		.update(giftCards)
		.set({ status: "deactivated" })
		.where(eq(giftCards.id, id))
		.returning()

	await db.insert(giftCardTransactions).values({
		giftCardId: id,
		type: "deactivated",
		amount: "0",
	})

	await logAudit({
		action: "gift_card.deactivated",
		targetType: "gift_card",
		targetId: id,
		targetLabel: card.code,
	})

	return card
}
