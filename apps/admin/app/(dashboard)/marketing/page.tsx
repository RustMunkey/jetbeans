import { getDiscounts } from "./actions"
import { DiscountsTable } from "./discounts-table"

export default async function MarketingPage() {
	const discounts = await getDiscounts()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<DiscountsTable discounts={discounts} />
		</div>
	)
}
