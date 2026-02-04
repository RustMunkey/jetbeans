import { getStorefronts } from "./actions"
import { StorefrontsClient } from "./storefronts-client"

export default async function StorefrontsPage() {
	const storefronts = await getStorefronts()

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Storefronts</h2>
				<p className="text-sm text-muted-foreground">
					Connect your external websites and apps via API.
				</p>
			</div>
			<StorefrontsClient storefronts={storefronts} />
		</div>
	)
}
