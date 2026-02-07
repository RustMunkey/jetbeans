import { type NextRequest } from "next/server"
import { db } from "@jetbeans/db/client"
import { eq, and, desc } from "@jetbeans/db/drizzle"
import { testimonials } from "@jetbeans/db/schema"
import { withStorefrontAuth, handleCorsOptions, type StorefrontContext } from "@/lib/storefront-auth"

/**
 * GET /api/storefront/testimonials - Get approved testimonials
 * Query params:
 *   ?featured=true - Only return featured testimonials
 */
async function handleGet(request: NextRequest, storefront: StorefrontContext) {
	const { searchParams } = new URL(request.url)
	const featuredOnly = searchParams.get("featured") === "true"

	const conditions = [
		eq(testimonials.workspaceId, storefront.workspaceId),
		eq(testimonials.status, "approved"),
	]

	if (featuredOnly) {
		conditions.push(eq(testimonials.isFeatured, true))
	}

	const items = await db
		.select({
			id: testimonials.id,
			reviewerName: testimonials.reviewerName,
			rating: testimonials.rating,
			title: testimonials.title,
			content: testimonials.content,
			isFeatured: testimonials.isFeatured,
			createdAt: testimonials.createdAt,
		})
		.from(testimonials)
		.where(and(...conditions))
		.orderBy(desc(testimonials.createdAt))

	return Response.json({ testimonials: items })
}

export const GET = withStorefrontAuth(handleGet)
export const OPTIONS = handleCorsOptions
