"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	Copy01Icon,
	RefreshIcon,
	Delete02Icon,
	Add01Icon,
	ViewIcon,
	ViewOffIcon,
	Tick01Icon,
	InformationCircleIcon,
	CodeIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import {
	createStorefront,
	updateStorefront,
	deleteStorefront,
	regenerateApiKey,
} from "@/app/(dashboard)/settings/storefronts/actions"
import { toast } from "sonner"

type Storefront = {
	id: string
	name: string
	domain: string | null
	customDomain: string | null
	apiKey: string
	permissions: {
		products: boolean
		orders: boolean
		customers: boolean
		checkout: boolean
		inventory: boolean
	} | null
	isActive: boolean | null
	createdAt: Date
	updatedAt: Date
}

function CopyButton({ text, label }: { text: string; label?: string }) {
	const [copied, setCopied] = React.useState(false)

	const copy = async () => {
		await navigator.clipboard.writeText(text)
		setCopied(true)
		toast.success("Copied to clipboard")
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy}>
			<HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={14} />
			{label && <span className="sr-only">{label}</span>}
		</Button>
	)
}

function ApiKeyDisplay({ apiKey, storefrontId }: { apiKey: string; storefrontId: string }) {
	const router = useRouter()
	const [visible, setVisible] = React.useState(false)
	const [regenerating, setRegenerating] = React.useState(false)

	const regenerate = async () => {
		setRegenerating(true)
		try {
			await regenerateApiKey(storefrontId)
			toast.success("API key regenerated")
			router.refresh()
		} catch (err) {
			toast.error("Failed to regenerate key")
		} finally {
			setRegenerating(false)
		}
	}

	const displayValue = visible ? apiKey : apiKey.slice(0, 12) + "•".repeat(20)

	return (
		<div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
			<code className="flex-1 text-sm font-mono truncate">{displayValue}</code>
			<Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setVisible(!visible)}>
				<HugeiconsIcon icon={visible ? ViewOffIcon : ViewIcon} size={14} />
			</Button>
			<CopyButton text={apiKey} label="Copy API key" />
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
						<HugeiconsIcon icon={RefreshIcon} size={14} />
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Regenerate API key?</AlertDialogTitle>
						<AlertDialogDescription>
							This will invalidate the current API key immediately. Any applications using
							this key will stop working until updated with the new key.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={regenerate} disabled={regenerating}>
							{regenerating ? "Regenerating..." : "Regenerate"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

function CreateApiKeyDialog({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const [open, setOpen] = React.useState(false)
	const [name, setName] = React.useState("")
	const [domain, setDomain] = React.useState("")
	const [permissions, setPermissions] = React.useState({
		products: true,
		orders: true,
		customers: true,
		checkout: true,
		inventory: false,
	})
	const [loading, setLoading] = React.useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) return

		setLoading(true)
		try {
			await createStorefront({
				name: name.trim(),
				domain: domain.trim() || undefined,
				permissions,
			})
			toast.success("API key created!")
			setOpen(false)
			setName("")
			setDomain("")
			setPermissions({
				products: true,
				orders: true,
				customers: true,
				checkout: true,
				inventory: false,
			})
			router.refresh()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to create API key")
		} finally {
			setLoading(false)
		}
	}

	const togglePermission = (key: keyof typeof permissions) => {
		setPermissions((p) => ({ ...p, [key]: !p[key] }))
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create API Key</DialogTitle>
						<DialogDescription>
							Create a new API key for your external application.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								placeholder="e.g., Gemsutopia Frontend"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">
								A descriptive name to identify this API key
							</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="domain">Domain (optional)</Label>
							<Input
								id="domain"
								placeholder="e.g., gemsutopia.com"
								value={domain}
								onChange={(e) => setDomain(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">
								The domain where this key will be used
							</p>
						</div>
						<div className="grid gap-2">
							<Label>Permissions</Label>
							<div className="space-y-2">
								{[
									{ key: "products" as const, label: "Products", desc: "Read products and categories" },
									{ key: "orders" as const, label: "Orders", desc: "Create and read orders" },
									{ key: "customers" as const, label: "Customers", desc: "Manage customer data" },
									{ key: "checkout" as const, label: "Checkout", desc: "Process checkouts" },
									{ key: "inventory" as const, label: "Inventory", desc: "Read stock levels" },
								].map(({ key, label, desc }) => (
									<div key={key} className="flex items-start space-x-2">
										<Checkbox
											id={key}
											checked={permissions[key]}
											onCheckedChange={() => togglePermission(key)}
										/>
										<div className="grid gap-0.5 leading-none">
											<label htmlFor={key} className="text-sm font-medium cursor-pointer">
												{label}
											</label>
											<p className="text-xs text-muted-foreground">{desc}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading || !name.trim()}>
							{loading ? "Creating..." : "Create API Key"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

function ApiKeyCard({ storefront }: { storefront: Storefront }) {
	const router = useRouter()
	const [deleting, setDeleting] = React.useState(false)

	const toggleActive = async () => {
		await updateStorefront(storefront.id, { isActive: !storefront.isActive })
		router.refresh()
	}

	const handleDelete = async () => {
		setDeleting(true)
		try {
			await deleteStorefront(storefront.id)
			toast.success("API key deleted")
			router.refresh()
		} finally {
			setDeleting(false)
		}
	}

	const permissions = storefront.permissions ?? {
		products: true,
		orders: true,
		customers: true,
		checkout: true,
		inventory: false,
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="text-base flex items-center gap-2">
							{storefront.name}
							{storefront.isActive ? (
								<Badge variant="default" className="font-normal">Active</Badge>
							) : (
								<Badge variant="secondary" className="font-normal">Disabled</Badge>
							)}
						</CardTitle>
						<CardDescription>
							{storefront.domain || storefront.customDomain || "No domain"}
						</CardDescription>
					</div>
					<Switch checked={storefront.isActive ?? true} onCheckedChange={toggleActive} />
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label className="text-xs text-muted-foreground mb-1.5 block">API Key</Label>
					<ApiKeyDisplay apiKey={storefront.apiKey} storefrontId={storefront.id} />
				</div>

				<div>
					<Label className="text-xs text-muted-foreground mb-1.5 block">Permissions</Label>
					<div className="flex flex-wrap gap-1">
						{Object.entries(permissions).map(([key, enabled]) =>
							enabled ? (
								<Badge key={key} variant="outline" className="capitalize">
									{key}
								</Badge>
							) : null
						)}
					</div>
				</div>

				<div className="flex justify-between items-center pt-2 border-t">
					<p className="text-xs text-muted-foreground">
						Created {new Date(storefront.createdAt).toLocaleDateString()}
					</p>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8">
								<HugeiconsIcon icon={Delete02Icon} size={14} className="mr-1" />
								Delete
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete API key?</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete &quot;{storefront.name}&quot; and revoke its API access.
									Any applications using this key will immediately stop working.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDelete}
									disabled={deleting}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									{deleting ? "Deleting..." : "Delete API Key"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</CardContent>
		</Card>
	)
}

const ENDPOINTS = [
	{
		method: "GET",
		path: "/api/storefront/products",
		description: "List all active products",
		example: `curl -H "X-Storefront-Key: YOUR_API_KEY" \\
  https://admin.jetbeans.app/api/storefront/products`,
	},
	{
		method: "GET",
		path: "/api/storefront/products/:slug",
		description: "Get a single product by slug",
		example: `curl -H "X-Storefront-Key: YOUR_API_KEY" \\
  https://admin.jetbeans.app/api/storefront/products/blue-sapphire`,
	},
	{
		method: "GET",
		path: "/api/storefront/categories",
		description: "List all categories",
		example: `curl -H "X-Storefront-Key: YOUR_API_KEY" \\
  https://admin.jetbeans.app/api/storefront/categories`,
	},
	{
		method: "GET",
		path: "/api/storefront/auctions",
		description: "List active auctions",
		example: `curl -H "X-Storefront-Key: YOUR_API_KEY" \\
  https://admin.jetbeans.app/api/storefront/auctions`,
	},
	{
		method: "GET",
		path: "/api/storefront/auctions/:id",
		description: "Get auction details and bid history",
		example: `curl -H "X-Storefront-Key: YOUR_API_KEY" \\
  https://admin.jetbeans.app/api/storefront/auctions/abc123?bids=true`,
	},
	{
		method: "POST",
		path: "/api/storefront/auctions/:id",
		description: "Place a bid on an auction",
		example: `curl -X POST -H "X-Storefront-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 150.00, "customerId": "user_123"}' \\
  https://admin.jetbeans.app/api/storefront/auctions/abc123`,
	},
	{
		method: "POST",
		path: "/api/storefront/checkout",
		description: "Create a checkout session",
		example: `curl -X POST -H "X-Storefront-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"items": [...], "customer": {...}}' \\
  https://admin.jetbeans.app/api/storefront/checkout`,
	},
]

export function ApiKeysClient({ storefronts }: { storefronts: Storefront[] }) {
	return (
		<Tabs defaultValue="keys" className="space-y-4">
			<TabsList>
				<TabsTrigger value="keys">API Keys</TabsTrigger>
				<TabsTrigger value="docs">Documentation</TabsTrigger>
			</TabsList>

			<TabsContent value="keys" className="space-y-4">
				<div className="flex justify-end">
					<CreateApiKeyDialog>
						<Button size="sm">
							<HugeiconsIcon icon={Add01Icon} size={14} className="mr-1" />
							Create API Key
						</Button>
					</CreateApiKeyDialog>
				</div>

				{storefronts.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12 text-center">
							<div className="rounded-full bg-muted p-3 mb-4">
								<HugeiconsIcon icon={CodeIcon} size={24} className="text-muted-foreground" />
							</div>
							<h3 className="font-medium mb-1">No API keys yet</h3>
							<p className="text-muted-foreground mb-4 max-w-sm">
								Create an API key to connect your external applications and storefronts.
							</p>
							<CreateApiKeyDialog>
								<Button>
									<HugeiconsIcon icon={Add01Icon} size={14} className="mr-1" />
									Create Your First API Key
								</Button>
							</CreateApiKeyDialog>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{storefronts.map((storefront) => (
							<ApiKeyCard key={storefront.id} storefront={storefront} />
						))}
					</div>
				)}
			</TabsContent>

			<TabsContent value="docs" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<HugeiconsIcon icon={InformationCircleIcon} size={18} />
							Authentication
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							All API requests must include your API key in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">X-Storefront-Key</code> header.
						</p>
						<div className="bg-muted rounded-lg p-4">
							<pre className="text-sm overflow-x-auto">
{`fetch('https://admin.jetbeans.app/api/storefront/products', {
  headers: {
    'X-Storefront-Key': 'YOUR_API_KEY'
  }
})`}
							</pre>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Available Endpoints</CardTitle>
						<CardDescription>
							All endpoints return JSON and support standard pagination.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Accordion type="single" collapsible className="w-full">
							{ENDPOINTS.map((endpoint, i) => (
								<AccordionItem key={i} value={`endpoint-${i}`}>
									<AccordionTrigger className="hover:no-underline">
										<div className="flex items-center gap-3 text-left">
											<Badge
												variant={endpoint.method === "GET" ? "secondary" : "default"}
												className="font-mono text-xs"
											>
												{endpoint.method}
											</Badge>
											<code className="text-sm">{endpoint.path}</code>
										</div>
									</AccordionTrigger>
									<AccordionContent className="space-y-3">
										<p className="text-sm text-muted-foreground">
											{endpoint.description}
										</p>
										<div className="bg-muted rounded-lg p-3 relative group">
											<pre className="text-xs overflow-x-auto">{endpoint.example}</pre>
											<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
												<CopyButton text={endpoint.example} />
											</div>
										</div>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</CardContent>
				</Card>

				<Card className="bg-primary/5 border-primary/20">
					<CardHeader>
						<CardTitle className="text-base">Need help?</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						<p>
							Check out our full API documentation or reach out to support if you need assistance
							integrating with the Storefront API.
						</p>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	)
}
