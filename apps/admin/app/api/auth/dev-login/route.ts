import { NextResponse } from "next/server"
import { db } from "@jetbeans/db/client"
import { users, sessions } from "@jetbeans/db/schema"
import { eq } from "@jetbeans/db/drizzle"
import crypto from "crypto"

async function signCookieValue(value: string, secret: string): Promise<string> {
	const key = await globalThis.crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	)
	const signature = await globalThis.crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(value)
	)
	const base64Sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
	return encodeURIComponent(`${value}.${base64Sig}`)
}

export async function POST() {
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json({ error: "Not available" }, { status: 403 })
	}

	const [owner] = await db
		.select()
		.from(users)
		.where(eq(users.role, "owner"))
		.limit(1)

	if (!owner) {
		return NextResponse.json({ error: "No owner user found. Sign in with Google first." }, { status: 404 })
	}

	const token = crypto.randomUUID()
	const id = crypto.randomUUID()
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

	await db.insert(sessions).values({
		id,
		userId: owner.id,
		token,
		expiresAt,
		ipAddress: "127.0.0.1",
		userAgent: "dev-bypass",
	})

	const secret = process.env.BETTER_AUTH_SECRET!
	const signedValue = await signCookieValue(token, secret)

	const response = NextResponse.json({ ok: true, user: owner.name })
	response.headers.append(
		"Set-Cookie",
		`better-auth.session_token=${signedValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
	)

	return response
}
