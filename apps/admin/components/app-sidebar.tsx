"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AnalyticsUpIcon,
  UnfoldMoreIcon,
  Audit01Icon,
  DashboardSquare01Icon,
  DeliveryBox01Icon,
  DeliveryTracking01Icon,
  DeliveryTruck01Icon,
  Megaphone01Icon,
  News01Icon,
  Notification01Icon,
  Package01Icon,
  RepeatIcon,
  Search01Icon,
  Settings02Icon,
  ShoppingBag01Icon,
  StarIcon,
  UserGroupIcon,
  SourceCodeIcon,
  UserIcon,
  Building03Icon,
  SaleTag01Icon,
  ChartLineData01Icon,
  CheckListIcon,
  Call02Icon,
  ArrowLeft01Icon,
  WorkflowSquare10Icon,
} from "@hugeicons/core-free-icons"

import Link from "next/link"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useCommandMenu } from "@/components/command-menu"
import { useSidebarStateProvider, SidebarStateContext } from "@/lib/use-sidebar-state"
import { useSidebarMode } from "@/lib/sidebar-mode"
import { ChatSidebar, useChat } from "@/components/messages"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navOverview: [
    {
      title: "Dashboard",
      url: "/",
      icon: DashboardSquare01Icon,
      isActive: true,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: AnalyticsUpIcon,
      items: [
        { title: "Overview", url: "/analytics" },
        { title: "Sales Reports", url: "/analytics/sales" },
        { title: "Subscriptions", url: "/analytics/subscriptions" },
        { title: "Traffic", url: "/analytics/traffic" },
        { title: "Customer Insights", url: "/analytics/customers" },
      ],
    },
  ],
  navStore: [
    {
      title: "Orders",
      url: "/orders",
      icon: ShoppingBag01Icon,
      items: [
        { title: "All Orders", url: "/orders" },
        { title: "Returns & Refunds", url: "/orders/returns" },
        { title: "Fulfillment", url: "/orders/fulfillment" },
      ],
    },
    {
      title: "Products",
      url: "/products",
      icon: Package01Icon,
      items: [
        { title: "All Products", url: "/products" },
        { title: "Categories", url: "/products/categories" },
        { title: "Variants", url: "/products/variants" },
      ],
    },
    {
      title: "Reviews",
      url: "/reviews",
      icon: StarIcon,
      items: [
        { title: "All Reviews", url: "/reviews" },
        { title: "Pending", url: "/reviews/pending" },
        { title: "Reported", url: "/reviews/reported" },
      ],
    },
    {
      title: "Customers",
      url: "/customers",
      icon: UserGroupIcon,
      items: [
        { title: "All Customers", url: "/customers" },
        { title: "Segments", url: "/customers/segments" },
        { title: "Loyalty & Rewards", url: "/customers/loyalty" },
        { title: "Gift Cards", url: "/customers/gift-cards" },
      ],
    },
  ],
  navSales: [
    {
      title: "Contacts",
      url: "/sales/contacts",
      icon: UserIcon,
    },
    {
      title: "Companies",
      url: "/sales/companies",
      icon: Building03Icon,
    },
    {
      title: "Deals",
      url: "/sales/deals",
      icon: SaleTag01Icon,
    },
    {
      title: "Pipeline",
      url: "/sales/pipeline",
      icon: ChartLineData01Icon,
    },
    {
      title: "Tasks",
      url: "/sales/tasks",
      icon: CheckListIcon,
    },
    {
      title: "Calls",
      url: "/sales/calls",
      icon: Call02Icon,
    },
  ],
  navOperations: [
    {
      title: "Inventory",
      url: "/inventory",
      icon: DeliveryBox01Icon,
      items: [
        { title: "Stock Levels", url: "/inventory" },
        { title: "Alerts", url: "/inventory/alerts" },
        { title: "Activity Log", url: "/inventory/activity" },
      ],
    },
    {
      title: "Subscriptions",
      url: "/subscriptions",
      icon: RepeatIcon,
      items: [
        { title: "Active", url: "/subscriptions" },
        { title: "Paused", url: "/subscriptions/paused" },
        { title: "Canceled", url: "/subscriptions/canceled" },
        { title: "Dunning", url: "/subscriptions/dunning" },
      ],
    },
    {
      title: "Shipping",
      url: "/shipping",
      icon: DeliveryTracking01Icon,
      items: [
        { title: "Carriers & Rates", url: "/shipping" },
        { title: "Zones", url: "/shipping/zones" },
        { title: "Labels", url: "/shipping/labels" },
        { title: "Tracking", url: "/shipping/tracking" },
        { title: "Pending Review", url: "/shipping/tracking/pending" },
      ],
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: DeliveryTruck01Icon,
      items: [
        { title: "All Suppliers", url: "/suppliers" },
        { title: "Purchase Orders", url: "/suppliers/purchase-orders" },
      ],
    },
    {
      title: "Automation",
      url: "/automation",
      icon: WorkflowSquare10Icon,
      items: [
        { title: "Workflows", url: "/automation" },
        { title: "Triggers", url: "/automation/triggers" },
        { title: "History", url: "/automation/history" },
      ],
    },
  ],
  navGrowth: [
    {
      title: "Marketing",
      url: "/marketing",
      icon: Megaphone01Icon,
      items: [
        { title: "Discounts & Coupons", url: "/marketing" },
        { title: "Campaigns", url: "/marketing/campaigns" },
        { title: "Referrals", url: "/marketing/referrals" },
        { title: "SEO", url: "/marketing/seo" },
      ],
    },
    {
      title: "Content",
      url: "/content",
      icon: News01Icon,
      items: [
        { title: "Blog Posts", url: "/content" },
        { title: "Pages", url: "/content/pages" },
        { title: "Media Library", url: "/content/media" },
      ],
    },
  ],
  navSystem: [
    {
      title: "Notifications",
      url: "/notifications",
      icon: Notification01Icon,
      items: [
        { title: "Email Templates", url: "/notifications" },
        { title: "Messages", url: "/notifications/messages" },
        { title: "Calls", url: "/calls" },
        { title: "Alerts", url: "/notifications/alerts" },
      ],
    },
    {
      title: "Activity Log",
      url: "/activity-log",
      icon: Audit01Icon,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings02Icon,
      items: [
        { title: "All Settings", url: "/settings" },
        { title: "Team & Permissions", url: "/settings/team" },
        { title: "Sessions", url: "/settings/sessions" },
        { title: "Payments", url: "/settings/payments" },
        { title: "Tax", url: "/settings/tax" },
        { title: "Integrations", url: "/settings/integrations" },
      ],
    },
  ],
  navDevelopers: [
    {
      title: "Developer Tools",
      url: "/developers",
      icon: SourceCodeIcon,
      items: [
        { title: "Notes & Bugs", url: "/developers/notes" },
        { title: "Test Page", url: "/developers/test" },
      ],
    },
  ],
}

