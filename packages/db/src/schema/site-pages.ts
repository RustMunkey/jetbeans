import {
	pgTable,
	text,
	uuid,
	timestamp,
} from "drizzle-orm/pg-core";

export const sitePages = pgTable("site_pages", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	content: text("content"),
	status: text("status").notNull().default("draft"),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
