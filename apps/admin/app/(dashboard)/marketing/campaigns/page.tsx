import { getCampaigns } from "../actions"
import { CampaignsTable } from "./campaigns-table"

interface PageProps {
	searchParams: Promise<{
		page?: string
	}>
}

export default async function CampaignsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getCampaigns({ page, pageSize: 30 })

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<CampaignsTable campaigns={items} totalCount={totalCount} currentPage={page} />
		</div>
	)
}
