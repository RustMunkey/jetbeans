import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@jetbeans/db/client"
import { eq } from "@jetbeans/db/drizzle"
import { users } from "@jetbeans/db/schema"
import { AppSidebar } from "@/components/app-sidebar"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { BreadcrumbProvider } from "@/components/breadcrumb-context"
import { CommandMenuWrapper } from "@/components/command-menu-wrapper"
import { HeaderToolbar } from "@/components/header-toolbar"
import { PusherProvider } from "@/components/pusher-provider"
import { CallProvider, IncomingCallModal, CallInterface } from "@/components/calls"
import { MusicPlayerProvider, MusicPlayerLoader } from "@/components/music-player"
import { ToolbarProvider, ToolbarPanel, WidgetPanels } from "@/components/toolbar"
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts"
import { SidebarModeProvider } from "@/lib/sidebar-mode"
import { ChatProvider } from "@/components/messages"
import { ServersSidebarWrapper, ServersBarLayout } from "@/components/servers-sidebar-wrapper"
import { SidebarSwipe } from "@/components/sidebar-swipe"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ConditionalSidebarTrigger } from "@/components/conditional-sidebar-trigger"
import { RightSidebarProvider } from "@/components/ui/right-sidebar"
import { AppRightSidebar } from "@/components/app-right-sidebar"
import { NotificationProvider } from "@/components/notifications/notification-context"
import { UserStatusProvider } from "@/components/user-status-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  // Get fresh user data from database (not session cache)
  let user: { role: string | null; name: string | null; image: string | null } | undefined
  try {
    const [dbUser] = await db
      .select({
        role: users.role,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
    user = dbUser
  } catch {
    // Database query failed - fall back to session data
    user = undefined
  }

  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false"
  const rightSidebarOpen = cookieStore.get("right_sidebar_state")?.value !== "false"

  return (
    <PusherProvider
      pusherKey={process.env.NEXT_PUBLIC_PUSHER_KEY}
      pusherCluster={process.env.NEXT_PUBLIC_PUSHER_CLUSTER}
    >
      <UserStatusProvider>
      <CallProvider
        userId={session.user.id}
        userName={user?.name || session.user.name || "User"}
        userImage={user?.image || null}
      >
        <MusicPlayerProvider>
          <ToolbarProvider>
            <ChatProvider>
              <SidebarModeProvider>
                <ServersSidebarWrapper />
                <ServersBarLayout>
                <NotificationProvider userId={session.user.id}>
                <SidebarProvider defaultOpen={sidebarOpen}>
                <RightSidebarProvider defaultOpen={rightSidebarOpen}>
                  <CommandMenuWrapper />
                  <KeyboardShortcutsProvider>
                    <AppSidebar user={{
                      name: user?.name || session.user.name,
                      email: session.user.email,
                      avatar: user?.image || "",
                      role: user?.role || "member",
                    }} />
                    <SidebarSwipe />
                    <SidebarInset className="md:flex md:flex-col">
                      <BreadcrumbProvider>
                        <header className="flex h-16 shrink-0 items-center justify-between gap-2">
                          <div className="flex items-center gap-2 px-4 min-w-0">
                            <ConditionalSidebarTrigger className="-ml-1 shrink-0" />
                            <Separator
                              orientation="vertical"
                              className="mr-2 shrink-0 data-[orientation=vertical]:h-4"
                            />
                            <div className="min-w-0 overflow-x-auto sm:overflow-hidden [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
                              <BreadcrumbNav />
                            </div>
                          </div>
                          <HeaderToolbar />
                        </header>
                        {children}
                      </BreadcrumbProvider>
                    </SidebarInset>
                    <AppRightSidebar />
                    {/* Toolbar Panel - needs RightSidebarProvider */}
                    <ToolbarPanel />
                    <WidgetPanels />
                  </KeyboardShortcutsProvider>
                </RightSidebarProvider>
              </SidebarProvider>
              </NotificationProvider>
              </ServersBarLayout>
              </SidebarModeProvider>
            </ChatProvider>

            {/* Music Player - loads user tracks */}
            <MusicPlayerLoader />
          </ToolbarProvider>

          {/* Call UI overlays */}
          <IncomingCallModal />
          <CallInterface />
        </MusicPlayerProvider>
      </CallProvider>
      </UserStatusProvider>
    </PusherProvider>
  )
}
