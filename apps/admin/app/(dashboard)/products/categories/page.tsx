import { getAllCategories } from "./actions"
import { CategoriesClient } from "./categories-client"

export default async function CategoriesPage() {
	const categories = await getAllCategories()

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<CategoriesClient categories={categories} />
		</div>
	)
}
