import { getOrdersByStatus } from "../actions"
import { FulfillmentClient } from "./fulfillment-client"

export default async function FulfillmentPage() {
	const orders = await getOrdersByStatus(["confirmed", "processing", "packed"])

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Fulfillment</h2>
				<p className="text-sm text-muted-foreground">
					Orders ready to be packed and shipped.
				</p>
			</div>

			<FulfillmentClient orders={orders} />
		</div>
	)
}
