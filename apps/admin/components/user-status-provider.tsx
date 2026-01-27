"use client"

import type { ReactNode } from "react"
import { usePresence } from "@/hooks/use-presence"
import { useUserStatusProvider, UserStatusContext } from "@/hooks/use-user-status"

export function UserStatusProvider({ children }: { children: ReactNode }) {
	const { isConnected } = usePresence()
	const statusValue = useUserStatusProvider(isConnected)

	return (
		<UserStatusContext.Provider value={statusValue}>
			{children}
		</UserStatusContext.Provider>
	)
}
