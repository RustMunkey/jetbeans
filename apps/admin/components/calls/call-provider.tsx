"use client"

import { createContext, useContext, useCallback, useEffect, useState, useRef, type ReactNode } from "react"
import { usePusher } from "@/components/pusher-provider"

// ConnectionState enum values from livekit-client (avoid direct import for faster builds)
const ConnectionState = { Disconnected: 0, Connecting: 1, Connected: 2, Reconnecting: 3 } as const
type ConnectionStateType = (typeof ConnectionState)[keyof typeof ConnectionState]
import { useLiveKitRoom, type Participant } from "@/hooks/use-livekit-room"
import {
	initiateCall,
	acceptCall,
	declineCall,
	endCall,
	leaveCall,
	markCallAsMissed,
} from "@/app/(dashboard)/calls/actions"
import type {
	CallType,
	CallWithParticipants,
	IncomingCallEvent,
	CallAcceptedEvent,
	CallDeclinedEvent,
	CallEndedEvent,
	ParticipantJoinedEvent,
	ParticipantLeftEvent,
} from "@/app/(dashboard)/calls/types"

type CallClientStatus = "idle" | "ringing-incoming" | "ringing-outgoing" | "connecting" | "connected"

type CallState = {
	status: CallClientStatus
	call: CallWithParticipants | null
	incomingCall: IncomingCallEvent | null
	token: string | null
	wsUrl: string | null
	participants: Participant[]
	dominantSpeaker: string | null
	localAudioEnabled: boolean
	localVideoEnabled: boolean
	isScreenSharing: boolean
	connectionState: number
	callDuration: number
	isFullscreen: boolean
	isMinimized: boolean
}

type CallContextType = CallState & {
	startCall: (participantIds: string[], type: CallType, chatChannel?: string) => Promise<void>
	answerCall: () => Promise<void>
	rejectCall: () => Promise<void>
	hangUp: () => Promise<void>
	toggleAudio: () => void
	toggleVideo: () => void
	toggleScreenShare: () => Promise<void>
	toggleFullscreen: () => void
	toggleMinimize: () => void
}

const CallContext = createContext<CallContextType | null>(null)

export function useCall() {
	const context = useContext(CallContext)
	if (!context) {
		throw new Error("useCall must be used within CallProvider")
	}
	return context
}

// Optional hook that doesn't throw
export function useCallOptional() {
	return useContext(CallContext)
}

const RING_TIMEOUT = 30000 // 30 seconds

// Ringtone for incoming calls
const RINGTONE_PATH = "/sounds/ringtone.mp3"
// Outgoing dial tone
const DIALTONE_PATH = "/sounds/ringtone.mp3"

