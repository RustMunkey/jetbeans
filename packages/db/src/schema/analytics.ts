import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const analyticsEvents = pgTable("analytics_events", {
	id: uuid("id").primaryKey().defaultRandom(),
	sessionId: text("session_id").notNull(),
	visitorId: text("visitor_id").notNull(),
	eventType: text("event_type").notNull().default("pageview"),
	pathname: text("pathname").notNull(),
	referrer: text("referrer"),
	hostname: text("hostname"),
	eventData: jsonb("event_data").$type<Record<string, unknown>>(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
