import { getGiftCards } from "./actions"
import { GiftCardsClient } from "./gift-cards-client"

export default async function GiftCardsPage() {
	const cards = await getGiftCards()

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<GiftCardsClient cards={cards} />
		</div>
	)
}
