import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"

export const teamMessages = pgTable("team_messages", {
	id: uuid("id").primaryKey().defaultRandom(),
	senderId: text("sender_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	channel: text("channel").notNull().default("general"),
	body: text("body").notNull(),
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
