import { inngest } from "../inngest"
import { db } from "@jetbeans/db"
import { userPresence, pageViewers } from "@jetbeans/db/schema"
import { lt } from "@jetbeans/db/drizzle"

// Clean up stale presence records every 5 minutes
export const cleanupStalePresence = inngest.createFunction(
	{ id: "cleanup-stale-presence" },
	{ cron: "*/5 * * * *" }, // Every 5 minutes
	async ({ step }) => {
		const staleThreshold = 5 * 60 * 1000 // 5 minutes in ms
		const cutoff = new Date(Date.now() - staleThreshold)

		const deletedPresence = await step.run("cleanup-user-presence", async () => {
			const result = await db
				.delete(userPresence)
				.where(lt(userPresence.lastSeenAt, cutoff))
				.returning({ id: userPresence.id })

			return result.length
		})

		const deletedPageViewers = await step.run("cleanup-page-viewers", async () => {
			const result = await db
				.delete(pageViewers)
				.where(lt(pageViewers.viewingSince, cutoff))
				.returning({ id: pageViewers.id })

			return result.length
		})

		return {
			success: true,
			deletedPresence,
			deletedPageViewers,
		}
	}
)

export const presenceHandlers = [
	cleanupStalePresence,
]
