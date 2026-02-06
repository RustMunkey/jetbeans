"use client"

import { useEffect, useRef, useState } from "react"
import { useCall } from "./call-provider"
import { CallControls } from "./call-controls"
import { ParticipantGrid } from "./participant-grid"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Minimize02Icon, Maximize02Icon } from "@hugeicons/core-free-icons"
// ConnectionState string values matching livekit-client
const ConnectionState = { Connected: "connected" } as const
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Self-preview component for connecting state
function SelfPreview({ className, videoEnabled }: { className?: string; videoEnabled: boolean }) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const streamRef = useRef<MediaStream | null>(null)

	useEffect(() => {
		async function startPreview() {
			if (!videoEnabled) {
				// Stop existing stream if video disabled
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((track) => track.stop())
					streamRef.current = null
				}
				if (videoRef.current) {
					videoRef.current.srcObject = null
				}
				return
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: false,
				})
				streamRef.current = stream
				if (videoRef.current) {
					videoRef.current.srcObject = stream
				}
			} catch (err) {
				console.error("Failed to get camera preview:", err)
			}
		}

		startPreview()

		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop())
			}
		}
	}, [videoEnabled])

	return (
		<div className={cn("relative size-full bg-muted", className)}>
			{videoEnabled ? (
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className="size-full object-cover"
					style={{ transform: "scaleX(-1)" }}
				/>
			) : (
				<div className="size-full flex items-center justify-center">
					<div className="size-20 rounded-full bg-muted-foreground/20 flex items-center justify-center">
						<span className="text-2xl text-muted-foreground">You</span>
					</div>
				</div>
			)}
			{/* Connecting overlay */}
			<div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
				<div className="animate-spin rounded-full size-4 border-2 border-white border-t-transparent" />
				<p className="text-sm text-white font-medium">Connecting...</p>
			</div>
		</div>
	)
}

function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function CallInterface() {
	const {
		status,
		participants,
		dominantSpeaker,
		connectionState,
		callDuration,
		isFullscreen,
		isMinimized,
		localVideoEnabled,
		toggleFullscreen,
		toggleMinimize,
	} = useCall()

	// Only show when in a call (connecting or connected)
	if (status !== "connecting" && status !== "connected") {
		return null
	}

	const isConnecting = connectionState !== ConnectionState.Connected

	// Minimized view (just a small pill)
	if (isMinimized) {
		return (
			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className="fixed bottom-4 right-4 z-50"
			>
				<Button
					onClick={toggleMinimize}
					className="rounded-full px-4 py-2 bg-primary shadow-lg"
				>
					<span className="flex items-center gap-2">
						<span className="relative flex size-2">
							<span className="animate-ping absolute inline-flex size-full rounded-full bg-green-400 opacity-75" />
							<span className="relative inline-flex size-2 rounded-full bg-green-500" />
						</span>
						<span>{formatDuration(callDuration)}</span>
						<span className="text-muted-foreground">• {participants.length}</span>
					</span>
				</Button>
			</motion.div>
		)
	}

	// Fullscreen view
	if (isFullscreen) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 bg-black"
			>
				{/* Full screen video */}
				<div className="absolute inset-0">
					{isConnecting ? (
						<SelfPreview className="size-full" videoEnabled={localVideoEnabled} />
					) : (
						<ParticipantGrid
							participants={participants}
							dominantSpeaker={dominantSpeaker}
							className="size-full"
						/>
					)}
				</div>

				{/* Top overlay - duration only */}
				<div className="absolute top-4 left-4 z-10">
					<div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
						<span className="relative flex size-2">
							<span className="animate-ping absolute inline-flex size-full rounded-full bg-green-400 opacity-75" />
							<span className="relative inline-flex size-2 rounded-full bg-green-500" />
						</span>
						<span className="text-sm font-medium text-white">{formatDuration(callDuration)}</span>
						<span className="text-sm text-white/70">• {participants.length}</span>
					</div>
				</div>

				{/* Bottom overlay - controls */}
				<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
					<div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-3">
						<CallControls variant="fullscreen" className="justify-center" />
					</div>
				</div>
			</motion.div>
		)
	}

	// Floating view (PiP style)
	return (
		<AnimatePresence>
			<motion.div
				initial={{ scale: 0.8, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.8, opacity: 0, y: 20 }}
				drag
				dragMomentum={false}
				className={cn(
					"fixed bottom-4 right-4 z-50",
					"w-80 rounded-xl overflow-hidden",
					"bg-card border shadow-2xl"
				)}
			>
				{/* Header bar */}
				<div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b cursor-move">
					<div className="flex items-center gap-2 text-sm">
						<span className="relative flex size-2">
							<span className="animate-ping absolute inline-flex size-full rounded-full bg-green-400 opacity-75" />
							<span className="relative inline-flex size-2 rounded-full bg-green-500" />
						</span>
						<span className="font-medium">{formatDuration(callDuration)}</span>
					</div>

					<Button variant="ghost" size="icon" className="size-7" onClick={toggleMinimize}>
						<HugeiconsIcon icon={Minimize02Icon} size={14} />
					</Button>
				</div>

				{/* Video area */}
				<div className="aspect-video bg-muted">
					{isConnecting ? (
						<SelfPreview videoEnabled={localVideoEnabled} />
					) : (
						<ParticipantGrid
							participants={participants}
							dominantSpeaker={dominantSpeaker}
							className="size-full"
						/>
					)}
				</div>

				{/* Controls */}
				<div className="p-2 border-t">
					<CallControls variant="floating" />
				</div>
			</motion.div>
		</AnimatePresence>
	)
}
