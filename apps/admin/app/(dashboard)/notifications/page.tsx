import { getEmailTemplates, getMessages } from "./actions"
import { TemplatesTable } from "./templates-table"
import { NotificationsClient } from "./notifications-client"

interface PageProps {
	searchParams: Promise<{
		page?: string
		messagesPage?: string
	}>
}

export default async function NotificationsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const templatesPage = Number(params.page) || 1
	const messagesPage = Number(params.messagesPage) || 1

	const [templatesData, messagesData] = await Promise.all([
		getEmailTemplates({ page: templatesPage, pageSize: 30 }),
		getMessages({ page: messagesPage, pageSize: 30 }),
	])

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<NotificationsClient
				templates={templatesData.items}
				templatesTotalCount={templatesData.totalCount}
				templatesCurrentPage={templatesPage}
				messages={messagesData.items}
				messagesTotalCount={messagesData.totalCount}
				messagesCurrentPage={messagesPage}
			/>
		</div>
	)
}
