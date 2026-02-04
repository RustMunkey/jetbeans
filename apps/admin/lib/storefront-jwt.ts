import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
	process.env.STOREFRONT_JWT_SECRET || process.env.BETTER_AUTH_SECRET || "fallback-secret-change-me"
)

export type StorefrontCustomerToken = {
	sub: string // user ID
	email: string
	name: string
	workspaceId: string // which workspace this token is for
	storefrontId: string
	iat: number
	exp: number
}

/**
 * Create a JWT for a storefront customer
 */
export async function createCustomerToken(payload: {
	userId: string
	email: string
	name: string
	workspaceId: string
	storefrontId: string
}): Promise<string> {
	const now = Math.floor(Date.now() / 1000)
	const expiresIn = 60 * 60 * 24 * 30 // 30 days

	const token = await new SignJWT({
		sub: payload.userId,
		email: payload.email,
		name: payload.name,
		workspaceId: payload.workspaceId,
		storefrontId: payload.storefrontId,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt(now)
		.setExpirationTime(now + expiresIn)
		.sign(JWT_SECRET)

	return token
}

/**
 * Verify and decode a customer JWT
 */
export async function verifyCustomerToken(
	token: string
): Promise<StorefrontCustomerToken | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET)
		return payload as unknown as StorefrontCustomerToken
	} catch {
		return null
	}
}

/**
 * Extract customer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
	if (!authHeader) return null
	if (!authHeader.startsWith("Bearer ")) return null
	return authHeader.slice(7)
}
