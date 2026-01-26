import { getZones } from "../actions"
import { ZonesClient } from "./zones-client"

interface PageProps {
	searchParams: Promise<{
		page?: string
	}>
}

export default async function ZonesPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getZones({ page, pageSize: 30 })

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<ZonesClient zones={items} totalCount={totalCount} currentPage={page} />
		</div>
	)
}
