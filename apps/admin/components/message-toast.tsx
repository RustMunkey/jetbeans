"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface MessageToastProps {
	id: string | number
	senderName: string
	body: string
	messageId: string
	channel: string
}

const MAX_MESSAGE_LENGTH = 150

export function MessageToast({ id, senderName, body, messageId, channel }: MessageToastProps) {
	const [expanded, setExpanded] = useState(false)
	const router = useRouter()

	const truncatedBody = body.length > MAX_MESSAGE_LENGTH
		? body.slice(0, MAX_MESSAGE_LENGTH) + "..."
		: body

	return (
		<div
			className="w-[300px] cursor-pointer select-none bg-popover text-popover-foreground border rounded-lg shadow-lg p-3"
			onClick={(e) => {
				if ((e.target as HTMLElement).closest("button")) return
				setExpanded(!expanded)
			}}
		>
			{/* Header - always visible */}
			<div className="flex items-center gap-2 h-8">
				<HugeiconsIcon icon={Mail01Icon} size={16} className="shrink-0 text-muted-foreground" />
				<span className="font-medium text-sm">{senderName}</span>
			</div>

			{/* Expanded content */}
			{expanded && (
				<div className="flex flex-col gap-3 pt-2">
					<p className="text-sm text-muted-foreground leading-relaxed">
						{truncatedBody}
					</p>
					<div className="flex items-center justify-end gap-2">
						<Button
							size="sm"
							variant="outline"
							className="h-7 text-xs"
							onClick={() => toast.dismiss(id)}
						>
							Dismiss
						</Button>
						<Button
							size="sm"
							className="h-7 text-xs"
							onClick={() => {
								toast.dismiss(id)
								router.push(`/notifications/messages?highlight=${messageId}&channel=${channel}`)
							}}
						>
							View
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

export function showMessageToast(data: {
	senderName: string
	body: string
	messageId: string
	channel: string
}) {
	toast.custom(
		(id) => (
			<MessageToast
				id={id}
				senderName={data.senderName}
				body={data.body}
				messageId={data.messageId}
				channel={data.channel}
			/>
		),
		{
			duration: 10000,
		}
	)
}
