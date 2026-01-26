"use client"

import { useRouter } from "next/navigation"
import { DataTable, type Column } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { deleteSitePage } from "../actions"

type SitePage = {
	id: string
	title: string
	slug: string
	status: string
	updatedAt: Date
}

interface PagesTableProps {
	pages: SitePage[]
	totalCount: number
	currentPage: number
}

export function PagesTable({ pages, totalCount, currentPage }: PagesTableProps) {
	const router = useRouter()

	const columns: Column<SitePage>[] = [
		{
			key: "title",
			header: "Title",
			cell: (row) => <span className="font-medium">{row.title}</span>,
		},
		{
			key: "slug",
			header: "Slug",
			cell: (row) => <span className="text-muted-foreground">/{row.slug}</span>,
		},
		{
			key: "status",
			header: "Status",
			cell: (row) => <StatusBadge status={row.status} type="content" />,
		},
		{
			key: "updatedAt",
			header: "Last Updated",
			cell: (row) => new Date(row.updatedAt).toLocaleDateString(),
		},
	]

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Pages</h2>
					<p className="text-muted-foreground text-sm">Manage static pages like About, Contact, FAQ.</p>
				</div>
				<Button onClick={() => router.push("/content/pages/new")}>New Page</Button>
			</div>
			<DataTable
				data={pages}
				columns={columns}
				searchKey="title"
				searchPlaceholder="Search pages..."
				onRowClick={(row) => router.push(`/content/pages/${row.id}`)}
				totalCount={totalCount}
				currentPage={currentPage}
			/>
		</div>
	)
}
