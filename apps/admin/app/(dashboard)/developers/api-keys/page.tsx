import { getStorefronts } from "@/app/(dashboard)/settings/storefronts/actions"
import { ApiKeysClient } from "./api-keys-client"

export default async function ApiKeysPage() {
	const storefronts = await getStorefronts()

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">API Keys</h2>
				<p className="text-sm text-muted-foreground">
					Manage API keys for your external applications and storefronts.
				</p>
			</div>
			<ApiKeysClient storefronts={storefronts} />
		</div>
	)
}
