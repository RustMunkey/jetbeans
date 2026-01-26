import { getInventory } from "./actions"
import { InventoryTable } from "./inventory-table"

interface PageProps {
	searchParams: Promise<{
		page?: string
		search?: string
		filter?: string
	}>
}

export default async function InventoryPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getInventory({
		page,
		pageSize: 30,
		search: params.search,
		filter: params.filter,
	})

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Stock Levels</h2>
				<p className="text-sm text-muted-foreground">
					Monitor and adjust inventory across all products.
				</p>
			</div>

			<InventoryTable
				items={items}
				totalCount={totalCount}
				currentPage={page}
				currentFilter={params.filter}
			/>
		</div>
	)
}
