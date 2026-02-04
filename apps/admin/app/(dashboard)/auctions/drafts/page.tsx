import { Suspense } from "react"
import { getDraftAuctions } from "../actions"
import { AuctionsTable } from "../auctions-table"

export default async function DraftAuctionsPage() {
	const { items, totalCount } = await getDraftAuctions()

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Draft Auctions</h2>
				<p className="text-sm text-muted-foreground">
					Auctions that haven't been published yet.
				</p>
			</div>
			<Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
				<AuctionsTable auctions={items} totalCount={totalCount} view="drafts" />
			</Suspense>
		</div>
	)
}
