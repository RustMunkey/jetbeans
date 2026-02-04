import { Suspense } from "react"
import { getClosedAuctions } from "../actions"
import { AuctionsTable } from "../auctions-table"

export default async function ClosedAuctionsPage() {
	const { items, totalCount } = await getClosedAuctions()

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Closed Auctions</h2>
				<p className="text-sm text-muted-foreground">
					Auctions that have ended, sold, or been cancelled.
				</p>
			</div>
			<Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
				<AuctionsTable auctions={items} totalCount={totalCount} view="closed" />
			</Suspense>
		</div>
	)
}
