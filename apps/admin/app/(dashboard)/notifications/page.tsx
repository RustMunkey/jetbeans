import { getEmailTemplates, getMessages } from "./actions"
import { TemplatesTable } from "./templates-table"
import { NotificationsClient } from "./notifications-client"

export default async function NotificationsPage() {
	const [templates, messages] = await Promise.all([
		getEmailTemplates(),
		getMessages(),
	])

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<NotificationsClient templates={templates} messages={messages} />
		</div>
	)
}
