import { db } from "@jetbeans/db/client"
import { auditLog } from "@jetbeans/db/schema"
import { desc, count } from "@jetbeans/db/drizzle"
import { ActivityLogClient } from "./activity-log-client"

interface PageProps {
	searchParams: Promise<{
		page?: string
	}>
}

export default async function ActivityLogPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const pageSize = 30
	const offset = (page - 1) * pageSize

	const [entries, [total]] = await Promise.all([
		db
			.select({
				id: auditLog.id,
				userName: auditLog.userName,
				userEmail: auditLog.userEmail,
				action: auditLog.action,
				targetType: auditLog.targetType,
				targetId: auditLog.targetId,
				targetLabel: auditLog.targetLabel,
				createdAt: auditLog.createdAt,
			})
			.from(auditLog)
			.orderBy(desc(auditLog.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ count: count() }).from(auditLog),
	])

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Activity Log</h2>
				<p className="text-sm text-muted-foreground">
					Recent actions across the admin panel.
				</p>
			</div>

			<ActivityLogClient
				entries={entries}
				totalCount={Number(total.count)}
				currentPage={page}
			/>
		</div>
	)
}
