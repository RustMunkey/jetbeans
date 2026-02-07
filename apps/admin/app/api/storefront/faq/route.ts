import { type NextRequest } from "next/server"
import { db } from "@jetbeans/db/client"
import { eq, and, asc } from "@jetbeans/db/drizzle"
import { faq } from "@jetbeans/db/schema"
import { withStorefrontAuth, handleCorsOptions, type StorefrontContext } from "@/lib/storefront-auth"

/**
 * GET /api/storefront/faq - Get active FAQ items
 */
async function handleGet(_request: NextRequest, storefront: StorefrontContext) {
	const items = await db
		.select({
			id: faq.id,
			question: faq.question,
			answer: faq.answer,
			category: faq.category,
			sortOrder: faq.sortOrder,
			isFeatured: faq.isFeatured,
		})
		.from(faq)
		.where(
			and(
				eq(faq.workspaceId, storefront.workspaceId),
				eq(faq.isActive, true)
			)
		)
		.orderBy(asc(faq.sortOrder))

	return Response.json({ faq: items })
}

export const GET = withStorefrontAuth(handleGet)
export const OPTIONS = handleCorsOptions
