import { getTestimonials } from "../actions"
import { TestimonialsTable } from "./testimonials-table"

interface PageProps {
	searchParams: Promise<{ status?: string }>
}

export default async function TestimonialsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const items = await getTestimonials({ status: params.status })

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<p className="text-sm text-muted-foreground">Manage customer testimonials and reviews.</p>
			<TestimonialsTable items={items} currentStatus={params.status || "all"} />
		</div>
	)
}
