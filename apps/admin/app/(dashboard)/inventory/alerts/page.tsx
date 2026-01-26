import { getAlerts } from "../actions"
import { AlertsClient } from "./alerts-client"

interface PageProps {
	searchParams: Promise<{
		page?: string
	}>
}

export default async function AlertsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getAlerts({ page, pageSize: 30 })

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Inventory Alerts</h2>
				<p className="text-sm text-muted-foreground">
					Items that are low or out of stock.
				</p>
			</div>

			<AlertsClient items={items} totalCount={totalCount} currentPage={page} />
		</div>
	)
}
