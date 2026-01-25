"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Notification01Icon,
  Search01Icon,
  Add01Icon,
  Store01Icon,
  Mail01Icon,
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
import { toast } from "sonner"
import Link from "next/link"

type QuickMessage = {
  id: string
  senderId: string
  senderName: string
  senderImage: string | null
  channel: string
  body: string
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

export function HeaderToolbar() {
  const [storeOnline, setStoreOnline] = React.useState(true)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [recentMessages, setRecentMessages] = React.useState<QuickMessage[]>([])
  const hasNotifications = false // TODO: replace with real notification count
  const { open: openCommandMenu } = useCommandMenu()
  const router = useRouter()
  const { data: session } = useSession()
  const { pusher } = usePusher()

  React.useEffect(() => {
    if (!session?.user?.id) return
    getUnreadCount(session.user.id).then(setUnreadCount)
    getTeamMessages(session.user.id).then((msgs) => {
      setRecentMessages(
        msgs.slice(0, 5).map((m) => ({
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
      setUnreadCount((c) => c + 1)
      setRecentMessages((prev) => [data, ...prev].slice(0, 5))
      toast.info(`${data.senderName}: ${data.body.slice(0, 60)}`)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`private-user-${session.user.id}`)
    }
  }, [pusher, session?.user?.id])

  return (
    <div className="flex items-center gap-2 px-4">
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
      <Separator orientation="vertical" className="hidden md:block data-[orientation=vertical]:h-4" />
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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative size-8">
            <HugeiconsIcon icon={Mail01Icon} size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
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
                    onClick={async () => {
                      if (!msg.readAt) {
                        await markMessageRead(msg.id)
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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative size-8">
            <HugeiconsIcon icon={Notification01Icon} size={16} />
            {hasNotifications && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" collisionPadding={16} className="w-[calc(100vw-2rem)] md:w-80 p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h4 className="text-sm font-semibold">Notifications</h4>
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground">
              Mark all read
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              You&apos;re all caught up
            </p>
          </div>
        </PopoverContent>
      </Popover>
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
      <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
      <ThemeToggle />
    </div>
  )
}
