import Link from "next/link"
import { getProducts, getCategories } from "./actions"
import { ProductsTable } from "./products-table"
import { Button } from "@/components/ui/button"

interface PageProps {
	searchParams: Promise<{
		page?: string
		search?: string
		category?: string
		status?: string
	}>
}

export default async function ProductsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const page = Number(params.page) || 1
	const { items, totalCount } = await getProducts({
		page,
		pageSize: 20,
		search: params.search,
		category: params.category,
		status: params.status,
	})
	const allCategories = await getCategories()

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Products</h2>
					<p className="text-sm text-muted-foreground">
						Manage your product catalog.
					</p>
				</div>
				<Link href="/products/new" className="sm:hidden">
					<Button size="sm">Add Product</Button>
				</Link>
			</div>

			<ProductsTable
				products={items}
				categories={allCategories}
				totalCount={totalCount}
				currentPage={page}
				currentCategory={params.category}
				currentStatus={params.status}
			/>
		</div>
	)
}
