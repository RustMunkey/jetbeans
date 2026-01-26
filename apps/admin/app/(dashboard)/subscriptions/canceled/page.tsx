import { getSubscriptions } from "../actions"
import { SubscriptionsTable } from "../subscriptions-table"

interface PageProps {
	searchParams: Promise<{ page?: string }>
}

export default async function CanceledSubscriptionsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1

	const { items, totalCount } = await getSubscriptions({ page, pageSize: 30, status: "cancelled" })

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<SubscriptionsTable
				subscriptions={items}
				totalCount={totalCount}
				currentPage={page}
				currentStatus="cancelled"
				title="Cancelled Subscriptions"
				description="Subscriptions that have been cancelled by customers."
			/>
		</div>
	)
}
