import { Suspense } from "react"
import { getActiveAuctions } from "./actions"
import { AuctionsTable } from "./auctions-table"

export default async function AuctionsPage() {
	const { items, totalCount } = await getActiveAuctions()

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Active Auctions</h2>
				<p className="text-sm text-muted-foreground">
					Live auctions currently accepting bids.
				</p>
			</div>
			<Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
				<AuctionsTable auctions={items} totalCount={totalCount} view="active" />
			</Suspense>
		</div>
	)
}
