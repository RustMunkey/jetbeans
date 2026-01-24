"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const pages = [
  { title: "Dashboard", url: "/" },
  { title: "Analytics", url: "/analytics" },
  { title: "Sales Reports", url: "/analytics/sales" },
  { title: "Traffic", url: "/analytics/traffic" },
  { title: "Customer Insights", url: "/analytics/customers" },
  { title: "Orders", url: "/orders" },
  { title: "Returns & Refunds", url: "/orders/returns" },
  { title: "Fulfillment", url: "/orders/fulfillment" },
  { title: "Products", url: "/products" },
  { title: "Categories", url: "/products/categories" },
  { title: "Variants", url: "/products/variants" },
  { title: "Reviews", url: "/reviews" },
  { title: "Pending Reviews", url: "/reviews/pending" },
  { title: "Reported Reviews", url: "/reviews/reported" },
  { title: "Customers", url: "/customers" },
  { title: "Segments", url: "/customers/segments" },
  { title: "Loyalty & Rewards", url: "/customers/loyalty" },
  { title: "Gift Cards", url: "/customers/gift-cards" },
  { title: "Inventory", url: "/inventory" },
  { title: "Inventory Alerts", url: "/inventory/alerts" },
  { title: "Activity Log", url: "/inventory/activity" },
  { title: "Subscriptions", url: "/subscriptions" },
  { title: "Paused Subscriptions", url: "/subscriptions/paused" },
  { title: "Canceled Subscriptions", url: "/subscriptions/canceled" },
  { title: "Dunning", url: "/subscriptions/dunning" },
  { title: "Shipping", url: "/shipping" },
  { title: "Zones", url: "/shipping/zones" },
  { title: "Labels", url: "/shipping/labels" },
  { title: "Tracking", url: "/shipping/tracking" },
  { title: "Suppliers", url: "/suppliers" },
  { title: "Purchase Orders", url: "/suppliers/purchase-orders" },
  { title: "Marketing", url: "/marketing" },
  { title: "Campaigns", url: "/marketing/campaigns" },
  { title: "Referrals", url: "/marketing/referrals" },
  { title: "SEO", url: "/marketing/seo" },
  { title: "Content", url: "/content" },
  { title: "Pages", url: "/content/pages" },
  { title: "Media Library", url: "/content/media" },
  { title: "Notifications", url: "/notifications" },
  { title: "Notification Alerts", url: "/notifications/alerts" },
  { title: "Activity Log", url: "/activity-log" },
  { title: "Settings", url: "/settings" },
  { title: "Team & Permissions", url: "/settings/team" },
  { title: "Payments", url: "/settings/payments" },
  { title: "Tax", url: "/settings/tax" },
  { title: "Integrations", url: "/settings/integrations" },
]

// Placeholder data — replace with real API calls later
const products: { title: string; url: string }[] = []
const orders: { title: string; url: string }[] = []
const customers: { title: string; url: string }[] = []

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    const openFromButton = () => setOpen(true)
    document.addEventListener("keydown", down)
    document.addEventListener("open-command-menu", openFromButton)
    return () => {
      document.removeEventListener("keydown", down)
      document.removeEventListener("open-command-menu", openFromButton)
    }
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, products, orders, customers..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {products.length > 0 && (
          <>
            <CommandGroup heading="Products">
              {products.map((item) => (
                <CommandItem
                  key={item.url}
                  onSelect={() => runCommand(() => router.push(item.url))}
                >
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        {orders.length > 0 && (
          <>
            <CommandGroup heading="Orders">
              {orders.map((item) => (
                <CommandItem
                  key={item.url}
                  onSelect={() => runCommand(() => router.push(item.url))}
                >
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        {customers.length > 0 && (
          <>
            <CommandGroup heading="Customers">
              {customers.map((item) => (
                <CommandItem
                  key={item.url}
                  onSelect={() => runCommand(() => router.push(item.url))}
                >
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.url}
              onSelect={() => runCommand(() => router.push(page.url))}
            >
              {page.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/products?new=true"))}
          >
            Create Product
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/orders?new=true"))}
          >
            Create Order
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/customers?new=true"))}
          >
            Create Customer
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => window.open("http://localhost:3000", "_blank"))
            }
          >
            View Store
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            Light Mode
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            Dark Mode
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            System Theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function useCommandMenu() {
  return {
    open: () => {
      document.dispatchEvent(new Event("open-command-menu"))
    },
  }
}
