import {
	pgTable,
	text,
	uuid,
	integer,
	decimal,
	boolean,
	timestamp,
	jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { orders } from "./orders";

export const loyaltyProgram = pgTable("loyalty_program", {
	id: uuid("id").primaryKey().defaultRandom(),
	pointsPerDollar: integer("points_per_dollar").notNull().default(10),
	pointsRedemptionRate: decimal("points_redemption_rate", { precision: 10, scale: 4 }).notNull().default("0.01"),
	tiers: jsonb("tiers").$type<Array<{ name: string; minPoints: number; perks: string[] }>>().default([]),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loyaltyPoints = pgTable("loyalty_points", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.unique(),
	points: integer("points").notNull().default(0),
	lifetimePoints: integer("lifetime_points").notNull().default(0),
	tier: text("tier"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	points: integer("points").notNull(),
	description: text("description"),
	orderId: uuid("order_id").references(() => orders.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
