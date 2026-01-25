import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TasksPage() {
	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Tasks</h2>
					<p className="text-sm text-muted-foreground">
						Follow-ups, reminders, and to-dos for your team.
					</p>
				</div>
				<Button>Add Task</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Due Today</CardDescription>
						<CardTitle className="text-2xl">0</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Overdue</CardDescription>
						<CardTitle className="text-2xl text-destructive">0</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>This Week</CardDescription>
						<CardTitle className="text-2xl">0</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Completed</CardDescription>
						<CardTitle className="text-2xl">0</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Task List</CardTitle>
					<CardDescription>
						Manage follow-ups and action items.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="pending">
						<TabsList>
							<TabsTrigger value="pending">Pending</TabsTrigger>
							<TabsTrigger value="completed">Completed</TabsTrigger>
							<TabsTrigger value="all">All</TabsTrigger>
						</TabsList>
						<TabsContent value="pending" className="mt-4">
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<p className="text-muted-foreground">No pending tasks</p>
								<p className="text-sm text-muted-foreground/60 mt-1">
									Create tasks to track follow-ups with contacts and deals.
								</p>
							</div>
						</TabsContent>
						<TabsContent value="completed" className="mt-4">
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<p className="text-muted-foreground">No completed tasks</p>
							</div>
						</TabsContent>
						<TabsContent value="all" className="mt-4">
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<p className="text-muted-foreground">No tasks yet</p>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}
