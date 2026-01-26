"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export interface Column<T> {
	key: string
	header: string
	cell: (row: T) => React.ReactNode
	sortable?: boolean
	className?: string
}

interface DataTableProps<T> {
	columns: Column<T>[]
	data: T[]
	searchPlaceholder?: string
	searchKey?: string
	totalCount?: number
	pageSize?: number
	currentPage?: number
	onRowClick?: (row: T) => void
	selectable?: boolean
	selectedIds?: string[]
	onSelectionChange?: (ids: string[]) => void
	getId?: (row: T) => string
	bulkActions?: React.ReactNode
	filters?: React.ReactNode
	emptyMessage?: string
	emptyDescription?: string
}

export function DataTable<T>({
	columns,
	data,
	searchPlaceholder = "Search...",
	searchKey = "search",
	totalCount,
	pageSize = 30,
	currentPage = 1,
	onRowClick,
	selectable = false,
	selectedIds = [],
	onSelectionChange,
	getId,
	bulkActions,
	filters,
	emptyMessage = "No results found",
	emptyDescription,
}: DataTableProps<T>) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [search, setSearch] = React.useState("")

	const filteredData = React.useMemo(() => {
		if (!search.trim()) return data
		const term = search.toLowerCase()
		return data.filter((row) => {
			const values = Object.values(row as Record<string, unknown>)
			return values.some((val) => {
				if (val == null) return false
				return String(val).toLowerCase().includes(term)
			})
		})
	}, [data, search])

	const total = totalCount ?? data.length
	const totalPages = Math.ceil(total / pageSize)

	const updateParams = React.useCallback(
		(updates: Record<string, string | null>, scrollToTop = false) => {
			const params = new URLSearchParams(searchParams.toString())
			for (const [key, value] of Object.entries(updates)) {
				if (value === null || value === "") {
					params.delete(key)
				} else {
					params.set(key, value)
				}
			}
			router.push(`${pathname}?${params.toString()}`, { scroll: scrollToTop })
		},
		[router, pathname, searchParams]
	)

	const allSelected = filteredData.length > 0 && getId && selectedIds.length === filteredData.length
	const someSelected = selectedIds.length > 0 && !allSelected

	const toggleAll = () => {
		if (!getId || !onSelectionChange) return
		if (allSelected) {
			onSelectionChange([])
		} else {
			onSelectionChange(filteredData.map(getId))
		}
	}

	const toggleRow = (id: string) => {
		if (!onSelectionChange) return
		if (selectedIds.includes(id)) {
			onSelectionChange(selectedIds.filter((i) => i !== id))
		} else {
			onSelectionChange([...selectedIds, id])
		}
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-col sm:flex-row sm:items-center gap-3">
				<div className="sm:flex-1">
					<Input
						placeholder={searchPlaceholder}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-9"
					/>
				</div>
				<div className="hidden sm:flex items-center gap-2 shrink-0">
					{filters}
					{selectedIds.length > 0 && bulkActions && (
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">
								{selectedIds.length} selected
							</span>
							{bulkActions}
						</div>
					)}
				</div>
			</div>
			{(filters || (selectedIds.length > 0 && bulkActions)) && (
				<div className="flex flex-wrap items-center gap-2 w-full sm:hidden">
					{filters}
					{selectedIds.length > 0 && bulkActions && (
						<div className="flex items-center gap-2 w-full">
							<span className="text-sm text-muted-foreground whitespace-nowrap">
								{selectedIds.length} selected
							</span>
							<div className="flex gap-2 flex-1">
								{bulkActions}
							</div>
						</div>
					)}
				</div>
			)}

			<div className="rounded-lg border overflow-x-auto">
				<Table className="min-w-[600px]">
					<TableHeader>
						<TableRow>
							{selectable && (
								<TableHead className="w-10">
									<Checkbox
										checked={allSelected ? true : someSelected ? "indeterminate" : false}
										onCheckedChange={toggleAll}
									/>
								</TableHead>
							)}
							{columns.map((col) => (
								<TableHead key={col.key} className={col.className}>
									{col.header}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredData.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length + (selectable ? 1 : 0)}
									className="h-32 text-center"
								>
									<div className="space-y-1">
										<p className="text-sm text-muted-foreground">{emptyMessage}</p>
										{emptyDescription && (
											<p className="text-xs text-muted-foreground/60">{emptyDescription}</p>
										)}
									</div>
								</TableCell>
							</TableRow>
						) : (
							filteredData.map((row, i) => {
								const id = getId?.(row) ?? String(i)
								return (
									<TableRow
										key={id}
										className={cn(
											onRowClick && "cursor-pointer",
											selectedIds.includes(id) && "bg-muted/50"
										)}
										onClick={(e) => {
											const target = e.target as HTMLElement
											if (target.closest('[role="checkbox"]') || target.closest('[data-checkbox-cell]')) return
											onRowClick?.(row)
										}}
									>
										{selectable && (
											<TableCell data-checkbox-cell onClick={(e) => e.stopPropagation()}>
												<Checkbox
													checked={selectedIds.includes(id)}
													onCheckedChange={() => toggleRow(id)}
												/>
											</TableCell>
										)}
										{columns.map((col) => (
											<TableCell key={col.key} className={col.className}>
												{col.cell(row)}
											</TableCell>
										))}
									</TableRow>
								)
							})
						)}
					</TableBody>
				</Table>
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{total} total result{total !== 1 ? "s" : ""}
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage <= 1}
							onClick={() => updateParams({ page: String(currentPage - 1) }, true)}
						>
							Previous
						</Button>
						<span className="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage >= totalPages}
							onClick={() => updateParams({ page: String(currentPage + 1) }, true)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
