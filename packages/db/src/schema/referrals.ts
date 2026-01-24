import {
	pgTable,
	text,
	uuid,
	decimal,
	timestamp,
	integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const referrals = pgTable("referrals", {
	id: uuid("id").primaryKey().defaultRandom(),
	referrerId: text("referrer_id")
		.notNull()
		.references(() => users.id),
	referredId: text("referred_id")
		.notNull()
		.references(() => users.id),
	referralCode: text("referral_code").notNull(),
	status: text("status").notNull().default("pending"), // pending | completed | rewarded
	rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }),
	rewardType: text("reward_type"), // credit | discount | free_product
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referralCodes = pgTable("referral_codes", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id)
		.unique(),
	code: text("code").notNull().unique(),
	totalReferrals: integer("total_referrals").default(0),
	totalEarnings: decimal("total_earnings", {
		precision: 10,
		scale: 2,
	}).default("0"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
