import { getSubscriptions } from "../actions"
import { SubscriptionsTable } from "../subscriptions-table"

interface PageProps {
	searchParams: Promise<{ page?: string }>
}

export default async function DunningSubscriptionsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1

	const { items, totalCount } = await getSubscriptions({ page, pageSize: 30, status: "dunning" })

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<SubscriptionsTable
				subscriptions={items}
				totalCount={totalCount}
				currentPage={page}
				currentStatus="dunning"
				title="Dunning"
				description="Subscriptions with failed payment attempts requiring attention."
			/>
		</div>
	)
}
