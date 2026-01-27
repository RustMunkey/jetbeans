"use client"

import { useMemo } from "react"
import { usePresence } from "@/hooks/use-presence"
import type { PresenceStatus } from "@/components/presence/status-indicator"

/**
 * Hook to get presence status for team members
 * Uses the presence-admin channel to determine who's online
 */
export function useTeamPresence() {
	const { members, me, isConnected } = usePresence()

	// Create a map of user IDs to their online status
	const memberStatuses = useMemo(() => {
		const statusMap = new Map<string, PresenceStatus>()

		for (const member of members) {
			// For now, if they're in the presence channel, they're online
			// In the future, we could sync manual status via presence info
			statusMap.set(member.id, "online")
		}

		return statusMap
	}, [members])

	/**
	 * Get the presence status for a specific user
	 */
	const getStatus = (userId: string): PresenceStatus => {
		// If we're not connected, assume offline
		if (!isConnected) return "offline"

		// If user is in the presence channel, they're online
		if (memberStatuses.has(userId)) {
			return memberStatuses.get(userId) || "online"
		}

		// Otherwise they're offline
		return "offline"
	}

	/**
	 * Check if a specific user is online
	 */
	const isOnline = (userId: string): boolean => {
		return memberStatuses.has(userId)
	}

	return {
		getStatus,
		isOnline,
		onlineCount: members.length,
		myId: me?.id,
	}
}
