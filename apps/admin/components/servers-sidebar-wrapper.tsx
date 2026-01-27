"use client"

import * as React from "react"
import { useSidebarMode } from "@/lib/sidebar-mode"
import { ServersSidebar } from "@/components/servers-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

const SERVERS_BAR_WIDTH = 64

// Context to share the offset value with sidebar components
const ServersBarContext = React.createContext<number>(0)

export function useServersBarOffset() {
	return React.useContext(ServersBarContext)
}

/**
 * Wrapper that conditionally renders the ServersSidebar
 * Only shows when in messages mode (Discord-style servers bar)
 * Hidden on mobile - mobile uses MobileConversationList instead
 */
export function ServersSidebarWrapper() {
	const { mode } = useSidebarMode()
	const isMobile = useIsMobile()

	// Only show on messages pages, and only on desktop
	if (mode !== "messages" || isMobile) return null

	return (
		<div className="fixed top-0 left-0 z-50 h-screen overflow-visible">
			<ServersSidebar />
		</div>
	)
}

/**
 * Provides the servers bar offset context and layout styling
 * This shifts all fixed-positioned sidebars and content when servers bar is visible
 * On mobile, no offset is applied since the servers bar is hidden
 */
export function ServersBarLayout({ children }: { children: React.ReactNode }) {
	const { mode } = useSidebarMode()
	const isMobile = useIsMobile()
	const isMessagesMode = mode === "messages"
	// Only apply offset on desktop when in messages mode
	const offset = isMessagesMode && !isMobile ? SERVERS_BAR_WIDTH : 0

	return (
		<ServersBarContext.Provider value={offset}>
			<div
				className="flex flex-1 w-full min-h-svh transition-[padding] duration-200 ease-linear"
				style={{ paddingLeft: offset }}
			>
				{children}
			</div>
		</ServersBarContext.Provider>
	)
}
