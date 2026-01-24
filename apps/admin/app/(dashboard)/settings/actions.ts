"use server"

import { db } from "@jetbeans/db/client"
import * as schema from "@jetbeans/db/schema"
import { eq, and } from "@jetbeans/db/drizzle"

export async function getSettings(group?: string) {
	if (group) {
		return db
			.select()
			.from(schema.storeSettings)
			.where(eq(schema.storeSettings.group, group))
			.orderBy(schema.storeSettings.key)
	}
	return db
		.select()
		.from(schema.storeSettings)
		.orderBy(schema.storeSettings.group, schema.storeSettings.key)
}

export async function getSetting(key: string) {
	const [setting] = await db
		.select()
		.from(schema.storeSettings)
		.where(eq(schema.storeSettings.key, key))
	return setting?.value ?? null
}

export async function updateSetting(key: string, value: string, group: string = "general") {
	const [existing] = await db
		.select()
		.from(schema.storeSettings)
		.where(eq(schema.storeSettings.key, key))

	if (existing) {
		await db
			.update(schema.storeSettings)
			.set({ value, updatedAt: new Date() })
			.where(eq(schema.storeSettings.key, key))
	} else {
		await db
			.insert(schema.storeSettings)
			.values({ key, value, group })
	}
}

export async function updateSettings(entries: { key: string; value: string; group: string }[]) {
	for (const entry of entries) {
		await updateSetting(entry.key, entry.value, entry.group)
	}
}
