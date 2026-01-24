import { getSitePages } from "../actions"
import { PagesTable } from "./pages-table"

export default async function SitePagesPage() {
	const pages = await getSitePages()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<PagesTable pages={pages} />
		</div>
	)
}
