import { type NextRequest } from "next/server"
import { db } from "@jetbeans/db/client"
import { eq, and, asc } from "@jetbeans/db/drizzle"
import { sitePages } from "@jetbeans/db/schema"
import { withStorefrontAuth, handleCorsOptions, type StorefrontContext } from "@/lib/storefront-auth"

/**
 * GET /api/storefront/pages - List published site pages
 */
async function handleGet(_request: NextRequest, storefront: StorefrontContext) {
	const pages = await db
		.select({
			id: sitePages.id,
			title: sitePages.title,
			slug: sitePages.slug,
			metaTitle: sitePages.metaTitle,
			metaDescription: sitePages.metaDescription,
		})
		.from(sitePages)
		.where(
			and(
				eq(sitePages.workspaceId, storefront.workspaceId),
				eq(sitePages.status, "published")
			)
		)
		.orderBy(asc(sitePages.title))

	return Response.json({ pages })
}

export const GET = withStorefrontAuth(handleGet)
export const OPTIONS = handleCorsOptions
