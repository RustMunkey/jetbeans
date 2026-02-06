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
			cell: (row) => new Date(row.updatedAt).toLocaleDateString("en-US"),
		},
	]

	return (
		<DataTable
			data={pages}
			columns={columns}
			searchKey="title"
			searchPlaceholder="Search pages..."
			onRowClick={(row) => router.push(`/content/pages/${row.id}`)}
			totalCount={totalCount}
			currentPage={currentPage}
			filters={
				<Button size="sm" className="h-9 hidden sm:flex" onClick={() => router.push("/content/pages/new")}>New Page</Button>
			}
		/>
	)
}
