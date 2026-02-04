import { Suspense } from "react"
import { getSubscriptions } from "../actions"
import { SubscriptionsTable } from "../subscriptions-table"
import { subscriptionsParamsCache } from "@/lib/search-params"

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DunningSubscriptionsPage({ searchParams }: PageProps) {
	const { page } = await subscriptionsParamsCache.parse(searchParams)

	const { items, totalCount } = await getSubscriptions({ page, pageSize: 30, status: "dunning" })

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
				<SubscriptionsTable
					subscriptions={items}
					totalCount={totalCount}
					currentStatus="dunning"
					title="Dunning"
					description="Subscriptions with failed payment attempts requiring attention."
				/>
			</Suspense>
		</div>
	)
}
