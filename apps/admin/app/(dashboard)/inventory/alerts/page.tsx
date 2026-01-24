import { getAlerts } from "../actions"
import { AlertsClient } from "./alerts-client"

export default async function AlertsPage() {
	const items = await getAlerts()

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Inventory Alerts</h2>
				<p className="text-sm text-muted-foreground">
					Items that are low or out of stock.
				</p>
			</div>

			<AlertsClient items={items} />
		</div>
	)
}
