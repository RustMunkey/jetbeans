import { getCarriers } from "./actions"
import { CarriersTable } from "./carriers-table"

export default async function ShippingPage() {
	const carriers = await getCarriers()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<CarriersTable carriers={carriers} />
		</div>
	)
}
