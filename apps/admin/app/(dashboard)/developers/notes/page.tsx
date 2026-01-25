import { getDeveloperNotes, getTeamMembers } from "./actions"
import { NotesTable } from "./notes-table"

export default async function DeveloperNotesPage() {
	const [notes, teamMembers] = await Promise.all([
		getDeveloperNotes(),
		getTeamMembers(),
	])

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<NotesTable notes={notes} teamMembers={teamMembers} />
		</div>
	)
}
