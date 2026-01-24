import { getSegments } from "./actions"
import { SegmentsClient } from "./segments-client"

export default async function SegmentsPage() {
	const segments = await getSegments()

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<SegmentsClient segments={segments} />
		</div>
	)
}
