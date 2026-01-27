import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getTeamMessages, getTeamMembers, getInboxEmails } from "./actions"
import { MessagesClient } from "./messages-client"

// Disable caching for this page - always fetch fresh messages
export const dynamic = "force-dynamic"

export default async function MessagesPage() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) redirect("/login")

	const [messages, teamMembers, inboxEmails] = await Promise.all([
		getTeamMessages(session.user.id),
		getTeamMembers(),
		getInboxEmails(),
	])

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<MessagesClient
				messages={messages.map((m) => ({
					...m,
					senderName: m.senderName || "Unknown",
					attachments: m.attachments || undefined,
					createdAt: m.createdAt.toISOString(),
					readAt: m.readAt?.toISOString() || null,
				}))}
				userId={session.user.id}
				userName={session.user.name || "Unknown"}
				userImage={session.user.image ?? null}
				teamMembers={teamMembers.map((m) => ({
					...m,
					name: m.name || "Unknown",
				}))}
				inboxEmails={inboxEmails}
			/>
		</div>
	)
}
