import { getInventoryLogs } from "../actions"
import { ActivityClient } from "./activity-client"

interface PageProps {
	searchParams: Promise<{
		page?: string
	}>
}

export default async function ActivityPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getInventoryLogs({ page, pageSize: 30 })

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Inventory Activity</h2>
				<p className="text-sm text-muted-foreground">
					History of all stock changes.
				</p>
			</div>

			<ActivityClient
				items={items}
				totalCount={totalCount}
				currentPage={page}
			/>
		</div>
	)
}
