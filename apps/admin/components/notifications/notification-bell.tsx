"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	Notification01Icon,
	ShoppingBag01Icon,
	Package01Icon,
	CreditCardIcon,
	DeliveryTruck01Icon,
	UserGroupIcon,
	Settings02Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { useLiveNotifications, type Notification } from "@/hooks/use-live-notifications"
import { cn } from "@/lib/utils"

const typeIcons: Record<string, typeof ShoppingBag01Icon> = {
	order: ShoppingBag01Icon,
	inventory: Package01Icon,
	payment: CreditCardIcon,
	shipment: DeliveryTruck01Icon,
	collaboration: UserGroupIcon,
	system: Settings02Icon,
}

function formatCount(count: number): string {
	if (count < 1000) return String(count)
	if (count < 1000000) return `${Math.floor(count / 1000)}K+`
	return `${Math.floor(count / 1000000)}M+`
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

interface NotificationItemProps {
	notification: Notification
	onClick?: () => void
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
	const Icon = typeIcons[notification.type] || Notification01Icon
	const isUnread = !notification.readAt

	return (
		<div
			className={cn(
				"flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors",
				isUnread && "bg-primary/5"
			)}
			onClick={onClick}
		>
			<div
				className={cn(
					"flex items-center justify-center size-8 rounded-full shrink-0",
					isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
				)}
			>
				<HugeiconsIcon icon={Icon} size={16} />
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<span className="text-xs font-medium truncate">{notification.title}</span>
					<span className="text-[10px] text-muted-foreground shrink-0">
						{timeAgo(notification.createdAt)}
					</span>
					{isUnread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
				</div>
				{notification.body && (
					<p className="text-xs text-muted-foreground truncate mt-0.5">
						{notification.body}
					</p>
				)}
			</div>
		</div>
	)
}

interface NotificationBellProps {
	userId: string
	onOpenSidebar?: () => void
}

export function NotificationBell({ userId, onOpenSidebar }: NotificationBellProps) {
	const {
		unreadCount,
		hasUnread,
	} = useLiveNotifications({ userId })

	return (
		<Button
			variant="ghost"
			size="icon"
			className="relative size-8"
			onClick={onOpenSidebar}
			title="Notifications"
		>
			<HugeiconsIcon icon={Notification01Icon} size={16} />
			{hasUnread && (
				<span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
					{formatCount(unreadCount)}
				</span>
			)}
			<span className="sr-only">Notifications</span>
		</Button>
	)
}
