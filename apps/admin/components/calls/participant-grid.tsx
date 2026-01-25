"use client"

import { ParticipantTile } from "./participant-tile"
import { cn } from "@/lib/utils"
import type { Participant } from "@/hooks/use-livekit-room"

type ParticipantGridProps = {
	participants: Participant[]
	dominantSpeaker: string | null
	className?: string
}

export function ParticipantGrid({ participants, dominantSpeaker, className }: ParticipantGridProps) {
	const count = participants.length

	// Check if anyone is screen sharing
	const screenSharer = participants.find((p) => p.isScreenSharing)

	// If someone is screen sharing, show their screen prominently
	if (screenSharer) {
		return (
			<div className={cn("flex flex-col gap-2 size-full", className)}>
				{/* Screen share takes most space */}
				<div className="flex-1 min-h-0">
					<ParticipantTile
						participant={screenSharer}
						isSpeaker={screenSharer.identity === dominantSpeaker}
						showScreenShare
						className="size-full"
					/>
				</div>

				{/* Participants in a row at bottom */}
				<div className="flex gap-2 h-24 shrink-0 overflow-x-auto">
					{participants.map((p) => (
						<ParticipantTile
							key={p.identity}
							participant={p}
							isSpeaker={p.identity === dominantSpeaker}
							className="w-32 h-full shrink-0"
						/>
					))}
				</div>
			</div>
		)
	}

	// Grid layout based on participant count
	const gridClass = cn(
		"grid gap-2 size-full",
		count === 1 && "grid-cols-1",
		count === 2 && "grid-cols-2",
		count >= 3 && count <= 4 && "grid-cols-2 grid-rows-2",
		count >= 5 && count <= 6 && "grid-cols-3 grid-rows-2",
		count >= 7 && count <= 9 && "grid-cols-3 grid-rows-3",
		count >= 10 && "grid-cols-4 auto-rows-fr overflow-y-auto",
		className
	)

	return (
		<div className={gridClass}>
			{participants.map((p) => (
				<ParticipantTile
					key={p.identity}
					participant={p}
					isSpeaker={p.identity === dominantSpeaker}
					className="min-h-[120px]"
				/>
			))}
		</div>
	)
}
