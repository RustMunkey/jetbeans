"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChatTab } from "./chat-tab"
import { InboxTab } from "./inbox-tab"
import type { TeamMessage, TeamMember, InboxEmail } from "./types"

export function MessagesClient({
	messages,
	userId,
	userName,
	userImage,
	teamMembers,
	inboxEmails,
}: {
	messages: TeamMessage[]
	userId: string
	userName: string
	userImage: string | null
	teamMembers: TeamMember[]
	inboxEmails: InboxEmail[]
}) {
	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold">Messages</h2>
				<p className="text-sm text-muted-foreground">
					Team chat and customer inbox.
				</p>
			</div>

			<Tabs defaultValue="chat">
				<TabsList>
					<TabsTrigger value="chat">Chat</TabsTrigger>
					<TabsTrigger value="inbox">Inbox</TabsTrigger>
				</TabsList>
				<TabsContent value="chat" className="mt-4">
					<ChatTab
						messages={messages}
						userId={userId}
						userName={userName}
						userImage={userImage}
						teamMembers={teamMembers}
					/>
				</TabsContent>
				<TabsContent value="inbox" className="mt-4">
					<InboxTab emails={inboxEmails} />
				</TabsContent>
			</Tabs>
		</div>
	)
}
