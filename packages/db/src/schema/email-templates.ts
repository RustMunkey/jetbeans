import {
	pgTable,
	text,
	uuid,
	boolean,
	timestamp,
	jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const emailTemplates = pgTable("email_templates", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	subject: text("subject").notNull(),
	body: text("body"),
	variables: jsonb("variables").$type<string[]>().default([]),
	isActive: boolean("is_active").default(true),
	updatedBy: text("updated_by").references(() => users.id),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
	id: uuid("id").primaryKey().defaultRandom(),
	templateId: uuid("template_id").references(() => emailTemplates.id),
	recipientId: text("recipient_id").references(() => users.id),
	recipientEmail: text("recipient_email").notNull(),
	subject: text("subject").notNull(),
	body: text("body"),
	status: text("status").notNull().default("sent"),
	sentBy: text("sent_by").references(() => users.id),
	sentAt: timestamp("sent_at").defaultNow().notNull(),
});
