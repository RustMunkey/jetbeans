import { getCustomers } from "./actions"
import { CustomersTable } from "./customers-table"

interface PageProps {
	searchParams: Promise<{
		page?: string
		search?: string
		segment?: string
	}>
}

export default async function CustomersPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getCustomers({
		page,
		pageSize: 20,
		search: params.search,
		segment: params.segment,
	})

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Customers</h2>
				<p className="text-sm text-muted-foreground">
					View and manage your customer base.
				</p>
			</div>

			<CustomersTable
				customers={items}
				totalCount={totalCount}
				currentPage={page}
			/>
		</div>
	)
}
