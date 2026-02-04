import { Suspense } from "react"
import Link from "next/link"
import { getProducts, getCategories } from "./actions"
import { ProductsTable } from "./products-table"
import { Button } from "@/components/ui/button"
import { productsParamsCache } from "@/lib/search-params"

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductsPage({ searchParams }: PageProps) {
	const { page, search, category, status } = await productsParamsCache.parse(searchParams)
	const { items, totalCount } = await getProducts({
		page,
		pageSize: 30,
		search: search || undefined,
		category: category === "all" ? undefined : category,
		status: status === "all" ? undefined : status,
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

			<Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
				<ProductsTable
					products={items}
					categories={allCategories}
					totalCount={totalCount}
				/>
			</Suspense>
		</div>
	)
}
