import { getLoyaltyConfig, getTopPointHolders, getRecentTransactions } from "./actions"
import { LoyaltyClient } from "./loyalty-client"

export default async function LoyaltyPage() {
	const [config, holders, transactions] = await Promise.all([
		getLoyaltyConfig(),
		getTopPointHolders(),
		getRecentTransactions(),
	])

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<LoyaltyClient
				config={config}
				holders={holders}
				transactions={transactions}
			/>
		</div>
	)
}
