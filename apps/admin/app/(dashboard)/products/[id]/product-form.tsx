"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { slugify } from "@/lib/format"
import { useBreadcrumbOverride } from "@/components/breadcrumb-context"
import { MediaUploader, type MediaItem } from "@/components/media-uploader"
import { createProduct, updateProduct, createVariant, deleteVariant } from "../actions"

interface Variant {
	id: string
	name: string
	sku: string
	price: string | null
	attributes: Record<string, string> | null
	isActive: boolean | null
	quantity: number | null
	reservedQuantity: number | null
	lowStockThreshold: number | null
}

interface Category {
	id: string
	name: string
	slug: string
}

interface ProductFormProps {
	product?: {
		id: string
		name: string
		slug: string
		description: string | null
		shortDescription: string | null
		price: string
		compareAtPrice: string | null
		costPrice: string | null
		sourceType: string
		categoryId: string | null
		tags: string[] | null
		images: string[] | null
		thumbnail: string | null
		isActive: boolean | null
		isSubscribable: boolean | null
		isFeatured: boolean | null
		weight: string | null
		weightUnit: string | null
		metaTitle: string | null
		metaDescription: string | null
		variants: Variant[]
	}
	categories: Category[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
	const router = useRouter()
	const isNew = !product
	useBreadcrumbOverride(product?.id ?? "new", product?.name ?? "New Product")

	const [loading, setLoading] = useState(false)
	const [name, setName] = useState(product?.name ?? "")
	const [slug, setSlug] = useState(product?.slug ?? "")
	const [description, setDescription] = useState(product?.description ?? "")
	const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "")
	const [price, setPrice] = useState(product?.price ?? "")
	const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice ?? "")
	const [costPrice, setCostPrice] = useState(product?.costPrice ?? "")
	const [categoryId, setCategoryId] = useState(product?.categoryId ?? "")
	const [sourceType, setSourceType] = useState(product?.sourceType ?? "owned")
	const [tags, setTags] = useState((product?.tags ?? []).join(", "))
	const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
		const items: MediaItem[] = []
		if (product?.thumbnail) {
			items.push({ id: crypto.randomUUID(), url: product.thumbnail, type: "image" })
		}
		for (const url of product?.images ?? []) {
			if (url !== product?.thumbnail) {
				items.push({ id: crypto.randomUUID(), url, type: /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image" })
			}
		}
		return items
	})
	const [isActive, setIsActive] = useState(product?.isActive ?? true)
	const [isSubscribable, setIsSubscribable] = useState(product?.isSubscribable ?? false)
	const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false)
	const [weight, setWeight] = useState(product?.weight ?? "")
	const [weightUnit, setWeightUnit] = useState(product?.weightUnit ?? "oz")
	const [metaTitle, setMetaTitle] = useState(product?.metaTitle ?? "")
	const [metaDescription, setMetaDescription] = useState(product?.metaDescription ?? "")

	// Variants state
	const [variants, setVariants] = useState<Variant[]>(product?.variants ?? [])
	const [newVariant, setNewVariant] = useState({ name: "", sku: "", price: "", quantity: "0" })

	const handleNameChange = (value: string) => {
		setName(value)
		if (isNew || slug === slugify(product?.name ?? "")) {
			setSlug(slugify(value))
		}
	}

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("Product name is required")
			return
		}
		if (!price.trim()) {
			toast.error("Price is required")
			return
		}

		setLoading(true)
		try {
			const data = {
				name: name.trim(),
				slug: slug.trim() || slugify(name),
				description: description.trim(),
				shortDescription: shortDescription.trim(),
				price,
				compareAtPrice: compareAtPrice || undefined,
				costPrice: costPrice || undefined,
				sourceType,
				categoryId: categoryId || undefined,
				tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
				images: mediaItems.map((i) => i.url),
				thumbnail: mediaItems.find((i) => i.type === "image")?.url || undefined,
				isActive,
				isSubscribable,
				isFeatured,
				weight: weight || undefined,
				weightUnit,
				metaTitle: metaTitle.trim() || undefined,
				metaDescription: metaDescription.trim() || undefined,
			}

			if (isNew) {
				await createProduct(data)
				toast.success("Product created")
			} else {
				await updateProduct(product.id, data)
				toast.success("Product updated")
			}
			router.push("/products")
			router.refresh()
		} catch (e: any) {
			toast.error(e.message)
		} finally {
			setLoading(false)
		}
	}

	const handleAddVariant = async () => {
		if (!product) return
		if (!newVariant.name.trim() || !newVariant.sku.trim()) {
			toast.error("Variant name and SKU are required")
			return
		}
		try {
			const variant = await createVariant(product.id, {
				name: newVariant.name,
				sku: newVariant.sku,
				price: newVariant.price || undefined,
				quantity: parseInt(newVariant.quantity) || 0,
			})
			setVariants([...variants, { ...variant, quantity: parseInt(newVariant.quantity) || 0, reservedQuantity: 0, lowStockThreshold: 10 }])
			setNewVariant({ name: "", sku: "", price: "", quantity: "0" })
			toast.success("Variant added")
		} catch (e: any) {
			toast.error(e.message)
		}
	}

	const handleDeleteVariant = async (id: string) => {
		try {
			await deleteVariant(id)
			setVariants(variants.filter((v) => v.id !== id))
			toast.success("Variant removed")
		} catch (e: any) {
			toast.error(e.message)
		}
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3 min-w-0">
					<h2 className="text-lg font-semibold truncate">
						{isNew ? "New Product" : name || "Untitled"}
					</h2>
					{!isNew && (
						<StatusBadge status={isActive ? "active" : "inactive"} type="product" />
					)}
				</div>
				<div className="flex flex-row-reverse sm:flex-row items-center gap-2 w-full rounded-lg border p-3 sm:w-auto sm:border-0 sm:p-0">
					<Button onClick={handleSave} disabled={loading} size="sm" className="flex-1 sm:flex-initial">
						{loading ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
					</Button>
					<Button variant="outline" size="sm" onClick={() => router.push("/products")} className="flex-1 sm:flex-initial">
						Cancel
					</Button>
				</div>
			</div>

			{/* Two-column layout */}
			<div className="grid gap-4 md:grid-cols-3">
				{/* Main column */}
				<div className="md:col-span-2 space-y-4">
					{/* Basic Info Card */}
					<div className="rounded-lg border p-4 space-y-4">
						<h3 className="text-sm font-medium">Basic Information</h3>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="slug">Slug</Label>
								<Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="shortDescription">Short Description</Label>
							<Input id="shortDescription" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<textarea
								id="description"
								className="flex min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>
					</div>

					{/* Media Card */}
					<div className="rounded-lg border p-4 space-y-3">
						<h3 className="text-sm font-medium">Media</h3>
						<MediaUploader items={mediaItems} onChange={setMediaItems} />
					</div>

					{/* Pricing Card */}
					<div className="rounded-lg border p-4 space-y-4">
						<h3 className="text-sm font-medium">Pricing & Shipping</h3>
						<div className="grid gap-4 sm:grid-cols-3">
							<div className="space-y-2">
								<Label htmlFor="price">Price ($)</Label>
								<Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="compareAtPrice">Compare at ($)</Label>
								<Input id="compareAtPrice" type="number" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="costPrice">Cost ($)</Label>
								<Input id="costPrice" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
							</div>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="weight">Weight</Label>
								<Input id="weight" type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="weightUnit">Unit</Label>
								<Select value={weightUnit} onValueChange={setWeightUnit}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="oz">oz</SelectItem>
										<SelectItem value="lb">lb</SelectItem>
										<SelectItem value="g">g</SelectItem>
										<SelectItem value="kg">kg</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Variants Card */}
					{!isNew && (
						<div className="rounded-lg border p-4 space-y-4">
							<h3 className="text-sm font-medium">Variants</h3>
							{variants.length > 0 && (
								<div className="rounded-md border divide-y">
									{variants.map((v) => (
										<div key={v.id} className="flex items-center justify-between px-3 py-2">
											<div className="space-y-0.5">
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium">{v.name}</span>
													<span className="text-xs text-muted-foreground">SKU: {v.sku}</span>
												</div>
												<div className="flex items-center gap-3 text-xs text-muted-foreground">
													{v.price && <span>${v.price}</span>}
													<span>Stock: {v.quantity ?? 0}</span>
												</div>
											</div>
											<Button
												variant="ghost"
												size="sm"
												className="text-destructive"
												onClick={() => handleDeleteVariant(v.id)}
											>
												Remove
											</Button>
										</div>
									))}
								</div>
							)}
							<div className="grid gap-3 sm:grid-cols-4">
								<Input
									placeholder="Name"
									value={newVariant.name}
									onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
								/>
								<Input
									placeholder="SKU"
									value={newVariant.sku}
									onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
								/>
								<Input
									placeholder="Price"
									type="number"
									step="0.01"
									value={newVariant.price}
									onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
								/>
								<Input
									placeholder="Qty"
									type="number"
									value={newVariant.quantity}
									onChange={(e) => setNewVariant({ ...newVariant, quantity: e.target.value })}
								/>
							</div>
							<Button size="sm" onClick={handleAddVariant}>Add Variant</Button>
						</div>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-4">
					{/* Status Card */}
					<div className="rounded-lg border p-4 space-y-4">
						<h3 className="text-sm font-medium">Status</h3>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label htmlFor="isActive" className="text-sm">Active</Label>
								<Switch checked={isActive} onCheckedChange={setIsActive} id="isActive" />
							</div>
							<div className="flex items-center justify-between">
								<Label htmlFor="isSubscribable" className="text-sm">Subscribable</Label>
								<Switch checked={isSubscribable} onCheckedChange={setIsSubscribable} id="isSubscribable" />
							</div>
							<div className="flex items-center justify-between">
								<Label htmlFor="isFeatured" className="text-sm">Featured</Label>
								<Switch checked={isFeatured} onCheckedChange={setIsFeatured} id="isFeatured" />
							</div>
						</div>
					</div>

					{/* Organization Card */}
					<div className="rounded-lg border p-4 space-y-4">
						<h3 className="text-sm font-medium">Organization</h3>
						<div className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="category">Category</Label>
								<Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? "" : val)}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="No category" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">No category</SelectItem>
										{categories.map((cat) => (
											<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="sourceType">Source Type</Label>
								<Select value={sourceType} onValueChange={setSourceType}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="owned">Owned</SelectItem>
										<SelectItem value="dropship">Dropship</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="tags">Tags</Label>
								<Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma separated" />
							</div>
						</div>
					</div>

					{/* SEO Card */}
					<div className="rounded-lg border p-4 space-y-4">
						<h3 className="text-sm font-medium">SEO</h3>
						<div className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="metaTitle">Meta Title</Label>
								<Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="metaDescription">Meta Description</Label>
								<textarea
									id="metaDescription"
									className="flex min-h-[60px] w-full rounded-md border bg-background px-3 py-2 text-sm"
									value={metaDescription}
									onChange={(e) => setMetaDescription(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom actions (mobile only) */}
			<div className="flex flex-row-reverse items-center gap-2 w-full rounded-lg border p-3 sm:hidden">
				<Button onClick={handleSave} disabled={loading} size="sm" className="flex-1">
					{loading ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
				</Button>
				<Button variant="outline" size="sm" onClick={() => router.push("/products")} className="flex-1">
					Cancel
				</Button>
			</div>
		</div>
	)
}
