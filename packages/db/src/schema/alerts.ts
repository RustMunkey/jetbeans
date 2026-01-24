import {
	pgTable,
	text,
	uuid,
	integer,
	boolean,
	timestamp,
	jsonb,
} from "drizzle-orm/pg-core";

export const alertRules = pgTable("alert_rules", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	type: text("type").notNull(),
	channel: text("channel").notNull().default("email"),
	threshold: integer("threshold"),
	isActive: boolean("is_active").default(true),
	recipients: jsonb("recipients").$type<string[]>().default([]),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
