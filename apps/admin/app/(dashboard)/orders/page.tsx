import { getOrders } from "./actions"
import { OrdersTable } from "./orders-table"

interface PageProps {
	searchParams: Promise<{
		page?: string
		status?: string
		search?: string
	}>
}

export default async function OrdersPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getOrders({
		page,
		pageSize: 30,
		status: params.status,
		search: params.search,
	})

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Orders</h2>
				<p className="text-sm text-muted-foreground">
					View and manage customer orders.
				</p>
			</div>

			<OrdersTable
				orders={items}
				totalCount={totalCount}
				currentPage={page}
				currentStatus={params.status}
			/>
		</div>
	)
}
