import { getProductsSeo } from "../actions"
import { SeoClient } from "./seo-client"

export default async function SeoPage() {
	const products = await getProductsSeo()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<SeoClient products={products} />
		</div>
	)
}
