import { pgTable, text, uuid, integer } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	parentId: uuid("parent_id"),
	sortOrder: integer("sort_order").default(0),
	image: text("image"),
});
