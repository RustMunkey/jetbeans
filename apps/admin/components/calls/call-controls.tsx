"use client"

import { useCall } from "./call-provider"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	Mic01Icon,
	MicOff01Icon,
	Video01Icon,
	VideoOffIcon,
	ComputerIcon,
	CallEnd01Icon,
	ArrowExpandIcon,
	ArrowShrinkIcon,
	Message01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

type CallControlsProps = {
	variant?: "floating" | "fullscreen"
	className?: string
}

export function CallControls({ variant = "floating", className }: CallControlsProps) {
	const {
		localAudioEnabled,
		localVideoEnabled,
		isScreenSharing,
		viewMode,
		showChat,
		setViewMode,
		toggleChat,
		toggleAudio,
		toggleVideo,
		toggleScreenShare,
		hangUp,
	} = useCall()

	const buttonSize = variant === "fullscreen" ? "size-12" : "size-10"
	const iconSize = variant === "fullscreen" ? 20 : 18

	return (
		<div className={cn("flex items-center justify-center gap-3", className)}>
			{/* Mute/Unmute */}
			<Button
				variant={localAudioEnabled ? "secondary" : "destructive"}
				size="icon"
				className={cn("rounded-full", buttonSize)}
				onClick={toggleAudio}
				title={localAudioEnabled ? "Mute microphone" : "Unmute microphone"}
			>
				<HugeiconsIcon
					icon={localAudioEnabled ? Mic01Icon : MicOff01Icon}
					size={iconSize}
				/>
				<span className="sr-only">{localAudioEnabled ? "Mute" : "Unmute"}</span>
			</Button>

			{/* Video on/off */}
			<Button
				variant={localVideoEnabled ? "secondary" : "destructive"}
				size="icon"
				className={cn("rounded-full", buttonSize)}
				onClick={toggleVideo}
				title={localVideoEnabled ? "Turn off camera" : "Turn on camera"}
			>
				<HugeiconsIcon
					icon={localVideoEnabled ? Video01Icon : VideoOffIcon}
					size={iconSize}
				/>
				<span className="sr-only">{localVideoEnabled ? "Camera off" : "Camera on"}</span>
			</Button>

			{/* Screen share */}
			<Button
				variant={isScreenSharing ? "default" : "secondary"}
				size="icon"
				className={cn("rounded-full", buttonSize)}
				onClick={toggleScreenShare}
				title={isScreenSharing ? "Stop sharing" : "Share screen"}
			>
				<HugeiconsIcon icon={ComputerIcon} size={iconSize} />
				<span className="sr-only">{isScreenSharing ? "Stop sharing" : "Share screen"}</span>
			</Button>

			{/* Chat toggle (only in fullscreen) */}
			{viewMode === "fullscreen" && (
				<Button
					variant={showChat ? "default" : "secondary"}
					size="icon"
					className={cn("rounded-full", buttonSize)}
					onClick={toggleChat}
					title={showChat ? "Hide chat" : "Show chat"}
				>
					<HugeiconsIcon icon={Message01Icon} size={iconSize} />
					<span className="sr-only">{showChat ? "Hide chat" : "Show chat"}</span>
				</Button>
			)}

			{/* View mode: PIP / Fullscreen toggle */}
			<Button
				variant="secondary"
				size="icon"
				className={cn("rounded-full", buttonSize)}
				onClick={() => setViewMode(viewMode === "fullscreen" ? "floating" : "fullscreen")}
				title={viewMode === "fullscreen" ? "Picture-in-picture" : "Fullscreen"}
			>
				<HugeiconsIcon
					icon={viewMode === "fullscreen" ? ArrowShrinkIcon : ArrowExpandIcon}
					size={iconSize}
				/>
				<span className="sr-only">{viewMode === "fullscreen" ? "Picture-in-picture" : "Fullscreen"}</span>
			</Button>

			{/* End call */}
			<Button
				variant="destructive"
				size="icon"
				className={cn("rounded-full", buttonSize)}
				onClick={hangUp}
				title="End call"
			>
				<HugeiconsIcon icon={CallEnd01Icon} size={iconSize} />
				<span className="sr-only">End call</span>
			</Button>
		</div>
	)
}
