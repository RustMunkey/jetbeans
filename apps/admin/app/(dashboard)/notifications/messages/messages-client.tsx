"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChatTab } from "./chat-tab"
import { InboxTab } from "./inbox-tab"
import type { TeamMessage, TeamMember, InboxEmail } from "./types"

const MESSAGES_TAB_KEY = "jetbeans_messages_tab"

function loadTab(): string {
	if (typeof window === "undefined") return "chat"
	try {
		return localStorage.getItem(MESSAGES_TAB_KEY) || "chat"
	} catch {
		return "chat"
	}
}

function saveTab(tab: string) {
	if (typeof window === "undefined") return
	try {
		localStorage.setItem(MESSAGES_TAB_KEY, tab)
	} catch {}
}

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
	const [activeTab, setActiveTab] = useState("chat")

	useEffect(() => {
		setActiveTab(loadTab())
	}, [])

	function handleTabChange(value: string) {
		setActiveTab(value)
		saveTab(value)
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold">Messages</h2>
				<p className="text-sm text-muted-foreground">
					Team chat and customer inbox.
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={handleTabChange}>
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
