import { pgTable, text, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

// In-App Notifications
export const notifications = pgTable("notifications", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	type: text("type").notNull(), // order, inventory, payment, shipment, system, collaboration
	title: text("title").notNull(),
	body: text("body"),
	link: text("link"), // URL to navigate to when clicked
	metadata: jsonb("metadata").$type<Record<string, unknown>>(),
	readAt: timestamp("read_at"),
	dismissedAt: timestamp("dismissed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Notification Preferences - user settings for notifications
export const notificationPreferences = pgTable("notification_preferences", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
	// Event types
	newOrders: boolean("new_orders").default(true).notNull(),
	lowStock: boolean("low_stock").default(true).notNull(),
	payments: boolean("payments").default(true).notNull(),
	shipments: boolean("shipments").default(true).notNull(),
	collaboration: boolean("collaboration").default(true).notNull(),
	// Delivery methods
	sound: boolean("sound").default(true).notNull(),
	desktop: boolean("desktop").default(false).notNull(),
	email: boolean("email").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
