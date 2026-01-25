import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const defaultStages = [
	{ name: "Lead", color: "bg-slate-500", count: 0, value: 0 },
	{ name: "Qualified", color: "bg-blue-500", count: 0, value: 0 },
	{ name: "Proposal", color: "bg-yellow-500", count: 0, value: 0 },
	{ name: "Negotiation", color: "bg-orange-500", count: 0, value: 0 },
	{ name: "Won", color: "bg-green-500", count: 0, value: 0 },
]

export default function PipelinePage() {
	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Pipeline</h2>
					<p className="text-sm text-muted-foreground">
						Visual kanban board of your sales pipeline.
					</p>
				</div>
				<Button variant="outline">Configure Stages</Button>
			</div>

			<div className="grid gap-4 grid-cols-1 md:grid-cols-5">
				{defaultStages.map((stage) => (
					<Card key={stage.name} className="flex flex-col">
						<CardHeader className="pb-2">
							<div className="flex items-center gap-2">
								<div className={`size-3 rounded-full ${stage.color}`} />
								<CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
							</div>
							<CardDescription className="text-xs">
								{stage.count} deals · ${stage.value.toLocaleString()}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 min-h-[200px]">
							<div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed rounded-lg p-4">
								<p className="text-xs text-muted-foreground">
									Drag deals here
								</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
