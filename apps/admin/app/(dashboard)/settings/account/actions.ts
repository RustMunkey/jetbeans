"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@jetbeans/db/client"
import { users } from "@jetbeans/db/schema"
import { eq } from "@jetbeans/db/drizzle"

export async function getCurrentUser() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) return null

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, session.user.id))
	return user ?? null
}

export async function updateProfile(data: {
	name?: string
	phone?: string
	image?: string
	bannerImage?: string
	username?: string
	bio?: string
	location?: string
	website?: string
	occupation?: string
	birthdate?: string
}) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Not authenticated")

	const [updated] = await db
		.update(users)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(users.id, session.user.id))
		.returning()

	revalidatePath("/", "layout")

	return updated
}
