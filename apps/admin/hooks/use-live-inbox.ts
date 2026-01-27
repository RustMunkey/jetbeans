"use client"

import { useEffect } from "react"
import { usePusher } from "@/components/pusher-provider"
import type { InboxEmail } from "@/app/(dashboard)/notifications/messages/types"

interface LiveInboxEmail {
	id: string
	fromName: string
	fromEmail: string
	subject: string
	body: string
	receivedAt: string
	status: "unread" | "read" | "replied"
}

interface UseLiveInboxOptions {
	onNewEmail?: (email: LiveInboxEmail) => void
}

export function useLiveInbox({ onNewEmail }: UseLiveInboxOptions = {}) {
	const { pusher, isConnected } = usePusher()

	useEffect(() => {
		if (!pusher || !isConnected) return

		const channel = pusher.subscribe("private-inbox")

		channel.bind("new-email", (data: LiveInboxEmail) => {
			onNewEmail?.({
				...data,
				status: "unread",
			})
		})

		return () => {
			channel.unbind_all()
			pusher.unsubscribe("private-inbox")
		}
	}, [pusher, isConnected, onNewEmail])
}
