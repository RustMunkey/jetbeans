import { type NextRequest } from "next/server"
import { db } from "@jetbeans/db/client"
import { eq, and, asc } from "@jetbeans/db/drizzle"
import { stats } from "@jetbeans/db/schema"
import { withStorefrontAuth, handleCorsOptions, type StorefrontContext } from "@/lib/storefront-auth"

/**
 * GET /api/storefront/stats - Get active stats
 */
async function handleGet(_request: NextRequest, storefront: StorefrontContext) {
	const items = await db
		.select({
			id: stats.id,
			title: stats.title,
			value: stats.value,
			description: stats.description,
			icon: stats.icon,
			sortOrder: stats.sortOrder,
		})
		.from(stats)
		.where(
			and(
				eq(stats.workspaceId, storefront.workspaceId),
				eq(stats.isActive, true)
			)
		)
		.orderBy(asc(stats.sortOrder))

	return Response.json({ stats: items })
}

export const GET = withStorefrontAuth(handleGet)
export const OPTIONS = handleCorsOptions
