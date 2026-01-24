import { getReviews } from "../actions"
import { ReviewsTable } from "../reviews-table"

interface PageProps {
	searchParams: Promise<{ page?: string }>
}

export default async function PendingReviewsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getReviews({
		page,
		pageSize: 20,
		status: "pending",
	})

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Pending Reviews</h2>
				<p className="text-sm text-muted-foreground">
					Reviews awaiting moderation.
				</p>
			</div>

			<ReviewsTable
				reviews={items}
				totalCount={totalCount}
				currentPage={page}
				currentStatus="pending"
			/>
		</div>
	)
}
