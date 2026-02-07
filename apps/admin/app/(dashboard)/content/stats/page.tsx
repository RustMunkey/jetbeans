import { getStatsItems } from "../actions"
import { StatsTable } from "./stats-table"

export default async function StatsPage() {
	const items = await getStatsItems()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<p className="text-sm text-muted-foreground">Manage homepage counter stats displayed on your storefront.</p>
			<StatsTable items={items} />
		</div>
	)
}
