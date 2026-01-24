import { getCampaigns } from "../actions"
import { CampaignsTable } from "./campaigns-table"

export default async function CampaignsPage() {
	const campaigns = await getCampaigns()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<CampaignsTable campaigns={campaigns} />
		</div>
	)
}
