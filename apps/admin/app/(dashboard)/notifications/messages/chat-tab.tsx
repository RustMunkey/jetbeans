"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePusher } from "@/components/pusher-provider"
import { sendTeamMessage, markMessageRead, getMessageReadStatus } from "./actions"
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

const CHAT_STATE_KEY = "jetbeans_chat_state"

function loadChatState(): Conversation | null {
	if (typeof window === "undefined") return null
	try {
		const stored = localStorage.getItem(CHAT_STATE_KEY)
		return stored ? JSON.parse(stored) : null
	} catch {
		return null
	}
}

function saveChatState(conversation: Conversation) {
	if (typeof window === "undefined") return
	try {
		localStorage.setItem(CHAT_STATE_KEY, JSON.stringify(conversation))
	} catch {}
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
	const [active, setActive] = useState<Conversation>(() => {
		const saved = loadChatState()
		return saved || { type: "channel", id: "general", label: "#general" }
	})
	const [body, setBody] = useState("")
	const [sending, setSending] = useState(false)
	const [sheetOpen, setSheetOpen] = useState(false)
	const [readReceipts, setReadReceipts] = useState<Record<string, {
		allRead: boolean
		readCount: number
		totalRecipients: number
		readBy: { name: string | null; readAt: Date | null }[]
	}>>({})
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const { pusher } = usePusher()

	// Fetch read receipts for messages sent by current user
	useEffect(() => {
		async function fetchReadReceipts() {
			const sentMessages = messages.filter(m => m.senderId === userId && !m.id.startsWith("optimistic-"))
			const receipts: typeof readReceipts = {}

			for (const msg of sentMessages) {
				try {
					const status = await getMessageReadStatus(msg.id, userId)
					receipts[msg.id] = status
				} catch {
					// Ignore errors for individual messages
				}
			}
			setReadReceipts(receipts)
		}

		fetchReadReceipts()
		// Re-fetch every 10 seconds for updates
		const interval = setInterval(fetchReadReceipts, 10000)
		return () => clearInterval(interval)
	}, [messages, userId])

	// Real-time: receive messages from others via Pusher WebSocket
	useEffect(() => {
		if (!pusher || !userId) return

		const ch = pusher.subscribe(`private-user-${userId}`)
		const handleNewMessage = (data: TeamMessage) => {
			setMessages((prev) => {
				// Avoid duplicates
				if (prev.some((m) => m.id === data.id)) return prev
				return [...prev, data]
			})
			// Don't show toast here - HeaderToolbar handles global notifications
		}

		// Real-time read receipts
		const handleMessageRead = (data: { messageId: string; readBy: string; readAt: string }) => {
			setReadReceipts((prev) => {
				const existing = prev[data.messageId]
				if (!existing) {
					// Fetch fresh data for this message
					getMessageReadStatus(data.messageId, userId).then((status) => {
						setReadReceipts((p) => ({ ...p, [data.messageId]: status }))
					})
					return prev
				}
				// Update existing receipt
				return {
					...prev,
					[data.messageId]: {
						...existing,
						readCount: existing.readCount + 1,
						allRead: existing.readCount + 1 >= existing.totalRecipients,
						readBy: [...existing.readBy, { name: data.readBy, readAt: new Date(data.readAt) }],
					},
				}
			})
		}

		ch.bind("new-message", handleNewMessage)
		ch.bind("message-read", handleMessageRead)

		return () => {
			// Only unbind our specific handlers, don't unsubscribe the channel
			// HeaderToolbar also uses this channel for notifications
			ch.unbind("new-message", handleNewMessage)
			ch.unbind("message-read", handleMessageRead)
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
		saveChatState(c)
		setSheetOpen(false)
		// Don't mark as read here - only mark when message is scrolled into view
	}

	// Mark message as read when it scrolls into view
	const observerRef = useRef<IntersectionObserver | null>(null)
	const observedMessages = useRef<Set<string>>(new Set())

	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const messageId = entry.target.getAttribute("data-message-id")
						if (messageId && !observedMessages.current.has(messageId)) {
							observedMessages.current.add(messageId)
							const msg = messages.find(m => m.id === messageId)
							if (msg && !msg.readAt && msg.senderId !== userId) {
								markMessageRead(messageId)
								// Update local state
								setMessages(prev => prev.map(m =>
									m.id === messageId ? { ...m, readAt: new Date().toISOString() } : m
								))
							}
						}
					}
				}
			},
			{ threshold: 0.5 }
		)

		return () => {
			observerRef.current?.disconnect()
		}
	}, [messages, userId])

	// Callback ref for observing message elements
	const observeMessage = (el: HTMLDivElement | null, messageId: string, isUnread: boolean) => {
		if (el && isUnread && observerRef.current) {
			el.setAttribute("data-message-id", messageId)
			observerRef.current.observe(el)
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
						filteredMessages.map((msg, idx) => {
							const isOwn = msg.senderId === userId
							const receipt = isOwn ? readReceipts[msg.id] : null
							const isLastOwnMessage = isOwn && filteredMessages.slice(idx + 1).every(m => m.senderId !== userId)

							// Determine read status text
							let readStatus = null
							if (isOwn && receipt && isLastOwnMessage) {
								if (active.type === "dm") {
									// DM: show "Read" when recipient read it
									if (receipt.allRead) {
										readStatus = "Read"
									}
								} else {
									// Channel: show "Read by all" or nothing
									if (receipt.allRead && receipt.totalRecipients > 0) {
										readStatus = "Read by all"
									} else if (receipt.readCount > 0) {
										readStatus = `Read by ${receipt.readCount}`
									}
								}
							}

							const isUnread = !isOwn && !msg.readAt

							return (
								<div
									key={msg.id}
									ref={(el) => observeMessage(el, msg.id, isUnread)}
									className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
								>
									<Avatar className="h-7 w-7 shrink-0 mt-0.5">
										{msg.senderImage && <AvatarImage src={msg.senderImage} alt={msg.senderName} />}
										<AvatarFallback className="text-[10px]">{getInitials(msg.senderName)}</AvatarFallback>
									</Avatar>
									<div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
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
										{readStatus && (
											<span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
												<svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M2 8.5l3.5 3.5L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
												</svg>
												{readStatus}
											</span>
										)}
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
