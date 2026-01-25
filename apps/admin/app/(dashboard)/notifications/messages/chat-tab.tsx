"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image02Icon, Cancel01Icon, Link04Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePusher } from "@/components/pusher-provider"
import { CallButtonGroup } from "@/components/calls"
import { sendTeamMessage, markMessageRead, getMessageReadStatus, clearConversationMessages, getTeamMessages, uploadChatImage, fetchLinkPreview } from "./actions"
import type { TeamMessage, TeamMember, Conversation, MessageAttachment } from "./types"
import { CHANNELS } from "./types"

// URL regex for detecting links in messages
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g

// Parse message body and convert URLs to clickable links
function MessageBody({ body, className }: { body: string; className?: string }) {
	const parts = body.split(URL_REGEX)
	return (
		<span className={className}>
			{parts.map((part, i) => {
				if (URL_REGEX.test(part)) {
					URL_REGEX.lastIndex = 0 // Reset regex state
					return (
						<a
							key={i}
							href={part}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline break-all"
							onClick={(e) => e.stopPropagation()}
						>
							{part}
						</a>
					)
				}
				return part
			})}
		</span>
	)
}

// Link preview component
function LinkPreview({ url }: { url: string }) {
	const [preview, setPreview] = useState<{
		title?: string
		description?: string
		image?: string
		favicon?: string
		siteName?: string
	} | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		fetchLinkPreview(url).then((data) => {
			if (!cancelled) {
				setPreview(data)
				setLoading(false)
			}
		}).catch(() => {
			if (!cancelled) setLoading(false)
		})
		return () => { cancelled = true }
	}, [url])

	if (loading || !preview || (!preview.title && !preview.image)) return null

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="mt-2 flex gap-3 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors max-w-sm"
		>
			{preview.image ? (
				<img
					src={preview.image}
					alt=""
					className="w-16 h-16 rounded object-cover shrink-0"
					onError={(e) => { e.currentTarget.style.display = "none" }}
				/>
			) : preview.favicon ? (
				<img
					src={preview.favicon}
					alt=""
					className="w-6 h-6 rounded shrink-0 mt-1"
					onError={(e) => { e.currentTarget.style.display = "none" }}
				/>
			) : (
				<div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0 mt-1">
					<HugeiconsIcon icon={Link04Icon} size={12} className="text-muted-foreground" />
				</div>
			)}
			<div className="flex-1 min-w-0">
				{preview.siteName && (
					<p className="text-[10px] text-muted-foreground truncate">{preview.siteName}</p>
				)}
				{preview.title && (
					<p className="text-xs font-medium line-clamp-2">{preview.title}</p>
				)}
				{preview.description && (
					<p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{preview.description}</p>
				)}
			</div>
		</a>
	)
}

