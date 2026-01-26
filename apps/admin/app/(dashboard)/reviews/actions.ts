"use server"

import { headers } from "next/headers"
import { eq, and, desc, count, inArray } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { reviews, products, users } from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { fireWebhooks } from "@/lib/webhooks/outgoing"

async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Not authenticated")
	if (session.user.role !== "owner" && session.user.role !== "admin") {
		throw new Error("Insufficient permissions")
	}
	return session.user
}

interface GetReviewsParams {
	page?: number
	pageSize?: number
	status?: string
}

export async function getReviews(params: GetReviewsParams = {}) {
	const { page = 1, pageSize = 30, status } = params
	const offset = (page - 1) * pageSize

	const conditions = []
	if (status && status !== "all") {
		conditions.push(eq(reviews.status, status))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, [total]] = await Promise.all([
		db
			.select({
				id: reviews.id,
				rating: reviews.rating,
				title: reviews.title,
				body: reviews.body,
				status: reviews.status,
				isVerifiedPurchase: reviews.isVerifiedPurchase,
				helpfulCount: reviews.helpfulCount,
				reportCount: reviews.reportCount,
				createdAt: reviews.createdAt,
				productName: products.name,
				productId: reviews.productId,
				customerName: users.name,
				customerEmail: users.email,
			})
			.from(reviews)
			.leftJoin(products, eq(reviews.productId, products.id))
			.leftJoin(users, eq(reviews.userId, users.id))
			.where(where)
			.orderBy(desc(reviews.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(reviews).where(where),
	])

	return { items, totalCount: Number(total.count) }
}

export async function getReview(id: string) {
	const [review] = await db
		.select({
			id: reviews.id,
			rating: reviews.rating,
			title: reviews.title,
			body: reviews.body,
			status: reviews.status,
			isVerifiedPurchase: reviews.isVerifiedPurchase,
			helpfulCount: reviews.helpfulCount,
			reportCount: reviews.reportCount,
			moderatedAt: reviews.moderatedAt,
			createdAt: reviews.createdAt,
			productName: products.name,
			productId: reviews.productId,
			customerName: users.name,
			customerEmail: users.email,
		})
		.from(reviews)
		.leftJoin(products, eq(reviews.productId, products.id))
		.leftJoin(users, eq(reviews.userId, users.id))
		.where(eq(reviews.id, id))
		.limit(1)

	if (!review) throw new Error("Review not found")
	return review
}

export async function moderateReview(id: string, status: "approved" | "rejected" | "reported") {
	const user = await requireAdmin()

	const [review] = await db
		.update(reviews)
		.set({
			status,
			moderatedBy: user.id,
			moderatedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(reviews.id, id))
		.returning()

	await logAudit({
		action: "product.updated",
		targetType: "review",
		targetId: id,
		metadata: { action: `review_${status}` },
	})

	// Fire webhook when review is approved
	if (status === "approved") {
		await fireWebhooks("review.approved", {
			reviewId: review.id,
			productId: review.productId,
			rating: review.rating,
			title: review.title,
			status: review.status,
			moderatedAt: review.moderatedAt?.toISOString(),
		})
	}

	return review
}

export async function deleteReview(id: string) {
	await requireAdmin()

	await db.delete(reviews).where(eq(reviews.id, id))

	await logAudit({
		action: "product.deleted",
		targetType: "review",
		targetId: id,
		metadata: { action: "review_deleted" },
	})
}

export async function bulkModerate(ids: string[], status: "approved" | "rejected") {
	const user = await requireAdmin()

	await db
		.update(reviews)
		.set({
			status,
			moderatedBy: user.id,
			moderatedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(inArray(reviews.id, ids))

	await logAudit({
		action: "product.updated",
		targetType: "review",
		metadata: { action: `bulk_${status}`, count: ids.length },
	})

	// Fire webhooks for approved reviews
	if (status === "approved") {
		for (const reviewId of ids) {
			await fireWebhooks("review.approved", {
				reviewId,
				status,
				bulk: true,
			})
		}
	}
}
