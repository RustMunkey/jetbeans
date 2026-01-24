import {
	pgTable,
	text,
	uuid,
	timestamp,
	jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const blogPosts = pgTable("blog_posts", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	excerpt: text("excerpt"),
	content: text("content"),
	coverImage: text("cover_image"),
	author: text("author").references(() => users.id),
	status: text("status").notNull().default("draft"),
	publishedAt: timestamp("published_at"),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	tags: jsonb("tags").$type<string[]>().default([]),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
