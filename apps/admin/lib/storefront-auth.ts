import { db } from "@jetbeans/db/client"
import { eq, and } from "@jetbeans/db/drizzle"
import { storefronts, workspaces } from "@jetbeans/db/schema"
import { type NextRequest } from "next/server"

export type StorefrontContext = {
	id: string
	workspaceId: string
	name: string
	domain: string | null
	permissions: {
		products: boolean
		orders: boolean
		customers: boolean
		checkout: boolean
		inventory: boolean
	}
}

export type StorefrontAuthResult =
	| { success: true; storefront: StorefrontContext }
	| { success: false; error: string; status: number }

/**
 * Validate a storefront API request
 * Checks the X-Storefront-Key header against the database
 */
export async function validateStorefrontRequest(
	request: NextRequest
): Promise<StorefrontAuthResult> {
	const apiKey = request.headers.get("X-Storefront-Key")

	if (!apiKey) {
		return {
			success: false,
			error: "Missing X-Storefront-Key header",
			status: 401,
		}
	}

	// Look up storefront by API key
	const [result] = await db
		.select({
			storefront: storefronts,
			workspace: workspaces,
		})
		.from(storefronts)
		.innerJoin(workspaces, eq(storefronts.workspaceId, workspaces.id))
		.where(eq(storefronts.apiKey, apiKey))
		.limit(1)

	if (!result) {
		return {
			success: false,
			error: "Invalid API key",
			status: 401,
		}
	}

	if (!result.storefront.isActive) {
		return {
			success: false,
			error: "Storefront is disabled",
			status: 403,
		}
	}

	// Check workspace subscription status
	if (result.workspace.subscriptionStatus === "canceled") {
		return {
			success: false,
			error: "Workspace subscription is inactive",
			status: 403,
		}
	}

	return {
		success: true,
		storefront: {
			id: result.storefront.id,
			workspaceId: result.storefront.workspaceId,
			name: result.storefront.name,
			domain: result.storefront.domain,
			permissions: result.storefront.permissions ?? {
				products: true,
				orders: true,
				customers: true,
				checkout: true,
				inventory: false,
			},
		},
	}
}

/**
 * Validate storefront has permission for a specific action
 */
export function checkStorefrontPermission(
	storefront: StorefrontContext,
	permission: keyof StorefrontContext["permissions"]
): boolean {
	return storefront.permissions[permission] ?? false
}

/**
 * CORS headers for storefront API
 */
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, X-Storefront-Key, Authorization",
}

/**
 * Helper to create error responses with CORS
 */
export function storefrontError(message: string, status: number) {
	return Response.json({ error: message }, { status, headers: corsHeaders })
}

/**
 * Helper to create JSON responses with CORS
 */
export function storefrontJson(data: unknown, status = 200) {
	return Response.json(data, { status, headers: corsHeaders })
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsOptions() {
	return new Response(null, { status: 204, headers: corsHeaders })
}

/**
 * Add CORS headers to a response
 */
function addCorsHeaders(response: Response): Response {
	const newHeaders = new Headers(response.headers)
	Object.entries(corsHeaders).forEach(([key, value]) => {
		newHeaders.set(key, value)
	})
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders,
	})
}

/**
 * Wrapper for storefront API routes
 * Handles authentication, permission checking, and CORS
 */
export function withStorefrontAuth(
	handler: (
		request: NextRequest,
		storefront: StorefrontContext
	) => Promise<Response>,
	options?: {
		requiredPermission?: keyof StorefrontContext["permissions"]
	}
) {
	return async (request: NextRequest) => {
		// Handle CORS preflight
		if (request.method === "OPTIONS") {
			return handleCorsOptions()
		}

		const authResult = await validateStorefrontRequest(request)

		if (!authResult.success) {
			return storefrontError(authResult.error, authResult.status)
		}

		// Check required permission if specified
		if (options?.requiredPermission) {
			if (!checkStorefrontPermission(authResult.storefront, options.requiredPermission)) {
				return storefrontError(
					`Storefront does not have '${options.requiredPermission}' permission`,
					403
				)
			}
		}

		const response = await handler(request, authResult.storefront)
		return addCorsHeaders(response)
	}
}
