"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@jetbeans/db/client"
import { eq, desc } from "@jetbeans/db/drizzle"
import { userAudio } from "@jetbeans/db/schema"
import { put, del } from "@vercel/blob"

export type UserAudioTrack = {
	id: string
	name: string
	artist: string | null
	url: string
	duration: number | null
	fileSize: number | null
	createdAt: Date
}

async function getCurrentUser() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Unauthorized")
	return session.user
}

export async function getUserAudioTracks(): Promise<UserAudioTrack[]> {
	const user = await getCurrentUser()

	return db
		.select({
			id: userAudio.id,
			name: userAudio.name,
			artist: userAudio.artist,
			url: userAudio.url,
			duration: userAudio.duration,
			fileSize: userAudio.fileSize,
			createdAt: userAudio.createdAt,
		})
		.from(userAudio)
		.where(eq(userAudio.userId, user.id))
		.orderBy(desc(userAudio.createdAt))
}

export async function uploadAudioTrack(formData: FormData): Promise<UserAudioTrack> {
	const user = await getCurrentUser()

	const file = formData.get("file") as File
	const name = formData.get("name") as string
	const artist = formData.get("artist") as string | null

	if (!file || !name) {
		throw new Error("File and name are required")
	}

	// Validate file type
	if (!file.type.startsWith("audio/")) {
		throw new Error("File must be an audio file")
	}

	// Upload to Vercel Blob
	const blob = await put(`audio/${user.id}/${Date.now()}-${file.name}`, file, {
		access: "public",
	})

	// Create database record
	const [track] = await db
		.insert(userAudio)
		.values({
			userId: user.id,
			name,
			artist: artist || null,
			url: blob.url,
			fileSize: file.size,
			mimeType: file.type,
		})
		.returning()

	return {
		id: track.id,
		name: track.name,
		artist: track.artist,
		url: track.url,
		duration: track.duration,
		fileSize: track.fileSize,
		createdAt: track.createdAt,
	}
}

export async function updateAudioTrack(
	id: string,
	data: { name?: string; artist?: string | null; duration?: number }
): Promise<UserAudioTrack> {
	const user = await getCurrentUser()

	const [track] = await db
		.update(userAudio)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(userAudio.id, id))
		.returning()

	if (!track || track.userId !== user.id) {
		throw new Error("Track not found")
	}

	return {
		id: track.id,
		name: track.name,
		artist: track.artist,
		url: track.url,
		duration: track.duration,
		fileSize: track.fileSize,
		createdAt: track.createdAt,
	}
}

export async function deleteAudioTrack(id: string): Promise<void> {
	const user = await getCurrentUser()

	// Get the track first to get the URL
	const [track] = await db
		.select()
		.from(userAudio)
		.where(eq(userAudio.id, id))
		.limit(1)

	if (!track || track.userId !== user.id) {
		throw new Error("Track not found")
	}

	// Delete from blob storage
	try {
		await del(track.url)
	} catch {
		// Ignore blob deletion errors
	}

	// Delete from database
	await db.delete(userAudio).where(eq(userAudio.id, id))
}
