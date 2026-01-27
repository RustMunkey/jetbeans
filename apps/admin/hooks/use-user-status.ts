"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import type { PresenceStatus } from "@/components/presence/status-indicator"

const STORAGE_KEY = "jetbeans-user-status"

interface UserStatusContextType {
	status: PresenceStatus
	setStatus: (status: PresenceStatus) => void
	isManuallySet: boolean
	clearManualStatus: () => void
}

const UserStatusContext = createContext<UserStatusContextType | null>(null)

export function useUserStatus() {
	const context = useContext(UserStatusContext)
	if (!context) {
		throw new Error("useUserStatus must be used within UserStatusProvider")
	}
	return context
}

export function useUserStatusProvider(isConnected: boolean) {
	const [manualStatus, setManualStatus] = useState<PresenceStatus | null>(null)

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (stored) {
				const parsed = JSON.parse(stored)
				if (parsed.status && parsed.expiresAt > Date.now()) {
					setManualStatus(parsed.status)
				} else {
					localStorage.removeItem(STORAGE_KEY)
				}
			}
		} catch (e) {
			console.error("Failed to load user status:", e)
		}
	}, [])

	const setStatus = useCallback((status: PresenceStatus) => {
		setManualStatus(status)
		try {
			// Store with 24h expiration
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				status,
				expiresAt: Date.now() + 24 * 60 * 60 * 1000,
			}))
		} catch (e) {
			console.error("Failed to save user status:", e)
		}
	}, [])

	const clearManualStatus = useCallback(() => {
		setManualStatus(null)
		try {
			localStorage.removeItem(STORAGE_KEY)
		} catch (e) {
			console.error("Failed to clear user status:", e)
		}
	}, [])

	// Compute effective status
	// If manually set to DND or idle, use that
	// If manually set to online, but disconnected, show offline
	// If no manual status, use connection state
	const effectiveStatus: PresenceStatus = (() => {
		if (manualStatus === "dnd") return "dnd"
		if (manualStatus === "idle") return "idle"
		if (manualStatus === "offline") return "offline"
		if (!isConnected) return "offline"
		if (manualStatus === "online") return "online"
		return "online"
	})()

	return {
		status: effectiveStatus,
		setStatus,
		isManuallySet: manualStatus !== null,
		clearManualStatus,
	}
}

export { UserStatusContext }
