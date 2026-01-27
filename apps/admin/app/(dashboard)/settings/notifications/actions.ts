"use server"

import { headers } from "next/headers"
import { eq, desc, and, isNull } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { notifications, notificationPreferences } from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"

async function requireUser() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Not authenticated")
	return session.user
}

// Fetch notifications for current user (excludes dismissed)
export async function getNotifications(limit = 20, includeRead = false) {
	const user = await requireUser()

	const conditions = [
		eq(notifications.userId, user.id),
		isNull(notifications.dismissedAt), // Always exclude dismissed
	]
	if (!includeRead) {
		conditions.push(isNull(notifications.readAt))
	}

	return db
		.select()
		.from(notifications)
		.where(and(...conditions))
		.orderBy(desc(notifications.createdAt))
		.limit(limit)
}

// Get unread count (excludes dismissed)
export async function getUnreadCount() {
	const user = await requireUser()

	const result = await db
		.select({ id: notifications.id })
		.from(notifications)
		.where(
			and(
				eq(notifications.userId, user.id),
				isNull(notifications.readAt),
				isNull(notifications.dismissedAt) // Exclude dismissed
			)
		)

	return result.length
}

// Mark single notification as read
export async function markNotificationRead(notificationId: string) {
	const user = await requireUser()

	await db
		.update(notifications)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(notifications.id, notificationId),
				eq(notifications.userId, user.id)
			)
		)
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
	const user = await requireUser()

	await db
		.update(notifications)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(notifications.userId, user.id),
				isNull(notifications.readAt)
			)
		)
}

// Dismiss notification (hide from list)
export async function dismissNotification(notificationId: string) {
	const user = await requireUser()

	await db
		.update(notifications)
		.set({ dismissedAt: new Date() })
		.where(
			and(
				eq(notifications.id, notificationId),
				eq(notifications.userId, user.id)
			)
		)
}

// Clear all notifications
export async function clearAllNotifications() {
	const user = await requireUser()

	await db
		.update(notifications)
		.set({ dismissedAt: new Date() })
		.where(eq(notifications.userId, user.id))
}

// Get notification preferences
export async function getNotificationPreferences() {
	const user = await requireUser()

	const [prefs] = await db
		.select()
		.from(notificationPreferences)
		.where(eq(notificationPreferences.userId, user.id))
		.limit(1)

	// Return defaults if no preferences exist
	if (!prefs) {
		return {
			newOrders: true,
			lowStock: true,
			payments: true,
			shipments: true,
			collaboration: true,
			sound: true,
			desktop: false,
			email: false,
		}
	}

	return {
		newOrders: prefs.newOrders,
		lowStock: prefs.lowStock,
		payments: prefs.payments,
		shipments: prefs.shipments,
		collaboration: prefs.collaboration,
		sound: prefs.sound,
		desktop: prefs.desktop,
		email: prefs.email,
	}
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: {
	newOrders?: boolean
	lowStock?: boolean
	payments?: boolean
	shipments?: boolean
	collaboration?: boolean
	sound?: boolean
	desktop?: boolean
	email?: boolean
}) {
	const user = await requireUser()

	// Check if preferences exist
	const [existing] = await db
		.select({ id: notificationPreferences.id })
		.from(notificationPreferences)
		.where(eq(notificationPreferences.userId, user.id))
		.limit(1)

	if (existing) {
		await db
			.update(notificationPreferences)
			.set({
				...preferences,
				updatedAt: new Date(),
			})
			.where(eq(notificationPreferences.userId, user.id))
	} else {
		await db.insert(notificationPreferences).values({
			userId: user.id,
			...preferences,
		})
	}

	return getNotificationPreferences()
}

// Create a notification (utility for other parts of the app)
export async function createNotification(data: {
	userId: string
	type: string
	title: string
	body?: string
	link?: string
	metadata?: Record<string, unknown>
}) {
	const [notification] = await db
		.insert(notifications)
		.values(data)
		.returning()

	// Broadcast via Pusher for real-time updates
	const { pusherServer } = await import("@/lib/pusher-server")
	if (pusherServer) {
		await pusherServer.trigger(`private-user-${data.userId}`, "notification", {
			id: notification.id,
			type: notification.type,
			title: notification.title,
			body: notification.body,
			link: notification.link,
			metadata: notification.metadata,
			createdAt: notification.createdAt.toISOString(),
			readAt: null,
		})
	}

	return notification
}
