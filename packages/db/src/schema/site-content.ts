import {
	pgTable,
	text,
	uuid,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const siteContent = pgTable("site_content", {
	id: uuid("id").primaryKey().defaultRandom(),
	key: text("key").notNull().unique(),
	type: text("type").notNull().default("text"),
	value: text("value"),
	updatedBy: text("updated_by").references(() => users.id),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
