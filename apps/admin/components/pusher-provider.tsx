"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import PusherClient from "pusher-js"

type PusherContextType = {
	pusher: PusherClient | null
	isConnected: boolean
}

const PusherContext = createContext<PusherContextType>({ pusher: null, isConnected: false })

export function PusherProvider({
	pusherKey,
	pusherCluster,
	children,
}: {
	pusherKey?: string
	pusherCluster?: string
	children: ReactNode
}) {
	const [pusher, setPusher] = useState<PusherClient | null>(null)
	const [isConnected, setIsConnected] = useState(false)

	useEffect(() => {
		if (!pusherKey || !pusherCluster) return

		const client = new PusherClient(pusherKey, {
			cluster: pusherCluster,
			authEndpoint: "/api/pusher/auth",
		})

		client.connection.bind("connected", () => setIsConnected(true))
		client.connection.bind("disconnected", () => setIsConnected(false))

		setPusher(client)

		return () => {
			client.disconnect()
		}
	}, [pusherKey, pusherCluster])

	return (
		<PusherContext.Provider value={{ pusher, isConnected }}>
			{children}
		</PusherContext.Provider>
	)
}

export function usePusher() {
	return useContext(PusherContext)
}
