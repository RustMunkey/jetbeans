import { getReviews } from "../actions"
import { ReviewsTable } from "../reviews-table"

interface PageProps {
	searchParams: Promise<{ page?: string }>
}

export default async function ReportedReviewsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getReviews({
		page,
		pageSize: 20,
		status: "reported",
	})

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Reported Reviews</h2>
				<p className="text-sm text-muted-foreground">
					Reviews flagged for inappropriate content.
				</p>
			</div>

			<ReviewsTable
				reviews={items}
				totalCount={totalCount}
				currentPage={page}
				currentStatus="reported"
			/>
		</div>
	)
}
