import { Suspense } from "react"
import { getWorkflows } from "./actions"
import { WorkflowsTable } from "./workflows-table"

export default async function AutomationPage() {
	const { items, totalCount } = await getWorkflows()

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
			<div>
				<h2 className="text-lg font-semibold">Workflows</h2>
				<p className="text-sm text-muted-foreground">
					Create automated workflows to streamline your business processes.
				</p>
			</div>

			<Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
				<WorkflowsTable workflows={items} totalCount={totalCount} />
			</Suspense>
		</div>
	)
}
