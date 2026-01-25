"use client"

import { useEffect, useRef } from "react"
import type { Track } from "livekit-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { MicOff01Icon, ComputerIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import type { Participant } from "@/hooks/use-livekit-room"

type ParticipantTileProps = {
	participant: Participant
	isSpeaker?: boolean
	showScreenShare?: boolean
	className?: string
}

export function ParticipantTile({
	participant,
	isSpeaker,
	showScreenShare,
	className,
}: ParticipantTileProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const audioRef = useRef<HTMLAudioElement>(null)

	const initials = participant.name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.toUpperCase()
		.slice(0, 2)

	// Attach video track
	useEffect(() => {
		const track = showScreenShare ? participant.screenTrack : participant.videoTrack
		if (!track || !videoRef.current) return

		track.attach(videoRef.current)

		return () => {
			track.detach(videoRef.current!)
		}
	}, [participant.videoTrack, participant.screenTrack, showScreenShare])

	// Attach audio track (only for remote participants)
	useEffect(() => {
		if (participant.isLocal || !participant.audioTrack || !audioRef.current) return

		participant.audioTrack.attach(audioRef.current)

		return () => {
			participant.audioTrack?.detach(audioRef.current!)
		}
	}, [participant.audioTrack, participant.isLocal])

	const showVideo = showScreenShare
		? participant.isScreenSharing && participant.screenTrack
		: participant.isVideoEnabled && participant.videoTrack

	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-lg bg-muted",
				isSpeaker && "ring-2 ring-primary",
				className
			)}
		>
			{/* Video element */}
			{showVideo ? (
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted={participant.isLocal}
					className="size-full object-cover"
				/>
			) : (
				// Avatar fallback
				<div className="size-full flex items-center justify-center bg-muted">
					<Avatar className="size-20">
						<AvatarFallback className="text-2xl">{initials}</AvatarFallback>
					</Avatar>
				</div>
			)}

			{/* Audio element for remote participants */}
			{!participant.isLocal && <audio ref={audioRef} autoPlay />}

			{/* Overlay with name and indicators */}
			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-white truncate">
						{participant.name}
						{participant.isLocal && " (You)"}
					</span>

					<div className="flex items-center gap-2">
						{participant.isScreenSharing && !showScreenShare && (
							<div className="flex size-6 items-center justify-center rounded-full bg-blue-500/80">
								<HugeiconsIcon icon={ComputerIcon} size={12} className="text-white" />
							</div>
						)}
						{participant.isMuted && (
							<div className="flex size-6 items-center justify-center rounded-full bg-red-500/80">
								<HugeiconsIcon icon={MicOff01Icon} size={12} className="text-white" />
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Speaking indicator */}
			{participant.isSpeaking && (
				<div className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-primary animate-pulse" />
			)}
		</div>
	)
}