// Extract first URL from message body
function getFirstUrl(body: string): string | null {
	const match = body.match(URL_REGEX)
	return match ? match[0] : null
}

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
	activeTab,
	onTabChange,
}: {
	messages: TeamMessage[]
	userId: string
	userName: string
	userImage: string | null
	teamMembers: TeamMember[]
	activeTab: "chat" | "inbox"
	onTabChange: (tab: "chat" | "inbox") => void
}) {
	const [messages, setMessages] = useState<TeamMessage[]>(initialMessages)
	const [active, setActive] = useState<Conversation>({ type: "channel", id: "general", label: "#general" })
	const [hydrated, setHydrated] = useState(false)

	// Load saved chat state after hydration
	useEffect(() => {
		const saved = loadChatState()
		if (saved) setActive(saved)
		setHydrated(true)
	}, [])
	const [body, setBody] = useState("")
	const [sending, setSending] = useState(false)
	const [sheetOpen, setSheetOpen] = useState(false)
	const [readReceipts, setReadReceipts] = useState<Record<string, {
		allRead: boolean
		readCount: number
		totalRecipients: number
		readBy: { name: string | null; readAt: Date | null }[]
	}>>({})
	const [highlightedId, setHighlightedId] = useState<string | null>(null)
	const [isAtBottom, setIsAtBottom] = useState(true)
	const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([])
	const [isDragOver, setIsDragOver] = useState(false)
	const [uploadingImage, setUploadingImage] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const messagesContainerRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { pusher } = usePusher()
	const searchParams = useSearchParams()

	// Function to highlight a message - refetches from DB if message not found
	const highlightMessage = useCallback(async (messageId: string, channel: string) => {
		// Check if message exists in current state
		let msg = messages.find(m => m.id === messageId)

		// If not found, refetch messages from database
		if (!msg) {
			try {
				const freshMessages = await getTeamMessages(userId)
				const formattedMessages = freshMessages.map((m) => ({
					...m,
					attachments: m.attachments || undefined,
					createdAt: m.createdAt.toISOString(),
					readAt: m.readAt?.toISOString() || null,
				}))
				setMessages(formattedMessages)
				msg = formattedMessages.find(m => m.id === messageId)
			} catch {
				// Ignore fetch errors, continue with highlight attempt
			}
		}

		setHighlightedId(messageId)

		// Switch to the correct channel/conversation
		if (channel && channel !== active.id) {
			if (channel === "dm") {
				if (msg) {
					const otherId = msg.senderId === userId ? active.id : msg.senderId
					const member = teamMembers.find(m => m.id === otherId)
					if (member) {
						setActive({ type: "dm", id: otherId, label: member.name })
					}
				}
			} else {
				setActive({ type: "channel", id: channel, label: `#${channel}` })
			}
		}

		// Scroll to the message after a short delay (give time for state update)
		setTimeout(() => {
			const el = document.querySelector(`[data-message-id="${messageId}"]`)
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "center" })
			}
		}, 150)

		// Clear highlight after animation
		setTimeout(() => setHighlightedId(null), 2000)

		// Clear URL params
		window.history.replaceState({}, "", "/notifications/messages")
	}, [active.id, messages, userId, teamMembers])

	// Listen for custom highlight event (from header popover)
	useEffect(() => {
		const handleHighlight = (e: CustomEvent<{ messageId: string; channel: string }>) => {
			highlightMessage(e.detail.messageId, e.detail.channel)
		}
		window.addEventListener("highlight-message", handleHighlight as EventListener)
		return () => window.removeEventListener("highlight-message", handleHighlight as EventListener)
	}, [highlightMessage])

	// Handle URL params for highlighting specific message
	useEffect(() => {
		const highlightId = searchParams.get("highlight")
		const channel = searchParams.get("channel")

		if (highlightId && channel) {
			highlightMessage(highlightId, channel)
		}
	}, [searchParams, highlightMessage])

	// Track if user is at bottom of messages
	const handleScroll = useCallback(() => {
		const container = messagesContainerRef.current
		if (!container) return
		const threshold = 100 // pixels from bottom
		const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
		setIsAtBottom(atBottom)
	}, [])

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

	// Auto-scroll to bottom only if user is already at bottom
	useEffect(() => {
		if (isAtBottom) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
		}
	}, [messages, isAtBottom])

	// Scroll to bottom when switching conversations
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
		setIsAtBottom(true)
	}, [active])

	const filteredMessages = messages.filter((m) => {
		if (active.type === "channel") return m.channel === active.id
		return m.channel === "dm" && (m.senderId === active.id || m.senderId === userId)
	})

	async function handleImageUpload(file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files are allowed")
			return
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Image too large (max 10MB)")
			return
		}

		setUploadingImage(true)
		try {
			const formData = new FormData()
			formData.append("file", file)
			const attachment = await uploadChatImage(formData)
			setPendingAttachments((prev) => [...prev, attachment])
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to upload image")
		} finally {
			setUploadingImage(false)
		}
	}

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault()
		setIsDragOver(true)
	}

	function handleDragLeave(e: React.DragEvent) {
		e.preventDefault()
		setIsDragOver(false)
	}

	async function handleDrop(e: React.DragEvent) {
		e.preventDefault()
		setIsDragOver(false)

		const files = Array.from(e.dataTransfer.files)
		const imageFiles = files.filter((f) => f.type.startsWith("image/"))

		for (const file of imageFiles) {
			await handleImageUpload(file)
		}
	}

	async function handleSend() {
		if (!body.trim() && pendingAttachments.length === 0) return
		const messageBody = body.trim()
		const attachments = [...pendingAttachments]
		setBody("")
		setPendingAttachments([])
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
			attachments,
			createdAt: new Date().toISOString(),
			readAt: new Date().toISOString(),
		}
		setMessages((prev) => [...prev, optimisticMessage])

		try {
			const recipientIds = active.type === "dm" ? [active.id] : undefined
			const realMessage = await sendTeamMessage({ body: messageBody, channel, recipientIds, attachments })
			// Replace optimistic message with real one from database
			const createdAt = typeof realMessage.createdAt === "string"
				? realMessage.createdAt
				: realMessage.createdAt.toISOString()
			setMessages((prev) => prev.map((m) =>
				m.id === optimisticId
					? { ...m, id: realMessage.id, createdAt }
					: m
			))
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
		<div className="flex h-[calc(100vh-6rem)] rounded-lg border overflow-hidden">
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
					{/* Call buttons */}
					<CallButtonGroup
						participantIds={
							active.type === "dm"
								? [active.id]
								: teamMembers.filter((m) => m.id !== userId).map((m) => m.id)
						}
						chatChannel={active.type === "channel" ? active.id : undefined}
						className="flex items-center"
					/>
					<div className="ml-auto flex items-center gap-2">
						{filteredMessages.length > 0 && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs text-muted-foreground"
								onClick={async () => {
									if (!confirm("Clear all messages in this conversation? This only affects your view.")) return
									const channel = active.type === "channel" ? active.id : "dm"
									await clearConversationMessages(channel)
									setMessages((prev) => prev.filter((m) => m.channel !== channel))
									toast.success("Messages cleared")
								}}
							>
								Clear
							</Button>
						)}
						<Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "chat" | "inbox")}>
							<TabsList className="h-8">
								<TabsTrigger value="chat" className="text-xs px-3 h-6">Chat</TabsTrigger>
								<TabsTrigger value="inbox" className="text-xs px-3 h-6">Inbox</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</div>

				{/* Messages */}
				<div
					ref={messagesContainerRef}
					onScroll={handleScroll}
					className="flex-1 overflow-y-auto p-4 space-y-3"
				>
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
							const isHighlighted = msg.id === highlightedId

							return (
								<div
									key={msg.id}
									ref={(el) => observeMessage(el, msg.id, isUnread)}
									data-message-id={msg.id}
									className={`group flex gap-2.5 items-start rounded-lg ${isOwn ? "flex-row-reverse" : ""} ${isHighlighted ? "animate-[pulse-highlight_0.6s_ease-out] relative z-[9999]" : ""}`}
								>
									<Avatar className="h-9 w-9 shrink-0">
										{msg.senderImage && <AvatarImage src={msg.senderImage} alt={msg.senderName} />}
										<AvatarFallback className="text-xs">{getInitials(msg.senderName)}</AvatarFallback>
									</Avatar>
									<div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
										{/* Attachments (images) */}
										{msg.attachments && msg.attachments.length > 0 && (
											<div className={`flex flex-wrap gap-2 mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
												{msg.attachments.map((att, attIdx) => (
													<a
														key={attIdx}
														href={att.url}
														target="_blank"
														rel="noopener noreferrer"
														className="block"
													>
														<img
															src={att.url}
															alt={att.name}
															className="max-w-[200px] max-h-[200px] rounded-lg object-cover border hover:opacity-90 transition-opacity"
														/>
													</a>
												))}
											</div>
										)}
										<div className={`flex items-end gap-1 ${isOwn ? "flex-row-reverse" : ""}`}>
											{msg.body && (
												<div className={`px-3 py-2 text-sm whitespace-pre-wrap break-words ${
													isOwn
														? "bg-primary text-primary-foreground rounded-lg rounded-br-sm"
														: "bg-muted rounded-lg rounded-bl-sm"
												}`}>
													<MessageBody body={msg.body} />
												</div>
											)}
											{msg.body && (
												<button
													type="button"
													onClick={() => {
														navigator.clipboard.writeText(msg.body)
														toast.success("Copied to clipboard")
													}}
													className="opacity-0 group-hover:opacity-100 transition-opacity mb-0.5"
													title="Copy message"
												>
													<svg className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
														<rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
														<path d="M3 10V3.5A1.5 1.5 0 0 1 4.5 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
													</svg>
												</button>
											)}
										</div>
										{/* Link preview */}
										{msg.body && getFirstUrl(msg.body) && (
											<LinkPreview url={getFirstUrl(msg.body)!} />
										)}
										<div className={`flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground ${isOwn ? "flex-row-reverse" : ""}`}>
											<span className="font-medium">{isOwn ? "You" : msg.senderName.split(" ")[0]}</span>
											<span className="text-muted-foreground/50">·</span>
											<span>{timeAgo(msg.createdAt)}</span>
											{readStatus && (
												<>
													<span className="text-muted-foreground/50">·</span>
													<span className="flex items-center gap-0.5">
														<svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
															<path d="M2 8.5l3.5 3.5L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
														</svg>
														{readStatus}
													</span>
												</>
											)}
										</div>
									</div>
								</div>
							)
						})
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div
					className={`border-t p-3 ${isDragOver ? "bg-primary/5 border-primary" : ""}`}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					{/* Pending attachments preview */}
					{pendingAttachments.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-2">
							{pendingAttachments.map((att, idx) => (
								<div key={idx} className="relative group">
									<img
										src={att.url}
										alt={att.name}
										className="w-16 h-16 rounded object-cover border"
									/>
									<button
										type="button"
										onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
										className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<HugeiconsIcon icon={Cancel01Icon} size={12} />
									</button>
								</div>
							))}
						</div>
					)}
					<div className="flex items-end gap-2">
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							className="hidden"
							onChange={(e) => {
								const files = Array.from(e.target.files || [])
								files.forEach((file) => handleImageUpload(file))
								e.target.value = ""
							}}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-9 shrink-0"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploadingImage}
						>
							<HugeiconsIcon icon={Image02Icon} size={18} className="text-muted-foreground" />
						</Button>
						<Textarea
							value={body}
							onChange={(e) => setBody(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={isDragOver ? "Drop images here..." : placeholder}
							className="min-h-10 max-h-32 resize-none flex-1 text-sm"
							rows={1}
						/>
						<Button
							size="sm"
							onClick={handleSend}
							disabled={sending || uploadingImage || (!body.trim() && pendingAttachments.length === 0)}
							className="shrink-0"
						>
							{uploadingImage ? "..." : "Send"}
						</Button>
					</div>
					{isDragOver && (
						<p className="text-xs text-primary mt-2 text-center">Drop images to attach</p>
					)}
				</div>
			</div>
		</div>
	)
}
