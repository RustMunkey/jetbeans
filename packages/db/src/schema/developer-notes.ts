import {
	pgTable,
	text,
	uuid,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const developerNotes = pgTable("developer_notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	body: text("body").notNull(),
	type: text("type").notNull().default("bug"), // bug, feature, issue, note, working, broken
	status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
	priority: text("priority").notNull().default("medium"), // low, medium, high, critical
	authorId: text("author_id").references(() => users.id).notNull(),
	assignedTo: text("assigned_to").references(() => users.id),
	resolvedAt: timestamp("resolved_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