type UserData = {
  name: string
  email: string
  avatar: string
  role: string
}

function MessagesHeader({ exitMessagesMode }: { exitMessagesMode: () => void }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" onClick={exitMessagesMode} className="cursor-pointer" tooltip="Back to Dashboard">
          <div className="bg-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden">
            <img src="/logos/coffee-white.png" alt="JetBeans" className="size-5 dark:hidden" />
            <img src="/logos/coffee.png" alt="JetBeans" className="size-5 hidden dark:block" />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-medium text-sm">
              Back
            </span>
            <span className="truncate font-sans text-xs text-muted-foreground">
              Exit Messages
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NormalHeader({ openCommandMenu }: { openCommandMenu: () => void }) {
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href="/">
              <div className="bg-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                <img src="/logos/coffee-white.png" alt="JetBeans" className="size-5 dark:hidden" />
                <img src="/logos/coffee.png" alt="JetBeans" className="size-5 hidden dark:block" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-[family-name:var(--font-rubik-mono)] text-base">
                  JETBEANS
                </span>
                <span className="truncate font-sans text-xs text-muted-foreground">
                  Admin Panel
                </span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <button
        type="button"
        onClick={openCommandMenu}
        className="flex md:hidden h-8 w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent"
      >
        <HugeiconsIcon icon={Search01Icon} size={14} />
        <span className="flex-1 text-left">Search...</span>
      </button>
    </>
  )
}

function MessagesSidebarContent() {
  const chat = useChat()

  // Show loading state if chat data is not yet initialized
  if (!chat.isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <ChatSidebar
      active={chat.active}
      onSelect={chat.setActive}
      teamMembers={chat.teamMembers}
      userId={chat.userId}
      messages={chat.messages}
    />
  )
}

function NormalSidebarContent({
  navSystem,
  sidebarState
}: {
  navSystem: typeof data.navSystem
  sidebarState: ReturnType<typeof useSidebarStateProvider>
}) {
  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={sidebarState.collapseAll}>
              <span className="text-xs font-medium text-sidebar-foreground/70">Collapse All</span>
              <HugeiconsIcon icon={UnfoldMoreIcon} size={16} className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <NavMain label="Overview" items={data.navOverview} />
      <NavMain label="Store" items={data.navStore} />
      <NavMain label="Sales" items={data.navSales} />
      <NavMain label="Operations" items={data.navOperations} />
      <NavMain label="Growth" items={data.navGrowth} />
      <NavMain label="System" items={navSystem} />
      <NavMain label="Developers" items={data.navDevelopers} />
    </>
  )
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: UserData }) {
  const { open: openCommandMenu } = useCommandMenu()
  const sidebarState = useSidebarStateProvider()
  const { mode, exitMessagesMode } = useSidebarMode()
  // Messages mode is sticky - stays active until explicitly exited via back button
  const isMessagesMode = mode === "messages"

  // Filter out Integrations link for non-owners
  const navSystem = React.useMemo(() => {
    if (user.role === "owner") return data.navSystem
    return data.navSystem.map((item) => {
      if (item.title === "Settings" && item.items) {
        return {
          ...item,
          items: item.items.filter((sub) => sub.title !== "Integrations"),
        }
      }
      return item
    })
  }, [user.role])

  return (
    <SidebarStateContext.Provider value={sidebarState}>
      <Sidebar variant="inset" collapsible="icon" {...props}>
        <SidebarHeader>
          {isMessagesMode ? (
            <MessagesHeader exitMessagesMode={exitMessagesMode} />
          ) : (
            <NormalHeader openCommandMenu={openCommandMenu} />
          )}
        </SidebarHeader>
        <SidebarContent
          onScrollPosition={isMessagesMode ? undefined : sidebarState.setScrollPosition}
          initialScrollTop={isMessagesMode ? 0 : sidebarState.scrollPosition}
        >
          {isMessagesMode ? (
            <MessagesSidebarContent />
          ) : (
            <NormalSidebarContent navSystem={navSystem} sidebarState={sidebarState} />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
    </SidebarStateContext.Provider>
  )
}
