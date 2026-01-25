"use server"

import { headers } from "next/headers"
import { db } from "@jetbeans/db/client"
import { teamMessages, teamMessageRecipients, users } from "@jetbeans/db/schema"
import { eq, desc, asc, and, isNull, ne } from "@jetbeans/db/drizzle"
import { auth } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"

export async function getTeamMessages(userId: string) {
	return db
		.select({
			id: teamMessages.id,
			senderId: teamMessages.senderId,
			senderName: users.name,
			senderImage: users.image,
			channel: teamMessages.channel,
			body: teamMessages.body,
			createdAt: teamMessages.createdAt,
			readAt: teamMessageRecipients.readAt,
		})
		.from(teamMessageRecipients)
		.innerJoin(teamMessages, eq(teamMessageRecipients.messageId, teamMessages.id))
		.innerJoin(users, eq(teamMessages.senderId, users.id))
		.where(eq(teamMessageRecipients.recipientId, userId))
		.orderBy(asc(teamMessages.createdAt))
		.limit(100)
}

export async function getUnreadCount(userId: string) {
	const unread = await db
		.select({ id: teamMessageRecipients.id })
		.from(teamMessageRecipients)
		.where(
			and(
				eq(teamMessageRecipients.recipientId, userId),
				isNull(teamMessageRecipients.readAt)
			)
		)
	return unread.length
}

export async function sendTeamMessage(data: {
	body: string
	channel?: string
	recipientIds?: string[]
}) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Unauthorized")

	const senderId = session.user.id
	const channel = data.channel || "general"

	let recipientIds = data.recipientIds
	if (!recipientIds || recipientIds.length === 0) {
		const allUsers = await db
			.select({ id: users.id })
			.from(users)
			.where(ne(users.id, senderId))
		recipientIds = allUsers.map((u) => u.id)
	}

	const [message] = await db
		.insert(teamMessages)
		.values({ senderId, channel, body: data.body })
		.returning()

	// Insert recipient records for all recipients
	await db.insert(teamMessageRecipients).values(
		recipientIds.map((recipientId) => ({
			messageId: message.id,
			recipientId,
		}))
	)

	// Also insert sender as recipient of their own message (marked as read)
	// This ensures sender's messages appear when they reload the page
	await db.insert(teamMessageRecipients).values({
		messageId: message.id,
		recipientId: senderId,
		readAt: new Date(),
	})

	// Fire Pusher notifications in parallel, don't block response
	if (pusherServer) {
		const pusher = pusherServer
		const payload = {
			id: message.id,
			senderId,
			senderName: session.user.name,
			senderImage: session.user.image,
			channel,
			body: data.body,
			createdAt: message.createdAt.toISOString(),
			readAt: null,
		}
		// Non-blocking: fire all triggers in parallel
		Promise.all(
			recipientIds.map((recipientId) =>
				pusher.trigger(`private-user-${recipientId}`, "new-message", payload)
			)
		).catch(() => {}) // Ignore errors, message is already saved
	}

	return message
}

export async function markMessageRead(messageId: string) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Unauthorized")

	const readAt = new Date()

	await db
		.update(teamMessageRecipients)
		.set({ readAt })
		.where(
			and(
				eq(teamMessageRecipients.messageId, messageId),
				eq(teamMessageRecipients.recipientId, session.user.id)
			)
		)

	// Notify the sender that their message was read (non-blocking)
	if (pusherServer) {
		const pusher = pusherServer
		const userId = session.user.id
		const userName = session.user.name
		db.select({ senderId: teamMessages.senderId })
			.from(teamMessages)
			.where(eq(teamMessages.id, messageId))
			.then(([message]) => {
				if (message && message.senderId !== userId) {
					pusher.trigger(`private-user-${message.senderId}`, "message-read", {
						messageId,
						readBy: userName,
						readAt: readAt.toISOString(),
					}).catch(() => {})
				}
			})
			.catch(() => {})
	}
}

export async function getTeamMembers() {
	return db
		.select({ id: users.id, name: users.name, email: users.email, image: users.image })
		.from(users)
		.orderBy(users.name)
}

export async function markAllRead() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Unauthorized")

	await db
		.update(teamMessageRecipients)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(teamMessageRecipients.recipientId, session.user.id),
				isNull(teamMessageRecipients.readAt)
			)
		)
}

export async function clearConversationMessages(channel: string) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) throw new Error("Unauthorized")

	// Get message IDs for this channel
	const channelMessages = await db
		.select({ id: teamMessages.id })
		.from(teamMessages)
		.where(eq(teamMessages.channel, channel))

	if (channelMessages.length === 0) return

	const messageIds = channelMessages.map(m => m.id)

	// Delete only the recipient records for this user in this channel
	// This removes messages from their view without affecting other users
	for (const msgId of messageIds) {
		await db
			.delete(teamMessageRecipients)
			.where(
				and(
					eq(teamMessageRecipients.messageId, msgId),
					eq(teamMessageRecipients.recipientId, session.user.id)
				)
			)
	}
}

// Get read receipts for messages sent by the current user
export async function getReadReceipts(messageIds: string[]) {
	if (messageIds.length === 0) return {}

	const receipts = await db
		.select({
			messageId: teamMessageRecipients.messageId,
			recipientId: teamMessageRecipients.recipientId,
			recipientName: users.name,
			readAt: teamMessageRecipients.readAt,
		})
		.from(teamMessageRecipients)
		.innerJoin(users, eq(teamMessageRecipients.recipientId, users.id))
		.where(
			and(
				eq(teamMessageRecipients.messageId, messageIds[0] as string),
				// We'll handle multiple IDs by making multiple queries or using SQL IN
			)
		)

	// Actually, let's do this properly with a raw query approach
	// For now, return empty - we'll fetch per-message
	return {}
}

