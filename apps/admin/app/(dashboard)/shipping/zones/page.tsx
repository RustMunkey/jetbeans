import { getZones } from "../actions"
import { ZonesClient } from "./zones-client"

export default async function ZonesPage() {
	const zones = await getZones()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<ZonesClient zones={zones} />
		</div>
	)
}
