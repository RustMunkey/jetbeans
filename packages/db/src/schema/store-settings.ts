import {
	pgTable,
	text,
	uuid,
	timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const storeSettings = pgTable("store_settings", {
	id: uuid("id").primaryKey().defaultRandom(),
	key: text("key").notNull().unique(),
	value: text("value"),
	group: text("group").notNull().default("general"),
	updatedBy: text("updated_by").references(() => users.id),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
