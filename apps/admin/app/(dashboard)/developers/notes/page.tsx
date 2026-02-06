import { getDeveloperNotes, getAllUsers } from "./actions"
import { NotesTable } from "./notes-table"

export default async function DeveloperNotesPage() {
	const [notes, allUsers] = await Promise.all([
		getDeveloperNotes(),
		getAllUsers(),
	])

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<NotesTable notes={notes} users={allUsers} />
		</div>
	)
}
