import { getFaqItems } from "../actions"
import { FaqTable } from "./faq-table"

export default async function FaqPage() {
	const items = await getFaqItems()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<p className="text-sm text-muted-foreground">Manage FAQ items displayed on your storefront.</p>
			<FaqTable items={items} />
		</div>
	)
}
