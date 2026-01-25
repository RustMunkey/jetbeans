"use client"

import { useBreadcrumbOverride } from "@/components/breadcrumb-context"

export default function TestPage() {
	useBreadcrumbOverride("developers", "Developers")
	useBreadcrumbOverride("test", "Test Page")

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Test Page</h2>
				<p className="text-sm text-muted-foreground">Test various UI components and behaviors.</p>
			</div>
		</div>
	)
}
