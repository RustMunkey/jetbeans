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
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts"
import { SidebarSwipe } from "@/components/sidebar-swipe"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

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

  // Get user role for sidebar permissions
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <PusherProvider
      pusherKey={process.env.NEXT_PUBLIC_PUSHER_KEY}
      pusherCluster={process.env.NEXT_PUBLIC_PUSHER_CLUSTER}
    >
      <CallProvider
        userId={session.user.id}
        userName={session.user.name || "User"}
        userImage={session.user.image || null}
      >
        <SidebarProvider defaultOpen={sidebarOpen}>
          <CommandMenuWrapper />
          <KeyboardShortcutsProvider>
            <AppSidebar user={{
              name: session.user.name,
              email: session.user.email,
              avatar: session.user.image || "",
              role: user?.role || "member",
            }} />
            <SidebarSwipe />
            <SidebarInset className="md:flex md:flex-col">
              <BreadcrumbProvider>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2">
                  <div className="flex items-center gap-2 px-4 min-w-0">
                    <SidebarTrigger className="-ml-1 shrink-0" />
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
          </KeyboardShortcutsProvider>
        </SidebarProvider>

        {/* Call UI overlays */}
        <IncomingCallModal />
        <CallInterface />
      </CallProvider>
    </PusherProvider>
  )
}
