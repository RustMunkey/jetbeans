"use client"

import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { motion, AnimatePresence } from "framer-motion"
import { useSidebarState } from "@/lib/use-sidebar-state"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  label,
  items,
}: {
  label: string
  items: {
    title: string
    url: string
    icon: IconSvgElement
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { openItems, toggle } = useSidebarState()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isOpen = openItems.has(item.title)

          return (
            <SidebarMenuItem key={item.title}>
              {item.items?.length ? (
                <>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => toggle(item.title)}
                    data-state={isOpen ? "open" : "closed"}
                  >
                    <HugeiconsIcon icon={item.icon} size={16} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    className="data-[state=open]:rotate-90 transition-transform duration-200"
                    onClick={() => toggle(item.title)}
                    data-state={isOpen ? "open" : "closed"}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link href={subItem.url} onClick={() => isMobile && setOpenMobile(false)}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                    <HugeiconsIcon icon={item.icon} size={16} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
