"use client"

import * as React from "react"
import type { TeamMessage, TeamMember, Conversation } from "@/app/(dashboard)/notifications/messages/types"

const CHAT_STATE_KEY = "jetbeans_chat_state"

function loadChatState(): Conversation | null {
	if (typeof window === "undefined") return null
	try {
		const stored = localStorage.getItem(CHAT_STATE_KEY)
		return stored ? JSON.parse(stored) : null
	} catch {
		return null
	}
}

function saveChatState(conversation: Conversation) {
	if (typeof window === "undefined") return
	try {
		localStorage.setItem(CHAT_STATE_KEY, JSON.stringify(conversation))
	} catch {}
}

type ChatContextType = {
	active: Conversation
	setActive: (c: Conversation) => void
	messages: TeamMessage[]
	setMessages: React.Dispatch<React.SetStateAction<TeamMessage[]>>
	teamMembers: TeamMember[]
	setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>
	userId: string
	setUserId: React.Dispatch<React.SetStateAction<string>>
	hydrated: boolean
	isInitialized: boolean
	initialize: (data: { messages: TeamMessage[]; teamMembers: TeamMember[]; userId: string }) => void
}

const ChatContext = React.createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
	const [messages, setMessages] = React.useState<TeamMessage[]>([])
	const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([])
	const [userId, setUserId] = React.useState<string>("")
	const [active, setActiveState] = React.useState<Conversation>({ type: "channel", id: "general", label: "#general" })
	const [hydrated, setHydrated] = React.useState(false)
	const [isInitialized, setIsInitialized] = React.useState(false)

	// Load saved chat state after hydration
	React.useEffect(() => {
		const saved = loadChatState()
		if (saved) setActiveState(saved)
		setHydrated(true)
	}, [])

	const setActive = React.useCallback((c: Conversation) => {
		setActiveState(c)
		saveChatState(c)
	}, [])

	const initialize = React.useCallback((data: { messages: TeamMessage[]; teamMembers: TeamMember[]; userId: string }) => {
		setMessages(data.messages)
		setTeamMembers(data.teamMembers)
		setUserId(data.userId)
		setIsInitialized(true)
	}, [])

	return (
		<ChatContext.Provider
			value={{
				active,
				setActive,
				messages,
				setMessages,
				teamMembers,
				setTeamMembers,
				userId,
				setUserId,
				hydrated,
				isInitialized,
				initialize,
			}}
		>
			{children}
		</ChatContext.Provider>
	)
}

export function useChat() {
	const context = React.useContext(ChatContext)
	if (!context) {
		throw new Error("useChat must be used within a ChatProvider")
	}
	return context
}
