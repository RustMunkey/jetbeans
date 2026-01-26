import { getDiscounts } from "./actions"
import { DiscountsTable } from "./discounts-table"

interface PageProps {
	searchParams: Promise<{
		page?: string
	}>
}

export default async function MarketingPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getDiscounts({ page, pageSize: 30 })

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<DiscountsTable discounts={items} totalCount={totalCount} currentPage={page} />
		</div>
	)
}
