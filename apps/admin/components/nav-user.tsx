"use client"

import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UnfoldMoreIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { signOut } from "@/lib/auth-client"
import { logSignOut } from "@/app/(dashboard)/settings/sessions/sign-out-action"
import { usePresence } from "@/hooks/use-presence"
import { useUserStatus } from "@/hooks/use-user-status"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { StatusDot, StatusIndicator, type PresenceStatus } from "@/components/presence/status-indicator"

const STATUS_OPTIONS: { value: PresenceStatus; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "idle", label: "Sleep" },
  { value: "dnd", label: "Do Not Disturb" },
  { value: "offline", label: "Invisible" },
]

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile, state } = useSidebar()
  const router = useRouter()
  const { isConnected } = usePresence()
  const { status, setStatus } = useUserStatus()

  const handleSignOut = async () => {
    await logSignOut()
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login")
        },
      },
    })
  }

  const initials = user.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isCollapsed = state === "collapsed"
  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]

  const cycleStatus = () => {
    const currentIndex = STATUS_OPTIONS.findIndex(s => s.value === status)
    const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length
    setStatus(STATUS_OPTIONS[nextIndex].value)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="!overflow-visible data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="relative !overflow-visible">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <StatusDot status={status} />
              </div>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <HugeiconsIcon icon={UnfoldMoreIcon} size={16} className="ml-auto" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div
                className="flex items-center gap-2 px-1 py-1.5 text-left text-sm cursor-pointer rounded-sm hover:bg-accent transition-colors"
                onClick={() => router.push("/settings/account")}
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                cycleStatus()
              }}
              className="gap-2"
            >
              <StatusIndicator status={status} size="sm" />
              <span>{currentStatusOption.label}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
