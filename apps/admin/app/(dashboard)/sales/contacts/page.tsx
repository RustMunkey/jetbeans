import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ContactsPage() {
	return (
		<div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Contacts</h2>
					<p className="text-sm text-muted-foreground">
						Manage leads, prospects, and customer relationships.
					</p>
				</div>
				<Button>Add Contact</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Contact List</CardTitle>
					<CardDescription>
						All your contacts in one place. Filter by status, tags, or assigned team member.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="text-muted-foreground">No contacts yet</p>
						<p className="text-sm text-muted-foreground/60 mt-1">
							Add your first contact to get started with CRM.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
