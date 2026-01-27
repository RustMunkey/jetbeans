"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Add01Icon,
  Store01Icon,
  Mail01Icon,
  Call02Icon,
  Setting06Icon,
} from "@hugeicons/core-free-icons"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCommandMenu } from "@/components/command-menu"
import { useSession } from "@/lib/auth-client"
import { usePusher } from "@/components/pusher-provider"
import { getUnreadCount, getTeamMessages, markAllRead, markMessageRead } from "@/app/(dashboard)/notifications/messages/actions"
import { ActiveCallIndicator } from "@/components/calls"
import { useToolbar } from "@/components/toolbar"
import { useRightSidebar } from "@/components/ui/right-sidebar"
import { NotificationBell } from "@/components/notifications"
import Link from "next/link"

type QuickMessage = {
  id: string
  senderId: string | null
  senderName: string
  senderImage: string | null
  channel: string
  body: string | null
  attachments?: Array<{ type: string; url: string; name: string }> | null
  createdAt: string
  readAt: string | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatCount(count: number): string {
  if (count < 1000) return String(count)
  if (count < 1000000) return `${Math.floor(count / 1000)}K+`
  return `${Math.floor(count / 1000000)}M+`
}

const SOUND_THROTTLE_MS = 800

function shouldPlaySound(messageChannel: string, senderId: string): boolean {
  if (typeof window === "undefined") return false
  if (!window.location.pathname.includes("/notifications/messages")) return true

  try {
    const stored = localStorage.getItem("jetbeans_chat_state")
    if (!stored) return true
    const active = JSON.parse(stored) as { type: string; id: string }

    if (messageChannel === "dm" && active.type === "dm" && active.id === senderId) {
      return false
    }
    if (messageChannel !== "dm" && active.type === "channel" && active.id === messageChannel) {
      return false
    }
    return true
  } catch {
    return true
  }
}


export function HeaderToolbar() {
  const [storeOnline, setStoreOnline] = React.useState(true)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [recentMessages, setRecentMessages] = React.useState<QuickMessage[]>([])
  const [messagesPopoverOpen, setMessagesPopoverOpen] = React.useState(false)
  const { open: openCommandMenu } = useCommandMenu()
  const router = useRouter()
  const { data: session } = useSession()
  const { pusher } = usePusher()
  const { isOpen: isToolbarOpen, toggleToolbar } = useToolbar()
  const { toggleSidebar: toggleRightSidebar } = useRightSidebar()
  const userId = session?.user?.id

  // Audio refs for notification sound
  const notificationSoundRef = React.useRef<HTMLAudioElement | null>(null)
  const lastSoundTimeRef = React.useRef(0)

  // Preload notification sound on mount
  React.useEffect(() => {
    const audio = new Audio("/sounds/message.mp3")
    audio.volume = 0.5
    audio.preload = "auto"
    audio.load()
    notificationSoundRef.current = audio
  }, [])


  const playNotificationSound = React.useCallback((messageChannel: string, senderId: string) => {
    if (!shouldPlaySound(messageChannel, senderId)) return

    const now = Date.now()
    if (now - lastSoundTimeRef.current < SOUND_THROTTLE_MS) return
    lastSoundTimeRef.current = now

    if (notificationSoundRef.current) {
      const sound = notificationSoundRef.current.cloneNode() as HTMLAudioElement
      sound.volume = 0.5
      sound.play().catch(() => {})
    }
  }, [])


  React.useEffect(() => {
    if (!session?.user?.id) return
    getUnreadCount(session.user.id).then(setUnreadCount)
    getTeamMessages(session.user.id).then((msgs) => {
      setRecentMessages(
        msgs.slice(-20).map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt?.toISOString() || null,
        }))
      )
    })
  }, [session?.user?.id])

  React.useEffect(() => {
    if (!pusher || !session?.user?.id) return

    const channel = pusher.subscribe(`private-user-${session.user.id}`)
    channel.bind("new-message", (data: QuickMessage) => {
      // Always add to recent messages list
      setRecentMessages((prev) => [data, ...prev].slice(0, 20))

      // Only update count and play sound if not viewing that conversation
      if (shouldPlaySound(data.channel, data.senderId || "")) {
        setUnreadCount((c) => c + 1)
        playNotificationSound(data.channel, data.senderId || "")
      }
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`private-user-${session.user.id}`)
    }
  }, [pusher, session?.user?.id, playNotificationSound])

  return (
    <div className="flex items-center gap-2 px-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <HugeiconsIcon icon={Add01Icon} size={16} />
            <span className="sr-only">Quick create</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Create New</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/products?new=true")}>
            Product
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/orders?new=true")}>
            Order
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/customers?new=true")}>
            Customer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/marketing?new=true")}>
            Discount
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/content?new=true")}>
            Blog Post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open={messagesPopoverOpen} onOpenChange={setMessagesPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative size-8">
            <HugeiconsIcon icon={Mail01Icon} size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                {formatCount(unreadCount)}
              </span>
            )}
            <span className="sr-only">Messages</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" collisionPadding={16} className="w-[calc(100vw-2rem)] md:w-80 p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h4 className="text-sm font-semibold">Messages</h4>
            <Link
              href="/notifications/messages"
              className="text-xs text-primary hover:underline"
              onClick={() => {
                setMessagesPopoverOpen(false)
                markAllRead()
                setUnreadCount(0)
                setRecentMessages((prev) =>
                  prev.map((m) => ({ ...m, readAt: m.readAt || new Date().toISOString() }))
                )
              }}
            >
              View all
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Team messages will appear here
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {recentMessages.map((msg) => {
                const initials = msg.senderName
                  .split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!msg.readAt ? "bg-primary/5" : ""}`}
                    onClick={() => {
                      // Close popover first
                      setMessagesPopoverOpen(false)

                      // Dispatch custom event for highlighting (works even when already on page)
                      window.dispatchEvent(new CustomEvent("highlight-message", {
                        detail: { messageId: msg.id, channel: msg.channel }
                      }))

                      // Navigate (will be instant if already on page)
                      router.push(`/notifications/messages?highlight=${msg.id}&channel=${msg.channel}`)

                      if (!msg.readAt) {
                        markMessageRead(msg.id)
                        setUnreadCount((c) => Math.max(0, c - 1))
                        setRecentMessages((prev) =>
                          prev.map((m) => m.id === msg.id ? { ...m, readAt: new Date().toISOString() } : m)
                        )
                      }
                    }}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      {msg.senderImage && <AvatarImage src={msg.senderImage} alt={msg.senderName} />}
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{msg.senderName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(msg.createdAt)}</span>
                        {!msg.readAt && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex items-center justify-between border-t px-4 py-2">
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs text-muted-foreground"
                onClick={async () => {
                  await markAllRead()
                  setUnreadCount(0)
                  setRecentMessages((prev) =>
                    prev.map((m) => ({ ...m, readAt: m.readAt || new Date().toISOString() }))
                  )
                }}
              >
                Mark all read
              </Button>
            ) : (
              <span />
            )}
            {recentMessages.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs text-muted-foreground"
                onClick={() => {
                  setRecentMessages([])
                  setUnreadCount(0)
                }}
              >
                Clear
              </Button>
            ) : (
              <span />
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" className="size-8" asChild>
        <Link href="/calls">
          <HugeiconsIcon icon={Call02Icon} size={16} />
          <span className="sr-only">Calls</span>
        </Link>
      </Button>
      <ActiveCallIndicator />
      <NotificationBell onOpenSidebar={toggleRightSidebar} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <HugeiconsIcon icon={Store01Icon} size={16} />
            <span className="sr-only">Store</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
              View Store
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className={storeOnline ? "text-destructive focus:text-destructive" : ""}
          >
            {storeOnline ? "Turn Off (Maintenance)" : "Bring Back Online"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {storeOnline ? "Take store offline?" : "Bring store online?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {storeOnline
                ? "Your storefront will be inaccessible to customers. You can bring it back online at any time."
                : "Your storefront will become accessible to customers again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={storeOnline ? "destructive" : "default"}
              onClick={() => setStoreOnline(!storeOnline)}
            >
              {storeOnline ? "Take Offline" : "Go Online"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        variant="ghost"
        size="icon"
        className={`size-8 ${isToolbarOpen ? "text-primary" : ""}`}
        onClick={toggleToolbar}
        title="Tools (Ctrl+\\ or Cmd+\\)"
      >
        <HugeiconsIcon icon={Setting06Icon} size={16} />
        <span className="sr-only">Tools</span>
      </Button>
      <button
        type="button"
        onClick={openCommandMenu}
        className="hidden md:flex h-8 w-56 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <HugeiconsIcon icon={Search01Icon} size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-60 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
      <ThemeToggle />
    </div>
  )
}
