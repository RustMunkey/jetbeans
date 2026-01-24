import { db } from "@jetbeans/db/client"
import { productVariants, products, inventory } from "@jetbeans/db/schema"
import { eq, desc } from "@jetbeans/db/drizzle"
import { VariantsTable } from "./variants-table"

export default async function VariantsPage() {
	const variants = await db
		.select({
			id: productVariants.id,
			name: productVariants.name,
			sku: productVariants.sku,
			price: productVariants.price,
			productId: productVariants.productId,
			productName: products.name,
			quantity: inventory.quantity,
			lowStockThreshold: inventory.lowStockThreshold,
		})
		.from(productVariants)
		.leftJoin(products, eq(products.id, productVariants.productId))
		.leftJoin(inventory, eq(inventory.variantId, productVariants.id))
		.orderBy(desc(productVariants.createdAt))
		.limit(100)

	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Variants</h2>
				<p className="text-sm text-muted-foreground">
					All product variants with inventory levels.
				</p>
			</div>

			<VariantsTable variants={variants} />
		</div>
	)
}
