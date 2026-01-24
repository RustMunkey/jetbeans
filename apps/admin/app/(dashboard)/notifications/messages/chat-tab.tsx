"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePusher } from "@/components/pusher-provider"
import { sendTeamMessage, markMessageRead } from "./actions"
import type { TeamMessage, TeamMember, Conversation } from "./types"
import { CHANNELS } from "./types"

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.toUpperCase()
		.slice(0, 2)
}

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime()
	const mins = Math.floor(diff / 60000)
	if (mins < 1) return "now"
	if (mins < 60) return `${mins}m`
	const hrs = Math.floor(mins / 60)
	if (hrs < 24) return `${hrs}h`
	const days = Math.floor(hrs / 24)
	if (days < 7) return `${days}d`
	return new Date(dateStr).toLocaleDateString()
}

function ChatSidebar({
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
	const getUnreadCount = (channel: string) =>
		messages.filter((m) => m.channel === channel && !m.readAt && m.senderId !== userId).length

	return (
		<div className="flex flex-col h-full overflow-y-auto">
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
						onClick={() => onSelect({ type: "channel", id: ch, label: `#${ch}` })}
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
					return (
						<button
							key={member.id}
							type="button"
							className={`mx-2 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
								isActive ? "bg-muted font-medium" : "hover:bg-muted/50"
							}`}
							onClick={() => onSelect({ type: "dm", id: member.id, label: member.name })}
						>
							<Avatar className="h-5 w-5">
								{member.image && <AvatarImage src={member.image} alt={member.name} />}
								<AvatarFallback className="text-[9px]">{getInitials(member.name)}</AvatarFallback>
							</Avatar>
							<span className="flex-1 text-left truncate">{member.name}</span>
						</button>
					)
				})}
		</div>
	)
}

export function ChatTab({
	messages: initialMessages,
	userId,
	userName,
	userImage,
	teamMembers,
}: {
	messages: TeamMessage[]
	userId: string
	userName: string
	userImage: string | null
	teamMembers: TeamMember[]
}) {
	const [messages, setMessages] = useState<TeamMessage[]>(initialMessages)
	const [active, setActive] = useState<Conversation>({ type: "channel", id: "general", label: "#general" })
	const [body, setBody] = useState("")
	const [sending, setSending] = useState(false)
	const [sheetOpen, setSheetOpen] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const { pusher } = usePusher()

	// Real-time: receive messages from others via Pusher WebSocket
	useEffect(() => {
		if (!pusher || !userId) return

		const ch = pusher.subscribe(`private-user-${userId}`)
		ch.bind("new-message", (data: TeamMessage) => {
			setMessages((prev) => {
				// Avoid duplicates
				if (prev.some((m) => m.id === data.id)) return prev
				return [...prev, data]
			})
			if (data.senderId !== userId) {
				toast.info(`${data.senderName}: ${data.body.slice(0, 60)}`)
			}
		})

		return () => {
			ch.unbind_all()
			pusher.unsubscribe(`private-user-${userId}`)
		}
	}, [pusher, userId])

	// Auto-scroll to bottom when messages change or conversation switches
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages, active])

	const filteredMessages = messages.filter((m) => {
		if (active.type === "channel") return m.channel === active.id
		return m.channel === "dm" && (m.senderId === active.id || m.senderId === userId)
	})

	async function handleSend() {
		if (!body.trim()) return
		const messageBody = body.trim()
		setBody("")
		setSending(true)

		// Optimistic: add message to local state immediately
		const optimisticId = `optimistic-${Date.now()}`
		const channel = active.type === "channel" ? active.id : "dm"
		const optimisticMessage: TeamMessage = {
			id: optimisticId,
			senderId: userId,
			senderName: userName,
			senderImage: userImage,
			channel,
			body: messageBody,
			createdAt: new Date().toISOString(),
			readAt: new Date().toISOString(),
		}
		setMessages((prev) => [...prev, optimisticMessage])

		try {
			const recipientIds = active.type === "dm" ? [active.id] : undefined
			await sendTeamMessage({ body: messageBody, channel, recipientIds })
		} catch {
			// Remove optimistic message on failure
			setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
			toast.error("Failed to send message")
		} finally {
			setSending(false)
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	function handleSelectConversation(c: Conversation) {
		setActive(c)
		setSheetOpen(false)
		for (const msg of messages.filter((m) => !m.readAt && m.channel === c.id && m.senderId !== userId)) {
			markMessageRead(msg.id)
		}
	}

	const placeholder = active.type === "channel"
		? `Message #${active.id}...`
		: `Message ${active.label}...`

	const sidebarContent = (
		<ChatSidebar
			active={active}
			onSelect={handleSelectConversation}
			teamMembers={teamMembers}
			userId={userId}
			messages={messages}
		/>
	)

	return (
		<div className="flex h-[calc(100vh-13rem)] rounded-lg border overflow-hidden">
			{/* Desktop sidebar */}
			<div className="hidden md:flex md:w-64 md:shrink-0 border-r bg-muted/30 flex-col">
				{sidebarContent}
			</div>

			{/* Main chat area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Chat header */}
				<div className="h-12 border-b px-4 flex items-center gap-2 shrink-0">
					<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="sm" className="md:hidden -ml-2 px-2">
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
								</svg>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-64 p-0">
							{sidebarContent}
						</SheetContent>
					</Sheet>
					<span className="text-sm font-medium">
						{active.type === "channel" ? `# ${active.id}` : active.label}
					</span>
					{active.type === "channel" && (
						<span className="text-xs text-muted-foreground capitalize hidden sm:inline">
							— {active.id === "general" ? "Team-wide chat" : `${active.id} updates`}
						</span>
					)}
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{filteredMessages.length === 0 ? (
						<div className="flex items-center justify-center h-full">
							<div className="text-center">
								<p className="text-sm text-muted-foreground">No messages yet</p>
								<p className="text-xs text-muted-foreground/60 mt-1">
									Start the conversation.
								</p>
							</div>
						</div>
					) : (
						filteredMessages.map((msg) => {
							const isOwn = msg.senderId === userId
							return (
								<div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
									<Avatar className="h-7 w-7 shrink-0 mt-0.5">
										{msg.senderImage && <AvatarImage src={msg.senderImage} alt={msg.senderName} />}
										<AvatarFallback className="text-[10px]">{getInitials(msg.senderName)}</AvatarFallback>
									</Avatar>
									<div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
										<div className={`flex items-baseline gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
											<span className="text-xs font-medium">{isOwn ? "You" : msg.senderName}</span>
											<span className="text-[11px] text-muted-foreground">{timeAgo(msg.createdAt)}</span>
										</div>
										<div className={`mt-1 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
											isOwn
												? "bg-primary text-primary-foreground"
												: "bg-muted"
										}`}>
											{msg.body}
										</div>
									</div>
								</div>
							)
						})
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="border-t p-3 flex items-end gap-2">
					<Textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						className="min-h-10 max-h-32 resize-none flex-1 text-sm"
						rows={1}
					/>
					<Button
						size="sm"
						onClick={handleSend}
						disabled={sending || !body.trim()}
						className="shrink-0"
					>
						Send
					</Button>
				</div>
			</div>
		</div>
	)
}
