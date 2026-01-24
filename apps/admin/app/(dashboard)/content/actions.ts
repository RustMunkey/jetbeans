"use server"

import { db } from "@jetbeans/db/client"
import * as schema from "@jetbeans/db/schema"
import { eq, desc, and, ilike } from "@jetbeans/db/drizzle"

// --- BLOG POSTS ---
export async function getBlogPosts(params?: { status?: string }) {
	const conditions = []
	if (params?.status && params.status !== "all") {
		conditions.push(eq(schema.blogPosts.status, params.status))
	}

	return db
		.select()
		.from(schema.blogPosts)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(schema.blogPosts.createdAt))
}

export async function getBlogPost(id: string) {
	const [post] = await db
		.select()
		.from(schema.blogPosts)
		.where(eq(schema.blogPosts.id, id))
	return post ?? null
}

export async function createBlogPost(data: {
	title: string
	slug: string
	excerpt?: string
	content?: string
	coverImage?: string
	status?: string
	metaTitle?: string
	metaDescription?: string
	tags?: string[]
}) {
	const [post] = await db
		.insert(schema.blogPosts)
		.values({
			title: data.title,
			slug: data.slug,
			excerpt: data.excerpt || undefined,
			content: data.content || undefined,
			coverImage: data.coverImage || undefined,
			status: data.status || "draft",
			publishedAt: data.status === "published" ? new Date() : undefined,
			metaTitle: data.metaTitle || undefined,
			metaDescription: data.metaDescription || undefined,
			tags: data.tags || [],
		})
		.returning()
	return post
}

export async function updateBlogPost(id: string, data: {
	title?: string
	slug?: string
	excerpt?: string
	content?: string
	coverImage?: string
	status?: string
	metaTitle?: string
	metaDescription?: string
	tags?: string[]
}) {
	const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() }
	if (data.status === "published" && !updateData.publishedAt) {
		updateData.publishedAt = new Date()
	}
	const [post] = await db
		.update(schema.blogPosts)
		.set(updateData)
		.where(eq(schema.blogPosts.id, id))
		.returning()
	return post
}

export async function deleteBlogPost(id: string) {
	await db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, id))
}

// --- SITE PAGES ---
export async function getSitePages() {
	return db
		.select()
		.from(schema.sitePages)
		.orderBy(desc(schema.sitePages.updatedAt))
}

export async function getSitePage(id: string) {
	const [page] = await db
		.select()
		.from(schema.sitePages)
		.where(eq(schema.sitePages.id, id))
	return page ?? null
}

export async function createSitePage(data: {
	title: string
	slug: string
	content?: string
	status?: string
	metaTitle?: string
	metaDescription?: string
}) {
	const [page] = await db
		.insert(schema.sitePages)
		.values({
			title: data.title,
			slug: data.slug,
			content: data.content || undefined,
			status: data.status || "draft",
			metaTitle: data.metaTitle || undefined,
			metaDescription: data.metaDescription || undefined,
		})
		.returning()
	return page
}

export async function updateSitePage(id: string, data: {
	title?: string
	slug?: string
	content?: string
	status?: string
	metaTitle?: string
	metaDescription?: string
}) {
	const [page] = await db
		.update(schema.sitePages)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(schema.sitePages.id, id))
		.returning()
	return page
}

export async function deleteSitePage(id: string) {
	await db.delete(schema.sitePages).where(eq(schema.sitePages.id, id))
}

// --- SITE CONTENT ---
export async function getSiteContent() {
	return db
		.select()
		.from(schema.siteContent)
		.orderBy(schema.siteContent.key)
}

export async function updateSiteContent(key: string, value: string) {
	const [existing] = await db
		.select()
		.from(schema.siteContent)
		.where(eq(schema.siteContent.key, key))

	if (existing) {
		await db
			.update(schema.siteContent)
			.set({ value, updatedAt: new Date() })
			.where(eq(schema.siteContent.key, key))
	} else {
		await db
			.insert(schema.siteContent)
			.values({ key, value, type: "text" })
	}
}

// --- MEDIA LIBRARY ---
export async function getMediaItems(params?: { type?: string; folder?: string }) {
	const conditions = []
	if (params?.type === "image") {
		conditions.push(ilike(schema.mediaItems.mimeType, "image/%"))
	} else if (params?.type === "video") {
		conditions.push(ilike(schema.mediaItems.mimeType, "video/%"))
	}
	if (params?.folder) {
		conditions.push(eq(schema.mediaItems.folder, params.folder))
	}

	return db
		.select()
		.from(schema.mediaItems)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(schema.mediaItems.createdAt))
}

export async function createMediaItem(data: {
	url: string
	filename: string
	mimeType?: string
	size?: number
	alt?: string
	folder?: string
}) {
	const [item] = await db
		.insert(schema.mediaItems)
		.values(data)
		.returning()
	return item
}

export async function updateMediaItem(id: string, data: { alt?: string; folder?: string }) {
	const [item] = await db
		.update(schema.mediaItems)
		.set(data)
		.where(eq(schema.mediaItems.id, id))
		.returning()
	return item
}

export async function deleteMediaItem(id: string) {
	await db.delete(schema.mediaItems).where(eq(schema.mediaItems.id, id))
}