export function CallProvider({
	userId,
	userName,
	userImage,
	children,
}: {
	userId: string
	userName: string
	userImage: string | null
	children: ReactNode
}) {
	const { pusher } = usePusher()
	const [status, setStatus] = useState<CallClientStatus>("idle")
	const statusRef = useRef<CallClientStatus>("idle")
	const [call, setCall] = useState<CallWithParticipants | null>(null)
	const [incomingCall, setIncomingCall] = useState<IncomingCallEvent | null>(null)
	const [token, setToken] = useState<string | null>(null)
	const [wsUrl, setWsUrl] = useState<string | null>(null)
	const [callDuration, setCallDuration] = useState(0)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [isMinimized, setIsMinimized] = useState(false)
	const [ringTimeout, setRingTimeout] = useState<NodeJS.Timeout | null>(null)

	// LiveKit room hook
	const {
		connectionState,
		participants,
		dominantSpeaker,
		localAudioEnabled,
		localVideoEnabled,
		isScreenSharing,
		toggleAudio,
		toggleVideo,
		toggleScreenShare,
		disconnect,
	} = useLiveKitRoom(token, wsUrl)

	// Keep statusRef in sync
	useEffect(() => {
		statusRef.current = status
	}, [status])

	// Duration timer
	useEffect(() => {
		if (status !== "connected") {
			setCallDuration(0)
			return
		}

		const interval = setInterval(() => {
			setCallDuration((d) => d + 1)
		}, 1000)

		return () => clearInterval(interval)
	}, [status])

	// Update status based on connection state (moved after resetCallState definition)
	// See useEffect below after resetCallState is defined

	// Clear ring timeout on cleanup
	useEffect(() => {
		return () => {
			if (ringTimeout) clearTimeout(ringTimeout)
		}
	}, [ringTimeout])

	// Listen for Pusher events
	useEffect(() => {
		if (!pusher || !userId) return

		const channel = pusher.subscribe(`private-user-${userId}`)

		const handleIncomingCall = (event: IncomingCallEvent) => {
			// Don't interrupt an active call
			if (statusRef.current !== "idle") return

			setIncomingCall(event)
			setStatus("ringing-incoming")

			// Play ringtone
			try {
				const audio = new Audio(RINGTONE_PATH)
				audio.loop = true
				audio.volume = 0.5
				audio.play().catch(() => {})
				// Store ref to stop later
				;(window as unknown as { __ringtone?: HTMLAudioElement }).__ringtone = audio
			} catch {}

			// Auto-decline after timeout
			const timeout = setTimeout(async () => {
				if (statusRef.current === "ringing-incoming") {
					try {
						await markCallAsMissed(event.callId)
					} catch {}
					setIncomingCall(null)
					setStatus("idle")
					stopRingtone()
				}
			}, RING_TIMEOUT)
			setRingTimeout(timeout)
		}

		const handleCallAccepted = (event: CallAcceptedEvent) => {
			// Someone accepted our outgoing call
			if (statusRef.current === "ringing-outgoing" || statusRef.current === "connecting") {
				setStatus("connecting")
			}
		}

		const handleCallDeclined = (event: CallDeclinedEvent) => {
			// Check if all recipients declined
			// For now, if we're ringing outgoing and get a decline, we might still wait for others
			// This is handled server-side
		}

		const handleCallEnded = (event: CallEndedEvent) => {
			resetCallState()
		}

		const handleParticipantJoined = (event: ParticipantJoinedEvent) => {
			// LiveKit handles this, but we could show a toast
		}

		const handleParticipantLeft = (event: ParticipantLeftEvent) => {
			// LiveKit handles this
		}

		channel.bind("incoming-call", handleIncomingCall)
		channel.bind("call-accepted", handleCallAccepted)
		channel.bind("call-declined", handleCallDeclined)
		channel.bind("call-ended", handleCallEnded)
		channel.bind("participant-joined", handleParticipantJoined)
		channel.bind("participant-left", handleParticipantLeft)

		return () => {
			channel.unbind("incoming-call", handleIncomingCall)
			channel.unbind("call-accepted", handleCallAccepted)
			channel.unbind("call-declined", handleCallDeclined)
			channel.unbind("call-ended", handleCallEnded)
			channel.unbind("participant-joined", handleParticipantJoined)
			channel.unbind("participant-left", handleParticipantLeft)
		}
	}, [pusher, userId])

	const stopRingtone = () => {
		const ringtone = (window as unknown as { __ringtone?: HTMLAudioElement }).__ringtone
		if (ringtone) {
			ringtone.pause()
			ringtone.currentTime = 0
			delete (window as unknown as { __ringtone?: HTMLAudioElement }).__ringtone
		}
	}

	const playDialtone = () => {
		try {
			const audio = new Audio(DIALTONE_PATH)
			audio.loop = true
			audio.volume = 0.4
			audio.play().catch(() => {})
			;(window as unknown as { __dialtone?: HTMLAudioElement }).__dialtone = audio
		} catch {}
	}

	const stopDialtone = () => {
		const dialtone = (window as unknown as { __dialtone?: HTMLAudioElement }).__dialtone
		if (dialtone) {
			dialtone.pause()
			dialtone.currentTime = 0
			delete (window as unknown as { __dialtone?: HTMLAudioElement }).__dialtone
		}
	}

	const resetCallState = useCallback(() => {
		disconnect()
		setStatus("idle")
		setCall(null)
		setIncomingCall(null)
		setToken(null)
		setWsUrl(null)
		setCallDuration(0)
		setIsFullscreen(false)
		setIsMinimized(false)
		stopRingtone()
		stopDialtone()
		if (ringTimeout) {
			clearTimeout(ringTimeout)
			setRingTimeout(null)
		}
	}, [disconnect, ringTimeout])

	// Update status based on connection state
	useEffect(() => {
		if (connectionState === ConnectionState.Connected && status === "connecting") {
			setStatus("connected")
			stopDialtone() // Stop dial tone when call connects
		}
		// Handle connection failure
		if (connectionState === -1 && (status === "connecting" || status === "ringing-outgoing")) {
			console.error("[Call] LiveKit connection failed, resetting call state")
			resetCallState()
		}
	}, [connectionState, status, resetCallState])

	const startCall = useCallback(
		async (participantIds: string[], type: CallType, chatChannel?: string) => {
			if (status !== "idle") {
				throw new Error("Already in a call")
			}

			setStatus("ringing-outgoing")
			playDialtone()

			try {
				const result = await initiateCall({ participantIds, type, chatChannel })
				setToken(result.token)
				setWsUrl(result.wsUrl)
				setStatus("connecting")
				// Dial tone keeps playing until call is connected
			} catch (err) {
				resetCallState()
				throw err
			}
		},
		[status, resetCallState]
	)

	const answerCall = useCallback(async () => {
		if (!incomingCall) return

		stopRingtone()
		if (ringTimeout) {
			clearTimeout(ringTimeout)
			setRingTimeout(null)
		}

		setStatus("connecting")

		try {
			const result = await acceptCall(incomingCall.callId)
			setToken(result.token)
			setWsUrl(result.wsUrl)
		} catch (err) {
			resetCallState()
			throw err
		}
	}, [incomingCall, ringTimeout, resetCallState])

	const rejectCall = useCallback(async () => {
		if (!incomingCall) return

		stopRingtone()
		if (ringTimeout) {
			clearTimeout(ringTimeout)
			setRingTimeout(null)
		}

		try {
			await declineCall(incomingCall.callId)
		} catch {}

		resetCallState()
	}, [incomingCall, ringTimeout, resetCallState])

	const hangUp = useCallback(async () => {
		if (incomingCall) {
			try {
				await leaveCall(incomingCall.callId)
			} catch {}
		} else if (call) {
			try {
				await endCall(call.id)
			} catch {}
		}
		resetCallState()
	}, [call, incomingCall, resetCallState])

	const toggleFullscreen = useCallback(() => {
		setIsFullscreen((f) => !f)
		setIsMinimized(false)
	}, [])

	const toggleMinimize = useCallback(() => {
		setIsMinimized((m) => !m)
		setIsFullscreen(false)
	}, [])

	return (
		<CallContext.Provider
			value={{
				status,
				call,
				incomingCall,
				token,
				wsUrl,
				participants,
				dominantSpeaker,
				localAudioEnabled,
				localVideoEnabled,
				isScreenSharing,
				connectionState,
				callDuration,
				isFullscreen,
				isMinimized,
				startCall,
				answerCall,
				rejectCall,
				hangUp,
				toggleAudio,
				toggleVideo,
				toggleScreenShare,
				toggleFullscreen,
				toggleMinimize,
			}}
		>
			{children}
		</CallContext.Provider>
	)
}
