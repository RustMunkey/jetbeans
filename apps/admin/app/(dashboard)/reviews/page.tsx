import { getReviews } from "./actions"
import { ReviewsTable } from "./reviews-table"

interface PageProps {
	searchParams: Promise<{
		page?: string
		status?: string
	}>
}

export default async function ReviewsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getReviews({
		page,
		pageSize: 30,
		status: params.status,
	})

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Reviews</h2>
				<p className="text-sm text-muted-foreground">
					Moderate customer reviews.
				</p>
			</div>

			<ReviewsTable
				reviews={items}
				totalCount={totalCount}
				currentPage={page}
				currentStatus={params.status}
			/>
		</div>
	)
}
