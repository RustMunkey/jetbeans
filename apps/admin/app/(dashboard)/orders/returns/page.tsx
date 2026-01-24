import { getOrdersByStatus } from "../actions"
import { ReturnsClient } from "./returns-client"

export default async function ReturnsPage() {
	const orders = await getOrdersByStatus(["refunded", "partially_refunded", "returned"])

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Returns & Refunds</h2>
				<p className="text-sm text-muted-foreground">
					Orders with refunds or returns.
				</p>
			</div>

			<ReturnsClient orders={orders} />
		</div>
	)
}
