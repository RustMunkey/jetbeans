"use client"

import { useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ReloadIcon } from "@hugeicons/core-free-icons"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"
import type { TeamMessage, TeamMember, Conversation } from "@/app/(dashboard)/notifications/messages/types"
import { CHANNELS } from "@/app/(dashboard)/notifications/messages/types"
import { useRecentConversations } from "@/hooks/use-recent-conversations"
import { useTeamPresence } from "@/hooks/use-team-presence"
import { StatusDot } from "@/components/presence/status-indicator"

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.toUpperCase()
		.slice(0, 2)
}

// Collapsed view - shows just avatars
export function ChatSidebarCollapsed({
	active,
	onSelect,
	teamMembers,
	userId,
	messages,
}: {
	active: Conversation
	onSelect: (c: Conversation) => void
	teamMembers: TeamMember[]
	userId: string
	messages: TeamMessage[]
}) {
	const { getStatus } = useTeamPresence()
	const { isMobile, setOpenMobile } = useSidebar()
	const getUnreadCount = (channel: string) =>
		messages.filter((m) => m.channel === channel && !m.readAt && m.senderId !== userId).length

	const handleSelect = (conversation: Conversation) => {
		onSelect(conversation)
		if (isMobile) {
			setOpenMobile(false)
		}
	}

	return (
		<div className="flex flex-col items-center gap-1 py-2">
			{/* Channels as hash icons */}
			{CHANNELS.map((ch) => {
				const unread = getUnreadCount(ch)
				const isActive = active.type === "channel" && active.id === ch
				return (
					<Tooltip key={ch} delayDuration={0}>
						<TooltipTrigger asChild>
							<button
								type="button"
								className={`relative size-8 rounded-md flex items-center justify-center text-sm font-mono transition-colors ${
									isActive ? "bg-muted font-medium" : "hover:bg-muted/50"
								}`}
								onClick={() => handleSelect({ type: "channel", id: ch, label: `#${ch}` })}
							>
								#
								{unread > 0 && (
									<span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] rounded-full size-3.5 flex items-center justify-center">
										{unread > 9 ? "9+" : unread}
									</span>
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent side="right" sideOffset={8}>
							<p className="capitalize">#{ch}</p>
						</TooltipContent>
					</Tooltip>
				)
			})}

			<div className="w-6 h-px bg-border my-2" />

			{/* DMs as avatars */}
			{teamMembers
				.filter((m) => m.id !== userId)
				.map((member) => {
					const isActive = active.type === "dm" && active.id === member.id
					const status = getStatus(member.id)
					return (
						<Tooltip key={member.id} delayDuration={0}>
							<TooltipTrigger asChild>
								<button
									type="button"
									className={`size-8 rounded-md flex items-center justify-center transition-colors ${
										isActive ? "bg-muted" : "hover:bg-muted/50"
									}`}
									onClick={() => handleSelect({ type: "dm", id: member.id, label: member.name })}
								>
									<div className="relative overflow-visible">
										<Avatar className="h-6 w-6">
											{member.image && <AvatarImage src={member.image} alt={member.name} />}
											<AvatarFallback className="text-[9px]">{getInitials(member.name)}</AvatarFallback>
										</Avatar>
										<StatusDot status={status} size="sm" />
									</div>
								</button>
							</TooltipTrigger>
							<TooltipContent side="right" sideOffset={8}>
								<p>{member.name}</p>
							</TooltipContent>
						</Tooltip>
					)
				})}
		</div>
	)
}

// Expanded view - shows full list
export function ChatSidebarExpanded({
	active,
	onSelect,
	teamMembers,
	userId,
	messages,
	recentConversations,
	onTrackConversation,
}: {
	active: Conversation
	onSelect: (c: Conversation) => void
	teamMembers: TeamMember[]
	userId: string
	messages: TeamMessage[]
	recentConversations: Conversation[]
	onTrackConversation: (c: Conversation) => void
}) {
	const { getStatus } = useTeamPresence()
	const { isMobile, setOpenMobile } = useSidebar()
	const getUnreadCount = (channel: string) =>
		messages.filter((m) => m.channel === channel && !m.readAt && m.senderId !== userId).length

	const handleSelect = (conversation: Conversation) => {
		onTrackConversation(conversation)
		onSelect(conversation)
		// Close sidebar on mobile after selecting a conversation
		if (isMobile) {
			setOpenMobile(false)
		}
	}

	// Filter out current conversation from recents
	const filteredRecents = recentConversations.filter(
		(c) => !(c.type === active.type && c.id === active.id)
	)

	return (
		<div className="flex flex-col h-full">
			{/* Recent Section */}
			{filteredRecents.length > 0 && (
				<>
					<div className="px-3 pt-4 pb-2 flex items-center gap-1.5">
						<HugeiconsIcon icon={ReloadIcon} size={11} className="text-muted-foreground" />
						<span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
							Recent
						</span>
					</div>
					{filteredRecents.map((conv) => {
						const isActive = active.type === conv.type && active.id === conv.id
						const isChannel = conv.type === "channel"
						const member = !isChannel ? teamMembers.find((m) => m.id === conv.id) : null
						const status = !isChannel && conv.id ? getStatus(conv.id) : "offline"

						return (
							<button
								key={`${conv.type}-${conv.id}`}
								type="button"
								className={`mx-2 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
									isActive ? "bg-muted font-medium" : "hover:bg-muted/50"
								}`}
								onClick={() => handleSelect(conv)}
							>
								{isChannel ? (
									<span className="text-muted-foreground font-mono text-xs">#</span>
								) : (
									<div className="relative overflow-visible">
										<Avatar className="h-5 w-5">
											{member?.image && <AvatarImage src={member.image} alt={conv.label} />}
											<AvatarFallback className="text-[9px]">{getInitials(conv.label)}</AvatarFallback>
										</Avatar>
										<StatusDot status={status} size="sm" />
									</div>
								)}
								<span className="flex-1 text-left truncate">{isChannel ? conv.id : conv.label}</span>
							</button>
						)
					})}
					<div className="mx-3 my-2 h-px bg-border" />
				</>
			)}

			<div className="px-3 pt-4 pb-2">
				<span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
					Channels
				</span>
			</div>
			{CHANNELS.map((ch) => {
				const unread = getUnreadCount(ch)
				const isActive = active.type === "channel" && active.id === ch
				return (
					<button
						key={ch}
						type="button"
						className={`mx-2 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
							isActive ? "bg-muted font-medium" : "hover:bg-muted/50"
						}`}
						onClick={() => handleSelect({ type: "channel", id: ch, label: `#${ch}` })}
					>
						<span className="text-muted-foreground font-mono text-xs">#</span>
						<span className="flex-1 text-left capitalize">{ch}</span>
						{unread > 0 && (
							<span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 min-w-[18px] text-center">
								{unread}
							</span>
						)}
					</button>
				)
			})}

			<div className="px-3 pt-6 pb-2">
				<span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
					Direct Messages
				</span>
			</div>
			{teamMembers
				.filter((m) => m.id !== userId)
				.map((member) => {
					const isActive = active.type === "dm" && active.id === member.id
					const status = getStatus(member.id)
					return (
						<button
							key={member.id}
							type="button"
							className={`mx-2 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
								isActive ? "bg-muted font-medium" : "hover:bg-muted/50"
							}`}
							onClick={() => handleSelect({ type: "dm", id: member.id, label: member.name })}
						>
							<div className="relative overflow-visible">
								<Avatar className="h-5 w-5">
									{member.image && <AvatarImage src={member.image} alt={member.name} />}
									<AvatarFallback className="text-[9px]">{getInitials(member.name)}</AvatarFallback>
								</Avatar>
								<StatusDot status={status} size="sm" />
							</div>
							<span className="flex-1 text-left truncate">{member.name}</span>
						</button>
					)
				})}
		</div>
	)
}

// Combined component that shows both states (uses CSS to toggle)
export function ChatSidebar({
	active,
	onSelect,
	teamMembers,
	userId,
	messages,
}: {
	active: Conversation
	onSelect: (c: Conversation) => void
	teamMembers: TeamMember[]
	userId: string
	messages: TeamMessage[]
}) {
	const { recentConversations, trackConversation } = useRecentConversations()
	const { isMobile, setOpenMobile } = useSidebar()

	// Track initial conversation on mount
	useEffect(() => {
		if (active) {
			trackConversation(active)
		}
	}, []) // Only on mount

	const handleSelect = (conversation: Conversation) => {
		trackConversation(conversation)
		onSelect(conversation)
		// Close sidebar on mobile after selecting a conversation
		if (isMobile) {
			setOpenMobile(false)
		}
	}

	return (
		<>
			{/* Shown when expanded */}
			<div className="group-data-[collapsible=icon]:hidden h-full">
				<ChatSidebarExpanded
					active={active}
					onSelect={onSelect}
					teamMembers={teamMembers}
					userId={userId}
					messages={messages}
					recentConversations={recentConversations}
					onTrackConversation={trackConversation}
				/>
			</div>
			{/* Shown when collapsed */}
			<div className="hidden group-data-[collapsible=icon]:block h-full">
				<ChatSidebarCollapsed
					active={active}
					onSelect={handleSelect}
					teamMembers={teamMembers}
					userId={userId}
					messages={messages}
				/>
			</div>
		</>
	)
}
