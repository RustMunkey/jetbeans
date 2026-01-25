import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CompaniesPage() {
	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Companies</h2>
					<p className="text-sm text-muted-foreground">
						Track organizations and B2B accounts.
					</p>
				</div>
				<Button>Add Company</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Company Directory</CardTitle>
					<CardDescription>
						View all companies, their contacts, and deal history.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="text-muted-foreground">No companies yet</p>
						<p className="text-sm text-muted-foreground/60 mt-1">
							Add companies to organize your B2B relationships.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
