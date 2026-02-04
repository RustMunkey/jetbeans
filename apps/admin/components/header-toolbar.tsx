"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Add01Icon,
  Store01Icon,
  Call02Icon,
  ComputerTerminal02Icon,
  Video01Icon,
  InboxIcon,
  GridIcon,
} from "@hugeicons/core-free-icons"
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
import { ActiveCallIndicator, useCall } from "@/components/calls"
import { useToolbar } from "@/components/toolbar"
import { useRightSidebar } from "@/components/ui/right-sidebar"
import { NotificationBell } from "@/components/notifications"
import { MessagesPopover } from "@/components/messages/messages-popover"
import { useChat } from "@/components/messages"
import { useSidebarMode } from "@/lib/sidebar-mode"

export function HeaderToolbar() {
  const [storeOnline, setStoreOnline] = React.useState(true)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const { open: openCommandMenu } = useCommandMenu()
  const router = useRouter()
  const { isOpen: isToolbarOpen, toggleToolbar } = useToolbar()
  const { toggleSidebar: toggleRightSidebar } = useRightSidebar()
  const { mode } = useSidebarMode()
  const isMessagesMode = mode === "messages"
  const { viewMode, toggleViewMode, active } = useChat()
  const { startCall, status: callStatus } = useCall()

  // Check if we can call the current conversation (only DMs, not channels)
  const canCall = isMessagesMode && active.type === "dm" && active.id && callStatus === "idle"

  const handleAudioCall = async () => {
    if (!canCall || !active.id) return
    try {
      await startCall([active.id], "voice")
    } catch (err) {
      console.error("Failed to start audio call:", err)
    }
  }

  const handleVideoCall = async () => {
    if (!canCall || !active.id) return
    try {
      await startCall([active.id], "video")
    } catch (err) {
      console.error("Failed to start video call:", err)
    }
  }

  return (
    <div className="flex items-center gap-2 px-4">
      {/* Quick create - hide in messages mode */}
      {!isMessagesMode && (
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
      )}

      {/* Messages Popover - hide in messages mode */}
      {!isMessagesMode && <MessagesPopover />}

      {/* Video Call - only in messages mode */}
      {isMessagesMode && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleVideoCall}
          disabled={!canCall}
          title={canCall ? `Video call ${active.label}` : "Select a DM to call"}
        >
          <HugeiconsIcon icon={Video01Icon} size={16} />
          <span className="sr-only">Start video call</span>
        </Button>
      )}

      {/* Calls - in messages mode with DM, start audio call; otherwise go to calls page */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={isMessagesMode && canCall ? handleAudioCall : () => router.push("/calls")}
        disabled={isMessagesMode && !canCall && active.type === "dm"}
        title={isMessagesMode && canCall ? `Call ${active.label}` : "Calls"}
      >
        <HugeiconsIcon icon={Call02Icon} size={16} />
        <span className="sr-only">{isMessagesMode && canCall ? "Start audio call" : "Calls"}</span>
      </Button>
      <ActiveCallIndicator />

      {/* Notifications Bell - hide in messages mode */}
      {!isMessagesMode && <NotificationBell onOpenSidebar={toggleRightSidebar} />}

      {/* Store Menu - hide in messages mode */}
      {!isMessagesMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <HugeiconsIcon icon={Store01Icon} size={16} />
              <span className="sr-only">Store</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href="https://jetbeans.cafe" target="_blank" rel="noopener noreferrer">
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
      )}

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

      {/* Tools Button - hidden on mobile (widgets don't work well on mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className={`size-8 hidden md:flex ${isToolbarOpen ? "text-primary" : ""}`}
        onClick={toggleToolbar}
        title="Tools (Ctrl+\\ or Cmd+\\)"
      >
        <HugeiconsIcon icon={ComputerTerminal02Icon} size={16} />
        <span className="sr-only">Tools</span>
      </Button>

      {/* Chat/Inbox Toggle - only in messages mode */}
      {isMessagesMode && (
        <Button
          variant="ghost"
          size="icon"
          className={`size-8 ${viewMode === "inbox" ? "text-primary" : ""}`}
          onClick={toggleViewMode}
          title={viewMode === "inbox" ? "Show Chat" : "Show Inbox"}
        >
          <HugeiconsIcon icon={viewMode === "inbox" ? GridIcon : InboxIcon} size={16} />
          <span className="sr-only">{viewMode === "inbox" ? "Show Chat" : "Show Inbox"}</span>
        </Button>
      )}

      {/* Search */}
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
