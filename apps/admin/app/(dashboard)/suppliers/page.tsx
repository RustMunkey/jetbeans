import { getSuppliers } from "./actions"
import { SuppliersTable } from "./suppliers-table"

export default async function SuppliersPage() {
	const suppliers = await getSuppliers()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<SuppliersTable suppliers={suppliers} />
		</div>
	)
}
