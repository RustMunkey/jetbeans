"use client"

import { useEffect, type ReactNode } from "react"
import { usePresence } from "@/hooks/use-presence"
import { usePusher } from "@/components/pusher-provider"
import { useUserStatusProvider, UserStatusContext } from "@/hooks/use-user-status"

export function UserStatusProvider({ children }: { children: ReactNode }) {
	const { isConnected, me } = usePresence()
	const { pusher } = usePusher()
	const statusValue = useUserStatusProvider(isConnected)

	// Broadcast status changes to other users via Pusher client event
	useEffect(() => {
		if (!pusher || !isConnected || !me?.id) return

		const channel = pusher.channel("presence-admin")
		if (!channel) return

		try {
			channel.trigger("client-status-change", {
				userId: me.id,
				status: statusValue.status,
			})
		} catch {
			// Client events may not be enabled in Pusher dashboard
		}
	}, [statusValue.status, pusher, isConnected, me?.id])

	return (
		<UserStatusContext.Provider value={statusValue}>
			{children}
		</UserStatusContext.Provider>
	)
}
