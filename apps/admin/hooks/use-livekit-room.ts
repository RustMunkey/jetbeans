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
	// Stable track SIDs for dependency tracking (avoids re-attaching same track)
	videoTrackSid: string | null
	audioTrackSid: string | null
	screenTrackSid: string | null
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

	// Throttle active speaker updates to prevent excessive re-renders
	const speakerThrottleRef = useRef<NodeJS.Timeout | null>(null)
	const pendingSpeakerUpdateRef = useRef(false)

	const updateParticipants = useCallback(async (room: Room) => {
		const lk = await getLiveKit()
		const allParticipants: Participant[] = []

		// Add local participant
		const local = room.localParticipant
		const localVideoPub = Array.from(local.videoTrackPublications.values()).find(
			(p) => p.track && p.source === lk.Track.Source.Camera
		)
		const localAudioPub = Array.from(local.audioTrackPublications.values()).find(
			(p) => p.track && p.source === lk.Track.Source.Microphone
		)
		const localScreenPub = Array.from(local.videoTrackPublications.values()).find(
			(p) => p.track && p.source === lk.Track.Source.ScreenShare
		)

		allParticipants.push({
			identity: local.identity,
			name: local.name || local.identity,
			isSpeaking: local.isSpeaking,
			isMuted: !local.isMicrophoneEnabled,
			isVideoEnabled: local.isCameraEnabled,
			isScreenSharing: local.isScreenShareEnabled,
			isLocal: true,
			videoTrack: localVideoPub?.track || null,
			audioTrack: localAudioPub?.track || null,
			screenTrack: localScreenPub?.track || null,
			videoTrackSid: localVideoPub?.trackSid || null,
			audioTrackSid: localAudioPub?.trackSid || null,
			screenTrackSid: localScreenPub?.trackSid || null,
		})

		// Add remote participants
		room.remoteParticipants.forEach((remote) => {
			const videoPub = Array.from(remote.videoTrackPublications.values()).find(
				(p) => p.track && p.source === lk.Track.Source.Camera
			)
			const audioPub = Array.from(remote.audioTrackPublications.values()).find(
				(p) => p.track && p.source === lk.Track.Source.Microphone
			)
			const screenPub = Array.from(remote.videoTrackPublications.values()).find(
				(p) => p.track && p.source === lk.Track.Source.ScreenShare
			)

			allParticipants.push({
				identity: remote.identity,
				name: remote.name || remote.identity,
				isSpeaking: remote.isSpeaking,
				isMuted: !remote.isMicrophoneEnabled,
				isVideoEnabled: remote.isCameraEnabled,
				isScreenSharing: remote.isScreenShareEnabled,
				isLocal: false,
				videoTrack: videoPub?.track || null,
				audioTrack: audioPub?.track || null,
				screenTrack: screenPub?.track || null,
				videoTrackSid: videoPub?.trackSid || null,
				audioTrackSid: audioPub?.trackSid || null,
				screenTrackSid: screenPub?.trackSid || null,
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
				// Audio capture defaults — critical for long call quality
				audioCaptureDefaults: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					// channelCount: 1 is mono — better for voice calls, less processing
					channelCount: 1,
				},
				// Video capture defaults
				videoCaptureDefaults: {
					resolution: { width: 1280, height: 720, frameRate: 24 },
				},
				// Publish defaults — Opus DTX saves bandwidth when not speaking
				publishDefaults: {
					dtx: true, // Discontinuous transmission — reduces bandwidth during silence
					red: true, // Redundant encoding — helps packet loss recovery
					audioPreset: lk.AudioPresets.speech, // Optimized for voice
				},
				// Reconnect policy
				reconnectPolicy: {
					nextRetryDelayInMs: (context) => {
						if (context.retryCount > 7) return null
						return Math.min(1000 * Math.pow(2, context.retryCount), 15000)
					},
				},
				// Disconnect on slow network rather than degrading
				disconnectOnPageLeave: true,
			})

			roomRef.current = newRoom
			setRoom(newRoom)

			const handleConnectionStateChanged = (state: ConnectionState) => {
				console.log("[LiveKit] Connection state changed:", state)
				setConnectionState(state as string)
			}

			const handleParticipantConnected = (participant: { identity: string; sid: string }) => {
				console.log("[LiveKit] Participant connected:", participant.identity)
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

			// Throttled speaker handler — fires at most every 500ms
			// ActiveSpeakersChanged fires VERY frequently (every ~100ms) and was
			// causing thousands of full participant rebuilds over a 30min call
			const handleActiveSpeakersChanged = (speakers: { identity: string }[]) => {
				if (speakers.length > 0) {
					setDominantSpeaker(speakers[0].identity)
				}

				// Throttle participant updates for speaker changes
				if (speakerThrottleRef.current) {
					pendingSpeakerUpdateRef.current = true
					return
				}

				updateParticipants(newRoom!)
				speakerThrottleRef.current = setTimeout(() => {
					speakerThrottleRef.current = null
					if (pendingSpeakerUpdateRef.current) {
						pendingSpeakerUpdateRef.current = false
						updateParticipants(newRoom!)
					}
				}, 500)
			}

			// Handle media quality changes for monitoring
			const handleSignalReconnecting = () => {
				console.warn("[LiveKit] Signal reconnecting...")
			}
			const handleMediaDevicesError = (err: Error) => {
				console.error("[LiveKit] Media device error:", err)
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
			newRoom.on(lk.RoomEvent.SignalReconnecting, handleSignalReconnecting)
			newRoom.on(lk.RoomEvent.MediaDevicesError, handleMediaDevicesError)

			try {
				console.log("[LiveKit] Connecting to room...")

				// Add connection timeout
				const connectPromise = newRoom.connect(wsUrl!, token!)
				const timeoutPromise = new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Connection timeout after 30 seconds")), 30000)
				)

				await Promise.race([connectPromise, timeoutPromise])

				console.log("[LiveKit] Connected successfully! Room:", newRoom.name)

				// Enable camera and mic independently — one failing shouldn't block the other
				const local = newRoom.localParticipant

				// Publish audio track with quality settings
				try {
					await local.setMicrophoneEnabled(intendedAudioRef.current)
				} catch (audioErr) {
					console.error("[LiveKit] Failed to enable microphone:", audioErr)
				}

				// Publish video track
				try {
					await local.setCameraEnabled(intendedVideoRef.current)
				} catch (videoErr) {
					console.error("[LiveKit] Failed to enable camera:", videoErr)
				}

				// Sync local state with actual room state
				setLocalAudioEnabled(local.isMicrophoneEnabled)
				setLocalVideoEnabled(local.isCameraEnabled)
				updateParticipants(newRoom)
			} catch (err) {
				console.error("[LiveKit] Failed to connect to room:", err)
				setConnectionState("failed")
			}
		}

		connect()

		return () => {
			mounted = false
			// Clean up throttle timer
			if (speakerThrottleRef.current) {
				clearTimeout(speakerThrottleRef.current)
				speakerThrottleRef.current = null
			}
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

		if (roomRef.current) {
			roomRef.current.localParticipant.setMicrophoneEnabled(newEnabled).catch((err) => {
				console.error("[LiveKit] Failed to toggle microphone:", err)
				// Revert UI state on failure
				intendedAudioRef.current = !newEnabled
				setLocalAudioEnabled(!newEnabled)
			})
		}
	}, [])

	const toggleVideo = useCallback(() => {
		const newEnabled = !intendedVideoRef.current
		intendedVideoRef.current = newEnabled
		setLocalVideoEnabled(newEnabled)

		if (roomRef.current) {
			roomRef.current.localParticipant.setCameraEnabled(newEnabled).catch((err) => {
				console.error("[LiveKit] Failed to toggle camera:", err)
				// Revert UI state on failure
				intendedVideoRef.current = !newEnabled
				setLocalVideoEnabled(!newEnabled)
			})
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

	// Audio device management
	const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
	const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
	const [activeAudioDevice, setActiveAudioDevice] = useState<string>("")
	const [activeVideoDevice, setActiveVideoDevice] = useState<string>("")
	const [noiseSuppression, setNoiseSuppressionState] = useState(true)

	// Enumerate devices
	useEffect(() => {
		async function loadDevices() {
			try {
				const devices = await navigator.mediaDevices.enumerateDevices()
				setAudioDevices(devices.filter(d => d.kind === "audioinput"))
				setVideoDevices(devices.filter(d => d.kind === "videoinput"))
			} catch {}
		}
		loadDevices()
		navigator.mediaDevices.addEventListener("devicechange", loadDevices)
		return () => navigator.mediaDevices.removeEventListener("devicechange", loadDevices)
	}, [])

	const switchAudioDevice = useCallback(async (deviceId: string) => {
		setActiveAudioDevice(deviceId)
		if (roomRef.current) {
			try {
				await roomRef.current.switchActiveDevice("audioinput", deviceId)
			} catch (err) {
				console.error("[LiveKit] Failed to switch audio device:", err)
			}
		}
	}, [])

	const switchVideoDevice = useCallback(async (deviceId: string) => {
		setActiveVideoDevice(deviceId)
		if (roomRef.current) {
			try {
				await roomRef.current.switchActiveDevice("videoinput", deviceId)
			} catch (err) {
				console.error("[LiveKit] Failed to switch video device:", err)
			}
		}
	}, [])

	const setNoiseSuppression = useCallback(async (enabled: boolean) => {
		setNoiseSuppressionState(enabled)
		if (roomRef.current) {
			const local = roomRef.current.localParticipant
			const micPub = Array.from(local.audioTrackPublications.values()).find(
				(p) => p.track
			)
			if (micPub?.track) {
				const track = micPub.track.mediaStreamTrack
				try {
					await track.applyConstraints({
						noiseSuppression: enabled,
						echoCancellation: true,
						autoGainControl: true,
					})
				} catch (err) {
					console.error("[LiveKit] Failed to set noise suppression:", err)
				}
			}
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
		// Audio settings
		audioDevices,
		videoDevices,
		activeAudioDevice,
		activeVideoDevice,
		noiseSuppression,
		switchAudioDevice,
		switchVideoDevice,
		setNoiseSuppression,
	}
}
