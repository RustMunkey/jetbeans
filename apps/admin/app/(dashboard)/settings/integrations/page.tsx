import { getSettings } from "../actions"
import { IntegrationsClient } from "./integrations-client"

export default async function IntegrationsPage() {
	const settings = await getSettings()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<IntegrationsClient settings={settings} />
		</div>
	)
}
