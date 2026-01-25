import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CallsPage() {
	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Calls</h2>
					<p className="text-sm text-muted-foreground">
						Business phone line and call history.
					</p>
				</div>
				<Button>New Call</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Today</CardDescription>
						<CardTitle className="text-2xl">0</CardTitle>
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
						<CardDescription>Missed</CardDescription>
						<CardTitle className="text-2xl text-destructive">0</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Avg Duration</CardDescription>
						<CardTitle className="text-2xl">--:--</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Call History</CardTitle>
						<CardDescription>
							Recent inbound and outbound calls.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="all">
							<TabsList>
								<TabsTrigger value="all">All</TabsTrigger>
								<TabsTrigger value="inbound">Inbound</TabsTrigger>
								<TabsTrigger value="outbound">Outbound</TabsTrigger>
								<TabsTrigger value="missed">Missed</TabsTrigger>
							</TabsList>
							<TabsContent value="all" className="mt-4">
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<p className="text-muted-foreground">No calls yet</p>
									<p className="text-sm text-muted-foreground/60 mt-1">
										Your call history will appear here.
									</p>
								</div>
							</TabsContent>
							<TabsContent value="inbound" className="mt-4">
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<p className="text-muted-foreground">No inbound calls</p>
								</div>
							</TabsContent>
							<TabsContent value="outbound" className="mt-4">
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<p className="text-muted-foreground">No outbound calls</p>
								</div>
							</TabsContent>
							<TabsContent value="missed" className="mt-4">
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<p className="text-muted-foreground">No missed calls</p>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Dialpad</CardTitle>
						<CardDescription>
							Make outbound calls to contacts.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
							<p className="text-muted-foreground text-sm">Dialpad coming soon</p>
							<p className="text-xs text-muted-foreground/60 mt-1">
								Connect Twilio to enable calling.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Phone Settings</CardTitle>
					<CardDescription>
						Your business phone number and voicemail settings.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-muted-foreground">No phone number configured</p>
						<p className="text-sm text-muted-foreground/60 mt-1">
							Set up a Canadian business number in Settings → Integrations.
						</p>
						<Button variant="outline" className="mt-4">Configure Phone</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
