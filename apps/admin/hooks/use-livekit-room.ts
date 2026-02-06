"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type {
	Room,
	ConnectionState,
	Track,
} from "livekit-client"

export type Participant = {
	identity: string
	name: string
	isSpeaking: boolean
	isMuted: boolean
	isVideoEnabled: boolean
	isScreenSharing: boolean
	isLocal: boolean
	videoTrack: Track | null
	audioTrack: Track | null
	screenTrack: Track | null
}

// Lazy load livekit-client
let livekitModule: typeof import("livekit-client") | null = null
async function getLiveKit() {
	if (!livekitModule) {
		livekitModule = await import("livekit-client")
	}
	return livekitModule
}

export function useLiveKitRoom(token: string | null, wsUrl: string | null) {
	const [room, setRoom] = useState<Room | null>(null)
	const [connectionState, setConnectionState] = useState<string>("disconnected")
	const [participants, setParticipants] = useState<Participant[]>([])
	const [dominantSpeaker, setDominantSpeaker] = useState<string | null>(null)
	const [localAudioEnabled, setLocalAudioEnabled] = useState(true)
	const [localVideoEnabled, setLocalVideoEnabled] = useState(true)
	const [isScreenSharing, setIsScreenSharing] = useState(false)
	const roomRef = useRef<Room | null>(null)
	// Track intended state before room connects
	const intendedAudioRef = useRef(true)
	const intendedVideoRef = useRef(true)

	const updateParticipants = useCallback(async (room: Room) => {
		const lk = await getLiveKit()
		const allParticipants: Participant[] = []

		// Add local participant
		const local = room.localParticipant
		const localVideoTrack = Array.from(local.videoTrackPublications.values()).find(
			(p) => p.track && p.source === lk.Track.Source.Camera
		)?.track
		const localAudioTrack = Array.from(local.audioTrackPublications.values()).find(
			(p) => p.track && p.source === lk.Track.Source.Microphone
		)?.track
		const localScreenTrack = Array.from(local.videoTrackPublications.values()).find(
			(p) => p.track && p.source === lk.Track.Source.ScreenShare
		)?.track

		allParticipants.push({
			identity: local.identity,
			name: local.name || local.identity,
			isSpeaking: local.isSpeaking,
			isMuted: !local.isMicrophoneEnabled,
			isVideoEnabled: local.isCameraEnabled,
			isScreenSharing: local.isScreenShareEnabled,
			isLocal: true,
			videoTrack: localVideoTrack || null,
			audioTrack: localAudioTrack || null,
			screenTrack: localScreenTrack || null,
		})

		// Add remote participants
		room.remoteParticipants.forEach((remote) => {
			const videoTrack = Array.from(remote.videoTrackPublications.values()).find(
				(p) => p.track && p.source === lk.Track.Source.Camera
			)?.track
			const audioTrack = Array.from(remote.audioTrackPublications.values()).find(
				(p) => p.track && p.source === lk.Track.Source.Microphone
			)?.track
			const screenTrack = Array.from(remote.videoTrackPublications.values()).find(
				(p) => p.track && p.source === lk.Track.Source.ScreenShare
			)?.track

			allParticipants.push({
				identity: remote.identity,
				name: remote.name || remote.identity,
				isSpeaking: remote.isSpeaking,
				isMuted: !remote.isMicrophoneEnabled,
				isVideoEnabled: remote.isCameraEnabled,
				isScreenSharing: remote.isScreenShareEnabled,
				isLocal: false,
				videoTrack: videoTrack || null,
				audioTrack: audioTrack || null,
				screenTrack: screenTrack || null,
			})
		})

		setParticipants(allParticipants)
	}, [])

	// Connect to room
	useEffect(() => {
		if (!token || !wsUrl) return

		let mounted = true
		let newRoom: Room | null = null

		async function connect() {
			const lk = await getLiveKit()
			if (!mounted) return

			newRoom = new lk.Room({
				adaptiveStream: true,
				dynacast: true,
			})

			roomRef.current = newRoom
			setRoom(newRoom)

			const handleConnectionStateChanged = (state: ConnectionState) => {
				console.log("[LiveKit] Connection state changed:", state)
				setConnectionState(state as string)
			}

			const handleParticipantConnected = (participant: { identity: string; sid: string }) => {
				console.log("[LiveKit] Participant connected:", participant.identity, "SID:", participant.sid)
				console.log("[LiveKit] Total remote participants now:", newRoom!.remoteParticipants.size)
				updateParticipants(newRoom!)
			}
			const handleParticipantDisconnected = (participant: { identity: string; sid: string }) => {
				console.log("[LiveKit] Participant disconnected:", participant.identity)
				updateParticipants(newRoom!)
			}
			const handleTrackSubscribed = () => updateParticipants(newRoom!)
			const handleTrackUnsubscribed = () => updateParticipants(newRoom!)
			const syncLocalState = () => {
				const audioEnabled = newRoom!.localParticipant.isMicrophoneEnabled
				const videoEnabled = newRoom!.localParticipant.isCameraEnabled
				intendedAudioRef.current = audioEnabled
				intendedVideoRef.current = videoEnabled
				setLocalAudioEnabled(audioEnabled)
				setLocalVideoEnabled(videoEnabled)
				updateParticipants(newRoom!)
			}
			const handleTrackMuted = syncLocalState
			const handleTrackUnmuted = syncLocalState
			const handleLocalTrackPublished = syncLocalState
			const handleLocalTrackUnpublished = syncLocalState
			const handleActiveSpeakersChanged = (speakers: { identity: string }[]) => {
				if (speakers.length > 0) {
					setDominantSpeaker(speakers[0].identity)
				}
				updateParticipants(newRoom!)
			}

			newRoom.on(lk.RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
			newRoom.on(lk.RoomEvent.ParticipantConnected, handleParticipantConnected)
			newRoom.on(lk.RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
			newRoom.on(lk.RoomEvent.TrackSubscribed, handleTrackSubscribed)
			newRoom.on(lk.RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
			newRoom.on(lk.RoomEvent.TrackMuted, handleTrackMuted)
			newRoom.on(lk.RoomEvent.TrackUnmuted, handleTrackUnmuted)
			newRoom.on(lk.RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
			newRoom.on(lk.RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)
			newRoom.on(lk.RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)

			try {
				console.log("[LiveKit] Connecting to room...")
				console.log("[LiveKit] URL:", wsUrl)
				console.log("[LiveKit] Token length:", token?.length)

				// Add connection timeout
				const connectPromise = newRoom.connect(wsUrl!, token!)
				const timeoutPromise = new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Connection timeout after 15 seconds")), 15000)
				)

				await Promise.race([connectPromise, timeoutPromise])

				console.log("[LiveKit] Connected successfully!")
				console.log("[LiveKit] Room name:", newRoom.name)
				console.log("[LiveKit] Room state:", newRoom.state)
				console.log("[LiveKit] Local participant:", newRoom.localParticipant.identity)
				console.log("[LiveKit] Local participant SID:", newRoom.localParticipant.sid)
				console.log("[LiveKit] Remote participants:", newRoom.remoteParticipants.size)
				// Log remote participant details if any
				newRoom.remoteParticipants.forEach((p) => {
					console.log("[LiveKit] Remote participant:", p.identity, "SID:", p.sid)
				})

				// Enable camera and mic based on intended state (user may have toggled before connect)
				const local = newRoom.localParticipant
				await local.setCameraEnabled(intendedVideoRef.current)
				await local.setMicrophoneEnabled(intendedAudioRef.current)
				// Sync local state with actual room state
				setLocalAudioEnabled(local.isMicrophoneEnabled)
				setLocalVideoEnabled(local.isCameraEnabled)
				updateParticipants(newRoom)
			} catch (err) {
				console.error("[LiveKit] Failed to connect to room:", err)
				console.error("[LiveKit] Error details:", {
					wsUrl,
					tokenLength: token?.length,
					errorMessage: err instanceof Error ? err.message : String(err),
					errorStack: err instanceof Error ? err.stack : undefined,
				})
				// Signal connection error
				setConnectionState("failed")
			}
		}

		connect()

		return () => {
			mounted = false
			if (newRoom) {
				newRoom.disconnect()
				roomRef.current = null
			}
		}
	}, [token, wsUrl, updateParticipants])

	const toggleAudio = useCallback(() => {
		const newEnabled = !intendedAudioRef.current
		intendedAudioRef.current = newEnabled
		setLocalAudioEnabled(newEnabled)

		// Apply to room if connected
		if (roomRef.current) {
			roomRef.current.localParticipant.setMicrophoneEnabled(newEnabled).catch(() => {})
		}
	}, [])

	const toggleVideo = useCallback(() => {
		const newEnabled = !intendedVideoRef.current
		intendedVideoRef.current = newEnabled
		setLocalVideoEnabled(newEnabled)

		// Apply to room if connected
		if (roomRef.current) {
			roomRef.current.localParticipant.setCameraEnabled(newEnabled).catch(() => {})
		}
	}, [])

	// Set intended audio/video state before room connects (used by call type: voice vs video)
	const setMediaIntents = useCallback((audio: boolean, video: boolean) => {
		intendedAudioRef.current = audio
		intendedVideoRef.current = video
		setLocalAudioEnabled(audio)
		setLocalVideoEnabled(video)
	}, [])

	const toggleScreenShare = useCallback(async () => {
		if (!roomRef.current) return
		const local = roomRef.current.localParticipant
		if (local.isScreenShareEnabled) {
			await local.setScreenShareEnabled(false)
			setIsScreenSharing(false)
		} else {
			await local.setScreenShareEnabled(true)
			setIsScreenSharing(true)
		}
	}, [])

	const disconnect = useCallback(() => {
		if (roomRef.current) {
			roomRef.current.disconnect()
		}
	}, [])

	return {
		room,
		connectionState,
		participants,
		dominantSpeaker,
		localAudioEnabled,
		localVideoEnabled,
		isScreenSharing,
		toggleAudio,
		toggleVideo,
		toggleScreenShare,
		setMediaIntents,
		disconnect,
	}
}