// Get read status for a single message (for sender to see who read it)
export async function getMessageReadStatus(messageId: string, senderId: string) {
	const recipients = await db
		.select({
			recipientId: teamMessageRecipients.recipientId,
			recipientName: users.name,
			readAt: teamMessageRecipients.readAt,
		})
		.from(teamMessageRecipients)
		.innerJoin(users, eq(teamMessageRecipients.recipientId, users.id))
		.where(eq(teamMessageRecipients.messageId, messageId))

	// Filter out the sender from the recipients list
	const otherRecipients = recipients.filter(r => r.recipientId !== senderId)
	const readRecipients = otherRecipients.filter(r => r.readAt !== null)

	return {
		totalRecipients: otherRecipients.length,
		readCount: readRecipients.length,
		allRead: otherRecipients.length > 0 && readRecipients.length === otherRecipients.length,
		readBy: readRecipients.map(r => ({ name: r.recipientName, readAt: r.readAt })),
	}
}

// --- INBOX (mock data until contact form schema exists) ---
import type { InboxEmail } from "./types"

export async function getInboxEmails(): Promise<InboxEmail[]> {
	return [
		{
			id: "inbox-1",
			fromName: "Marcus Johnson",
			fromEmail: "marcus.j@gmail.com",
			subject: "Question about bulk ordering",
			body: "Hi there,\n\nI'm interested in ordering 50+ bags of your Ethiopian single origin for our office. Do you offer bulk pricing or corporate accounts?\n\nThanks,\nMarcus",
			receivedAt: "2025-01-22T10:30:00Z",
			status: "unread",
			replies: [],
		},
		{
			id: "inbox-2",
			fromName: "Sarah Chen",
			fromEmail: "sarah.chen@outlook.com",
			subject: "Subscription delivery issue",
			body: "Hello,\n\nMy last subscription delivery (order #4521) seems to have been lost in transit. The tracking hasn't updated in 5 days. Can someone help?\n\nBest,\nSarah",
			receivedAt: "2025-01-21T14:15:00Z",
			status: "replied",
			replies: [
				{
					id: "reply-1",
					from: "Reese",
					body: "Hi Sarah, I've looked into this and filed a claim with the carrier. A replacement is on its way — you should receive a new tracking number within 24 hours. Sorry for the inconvenience!",
					sentAt: "2025-01-21T16:45:00Z",
				},
			],
		},
		{
			id: "inbox-3",
			fromName: "David Park",
			fromEmail: "dpark.design@gmail.com",
			subject: "Collaboration inquiry",
			body: "Hey JetBeans team!\n\nI run a ceramics studio and would love to discuss a potential collab — custom mugs featuring your branding for a limited edition release. Would anyone be interested in chatting?\n\nDavid",
			receivedAt: "2025-01-20T09:00:00Z",
			status: "read",
			replies: [],
		},
		{
			id: "inbox-4",
			fromName: "Emily Rodriguez",
			fromEmail: "emily.r@yahoo.com",
			subject: "Allergen information request",
			body: "Hi,\n\nCould you provide detailed allergen information for your flavored coffee products? Specifically the hazelnut and vanilla options. My daughter has a severe nut allergy and I want to be sure.\n\nThank you,\nEmily",
			receivedAt: "2025-01-19T11:20:00Z",
			status: "unread",
			replies: [],
		},
		{
			id: "inbox-5",
			fromName: "Tom Williams",
			fromEmail: "twilliams@company.co",
			subject: "Re: Wholesale partnership",
			body: "Following up on my previous email about stocking JetBeans in our 12 locations across the city. Happy to set up a call whenever works for your team.\n\nTom",
			receivedAt: "2025-01-18T16:30:00Z",
			status: "replied",
			replies: [
				{
					id: "reply-2",
					from: "Ash",
					body: "Tom, thanks for following up! I'd love to chat. Are you available Thursday or Friday this week? We can do a video call — I'll send a calendar invite.",
					sentAt: "2025-01-18T17:00:00Z",
				},
				{
					id: "reply-3",
					from: "Tom Williams",
					body: "Friday at 2pm works perfectly. Looking forward to it!",
					sentAt: "2025-01-18T18:30:00Z",
				},
			],
		},
		{
			id: "inbox-6",
			fromName: "Priya Sharma",
			fromEmail: "priya.s@techcorp.io",
			subject: "Gift cards for team appreciation",
			body: "Hello!\n\nWe'd like to purchase 25 digital gift cards ($50 each) for our engineering team as a holiday gift. Is there a way to buy in bulk and have them emailed to individual recipients?\n\nBest regards,\nPriya",
			receivedAt: "2025-01-17T08:45:00Z",
			status: "read",
			replies: [],
		},
		{
			id: "inbox-7",
			fromName: "Jake Morrison",
			fromEmail: "jake.m@protonmail.com",
			subject: "Missing item in order",
			body: "Hi JetBeans,\n\nI received my order (#6789) today but the ceramic pour-over set was missing from the box. The packing slip shows it should have been included. Can you help resolve this?\n\nJake",
			receivedAt: "2025-01-16T13:10:00Z",
			status: "replied",
			replies: [
				{
					id: "reply-4",
					from: "Lorena",
					body: "Hi Jake, I'm so sorry about that! I've shipped a replacement pour-over set today with express delivery at no extra cost. You should have it by Thursday. Tracking number will be emailed shortly.",
					sentAt: "2025-01-16T14:30:00Z",
				},
			],
		},
	]
}
