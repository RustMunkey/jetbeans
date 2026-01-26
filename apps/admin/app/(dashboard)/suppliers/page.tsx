import { getSuppliers } from "./actions"
import { SuppliersTable } from "./suppliers-table"

interface PageProps {
	searchParams: Promise<{
		page?: string
	}>
}

export default async function SuppliersPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getSuppliers({ page, pageSize: 30 })

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<SuppliersTable suppliers={items} totalCount={totalCount} currentPage={page} />
		</div>
	)
}
