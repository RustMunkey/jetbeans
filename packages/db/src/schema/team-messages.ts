import { pgTable, text, uuid, timestamp, json, boolean } from "drizzle-orm/pg-core"
import { users } from "./users"
import { incomingWebhookUrls } from "./webhooks"

export type MessageAttachment = {
	type: "image" | "file" | "video" | "audio"
	url: string
	name: string
	size?: number
	mimeType?: string
}

// Discord-style embed
export type MessageEmbed = {
	title?: string
	description?: string
	url?: string
	color?: string // Hex color like "#5865F2"
	timestamp?: string // ISO timestamp
	footer?: {
		text: string
		iconUrl?: string
	}
	thumbnail?: {
		url: string
	}
	image?: {
		url: string
	}
	author?: {
		name: string
		url?: string
		iconUrl?: string
	}
	fields?: Array<{
		name: string
		value: string
		inline?: boolean
	}>
}

export const teamMessages = pgTable("team_messages", {
	id: uuid("id").primaryKey().defaultRandom(),
	// Either senderId OR webhookId - one must be set
	senderId: text("sender_id")
		.references(() => users.id, { onDelete: "cascade" }),
	webhookId: uuid("webhook_id")
		.references(() => incomingWebhookUrls.id, { onDelete: "set null" }),
	// For webhook messages, allow custom display name/avatar
	webhookUsername: text("webhook_username"),
	webhookAvatarUrl: text("webhook_avatar_url"),
	channel: text("channel").notNull().default("general"),
	body: text("body"), // Can be null if only embeds
	contentType: text("content_type").notNull().default("text"), // text, markdown
	embeds: json("embeds").$type<MessageEmbed[]>().default([]),
	attachments: json("attachments").$type<MessageAttachment[]>().default([]),
	isSystemMessage: boolean("is_system_message").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const teamMessageRecipients = pgTable("team_message_recipients", {
	id: uuid("id").primaryKey().defaultRandom(),
	messageId: uuid("message_id")
		.notNull()
		.references(() => teamMessages.id, { onDelete: "cascade" }),
	recipientId: text("recipient_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	readAt: timestamp("read_at"),
})

// Channels configuration
export const messageChannels = pgTable("message_channels", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(), // e.g., "general", "integrations", "alerts"
	description: text("description"),
	type: text("type").notNull().default("team"), // team, alerts, integrations
	isDefault: boolean("is_default").default(false).notNull(),
	isArchived: boolean("is_archived").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
