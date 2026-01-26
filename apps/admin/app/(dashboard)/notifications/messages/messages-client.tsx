"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { ChatTab } from "./chat-tab"
import { InboxTab } from "./inbox-tab"
import { useChat } from "@/components/messages"
import { useSidebarMode } from "@/lib/sidebar-mode"
import type { TeamMessage, TeamMember, InboxEmail } from "./types"

const MESSAGES_TAB_KEY = "jetbeans_messages_tab"
const PREVIOUS_PATH_KEY = "jetbeans_messages_previous_path"

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
	const { setMode, setPreviousPath } = useSidebarMode()
	const { initialize } = useChat()
	const hasSetPrevPath = useRef(false)
	const pathname = usePathname()

	// Initialize chat context with data from server
	useEffect(() => {
		initialize({ messages, teamMembers, userId })
	}, [messages, teamMembers, userId, initialize])

	// Enter messages mode and set previous path (only once)
	useEffect(() => {
		// Set messages mode - will stay until user explicitly exits
		setMode("messages")

		// Set previous path for back navigation (only once)
		if (!hasSetPrevPath.current) {
			const storedPrevPath = sessionStorage.getItem(PREVIOUS_PATH_KEY)
			if (storedPrevPath && storedPrevPath !== pathname) {
				setPreviousPath(storedPrevPath)
				sessionStorage.removeItem(PREVIOUS_PATH_KEY)
			} else {
				setPreviousPath("/")
			}
			hasSetPrevPath.current = true
		}
		// Note: We intentionally do NOT reset mode on unmount
		// The user must click the exit button to leave messages mode
	}, [setMode, setPreviousPath, pathname])

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
			userId={userId}
			userName={userName}
			userImage={userImage}
			activeTab={activeTab}
			onTabChange={handleTabChange}
		/>
	)
}
