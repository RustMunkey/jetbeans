export type TeamMessage = {
	id: string
	senderId: string
	senderName: string
	senderImage: string | null
	channel: string
	body: string
	createdAt: string
	readAt: string | null
}

export type TeamMember = {
	id: string
	name: string
	email: string
	image: string | null
}

export type Conversation = {
	type: "channel" | "dm"
	id: string
	label: string
}

export const CHANNELS = ["general", "urgent", "orders", "inventory"] as const
export type Channel = (typeof CHANNELS)[number]

export type InboxEmailReply = {
	id: string
	from: string
	body: string
	sentAt: string
}

export type InboxEmail = {
	id: string
	fromName: string
	fromEmail: string
	subject: string
	body: string
	receivedAt: string
	status: "unread" | "read" | "replied"
	replies: InboxEmailReply[]
}
