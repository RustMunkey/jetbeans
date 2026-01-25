"use client"

import { useState, useEffect } from "react"
import { ChatTab } from "./chat-tab"
import { InboxTab } from "./inbox-tab"
import type { TeamMessage, TeamMember, InboxEmail } from "./types"

const MESSAGES_TAB_KEY = "jetbeans_messages_tab"

function loadTab(): "chat" | "inbox" {
	if (typeof window === "undefined") return "chat"
	try {
		const stored = localStorage.getItem(MESSAGES_TAB_KEY)
		return stored === "inbox" ? "inbox" : "chat"
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
	const [activeTab, setActiveTab] = useState<"chat" | "inbox">("chat")

	useEffect(() => {
		setActiveTab(loadTab())
	}, [])

	function handleTabChange(value: "chat" | "inbox") {
		setActiveTab(value)
		saveTab(value)
	}

	if (activeTab === "inbox") {
		return (
			<InboxTab
				emails={inboxEmails}
				activeTab={activeTab}
				onTabChange={handleTabChange}
			/>
		)
	}

	return (
		<ChatTab
			messages={messages}
			userId={userId}
			userName={userName}
			userImage={userImage}
			teamMembers={teamMembers}
			activeTab={activeTab}
			onTabChange={handleTabChange}
		/>
	)
}
