import {
	pgTable,
	text,
	uuid,
	integer,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const mediaItems = pgTable("media_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	url: text("url").notNull(),
	filename: text("filename").notNull(),
	mimeType: text("mime_type"),
	size: integer("size"),
	alt: text("alt"),
	folder: text("folder"),
	uploadedBy: text("uploaded_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
