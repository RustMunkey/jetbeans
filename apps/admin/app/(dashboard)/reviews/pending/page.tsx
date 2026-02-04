import { Suspense } from "react"
import { getReviews } from "../actions"
import { ReviewsTable } from "../reviews-table"
import { reviewsParamsCache } from "@/lib/search-params"

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PendingReviewsPage({ searchParams }: PageProps) {
	const { page } = await reviewsParamsCache.parse(searchParams)
	const { items, totalCount } = await getReviews({
		page,
		pageSize: 30,
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

			<Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
				<ReviewsTable
					reviews={items}
					totalCount={totalCount}
				/>
			</Suspense>
		</div>
	)
}
