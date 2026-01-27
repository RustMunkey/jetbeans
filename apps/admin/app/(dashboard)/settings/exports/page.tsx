"use client"

import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Printer01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
	exportOrders,
	exportCustomers,
	exportProducts,
	exportSubscriptions,
	exportFinancialSummary,
	getAvailableYears,
} from "./actions"

type ExportFormat = "csv" | "xlsx"

function downloadFile(data: string, filename: string, mimeType: string, isBase64 = false) {
	const blob = isBase64
		? new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], { type: mimeType })
		: new Blob([data], { type: mimeType })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

export default function ExportsPage() {
	const [format, setFormat] = useState<ExportFormat>("xlsx")
	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
	const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()])
	const [loading, setLoading] = useState<string | null>(null)

	useEffect(() => {
		getAvailableYears().then(setAvailableYears).catch(console.error)
	}, [])

	async function handleExport(
		exportFn: () => Promise<{ data: string; filename: string; mimeType: string }>,
		name: string
	) {
		setLoading(name)
		try {
			const result = await exportFn()
			const isBase64 = result.mimeType.includes("spreadsheet")
			downloadFile(result.data, result.filename, result.mimeType, isBase64)
			toast.success(`${name} exported`)
		} catch (err) {
			console.error(err)
			toast.error(`Failed to export ${name.toLowerCase()}`)
		} finally {
			setLoading(null)
		}
	}

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Data Exports</h1>
					<p className="text-sm text-muted-foreground">
						Download your business data for accounting, tax filing, or backup purposes.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => window.print()}
					className="print:hidden"
				>
					<HugeiconsIcon icon={Printer01Icon} size={16} className="mr-2" />
					Print
				</Button>
			</div>

			<div className="flex items-center gap-4 print:hidden">
				<div className="flex items-center gap-2">
					<Label htmlFor="format">Format</Label>
					<Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
						<SelectTrigger id="format" className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
							<SelectItem value="csv">CSV (.csv)</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<p className="text-xs text-muted-foreground">
					Excel files work with Microsoft Excel, Apple Numbers, and Google Sheets
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Orders</CardTitle>
						<CardDescription>
							All orders with revenue, tax, shipping, and status information
						</CardDescription>
					</CardHeader>
					<CardContent className="print:hidden">
						<Button
							onClick={() => handleExport(() => exportOrders(format), "Orders")}
							disabled={loading !== null}
							className="w-full"
						>
							{loading === "Orders" ? "Exporting..." : "Export Orders"}
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Customers</CardTitle>
						<CardDescription>
							Customer list with contact info and purchase history
						</CardDescription>
					</CardHeader>
					<CardContent className="print:hidden">
						<Button
							onClick={() => handleExport(() => exportCustomers(format), "Customers")}
							disabled={loading !== null}
							className="w-full"
						>
							{loading === "Customers" ? "Exporting..." : "Export Customers"}
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Products</CardTitle>
						<CardDescription>
							Product catalog with pricing, inventory, and cost data
						</CardDescription>
					</CardHeader>
					<CardContent className="print:hidden">
						<Button
							onClick={() => handleExport(() => exportProducts(format), "Products")}
							disabled={loading !== null}
							className="w-full"
						>
							{loading === "Products" ? "Exporting..." : "Export Products"}
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Subscriptions</CardTitle>
						<CardDescription>
							Active and canceled subscriptions with billing details
						</CardDescription>
					</CardHeader>
					<CardContent className="print:hidden">
						<Button
							onClick={() => handleExport(() => exportSubscriptions(format), "Subscriptions")}
							disabled={loading !== null}
							className="w-full"
						>
							{loading === "Subscriptions" ? "Exporting..." : "Export Subscriptions"}
						</Button>
					</CardContent>
				</Card>
			</div>

			<Separator />

			<div>
				<h2 className="text-lg font-semibold mb-4">Financial Reports</h2>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Annual Financial Summary</CardTitle>
						<CardDescription>
							Monthly breakdown of revenue, tax collected, shipping, and discounts for tax filing
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
						<div className="flex items-center gap-2">
							<Label htmlFor="year">Year</Label>
							<Select
								value={String(selectedYear)}
								onValueChange={(v) => setSelectedYear(Number(v))}
							>
								<SelectTrigger id="year" className="w-24">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{availableYears.map((year) => (
										<SelectItem key={year} value={String(year)}>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							onClick={() =>
								handleExport(
									() => exportFinancialSummary(format, selectedYear),
									"Financial Summary"
								)
							}
							disabled={loading !== null}
						>
							{loading === "Financial Summary" ? "Exporting..." : "Export Financial Summary"}
						</Button>
					</CardContent>
				</Card>
			</div>

			<div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
				<p className="font-medium text-foreground mb-1">About your data</p>
				<ul className="list-disc list-inside space-y-1">
					<li>Business-critical data (orders, customers, products) is stored permanently</li>
					<li>Exports include all historical data unless filtered by date</li>
					<li>For tax purposes, keep annual financial summaries with your records</li>
					<li>CSV files are universal; XLSX works with Excel, Numbers, and Google Sheets</li>
				</ul>
			</div>
		</div>
	)
}
