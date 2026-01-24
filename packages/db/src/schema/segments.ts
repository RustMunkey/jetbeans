import {
	pgTable,
	text,
	uuid,
	timestamp,
	jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const customerSegments = pgTable("customer_segments", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
	type: text("type").notNull().default("manual"),
	rules: jsonb("rules").$type<Array<{ field: string; operator: string; value: string }>>(),
	color: text("color").default("gray"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerSegmentMembers = pgTable("customer_segment_members", {
	id: uuid("id").primaryKey().defaultRandom(),
	segmentId: uuid("segment_id")
		.notNull()
		.references(() => customerSegments.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	addedAt: timestamp("added_at").defaultNow().notNull(),
});
