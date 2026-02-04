import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"

// Channels that all authenticated admins can access
const SHARED_PRIVATE_CHANNELS = [
	"private-orders",
	"private-inventory",
	"private-analytics",
	"private-products",
	"private-customers",
	"private-subscriptions",
	"private-inbox",
	"private-auctions",
]

export async function POST(request: Request) {
	if (!pusherServer) {
		return NextResponse.json({ error: "Pusher not configured" }, { status: 503 })
	}

	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const body = await request.formData()
	const socketId = body.get("socket_id") as string
	const channel = body.get("channel_name") as string

	// User-specific private channel - only the user can subscribe
	if (channel.startsWith("private-user-")) {
		const channelUserId = channel.replace("private-user-", "")
		if (channelUserId !== session.user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 })
		}
	}

	// Shared private channels - all admins can access
	if (SHARED_PRIVATE_CHANNELS.includes(channel)) {
		const authResponse = pusherServer.authorizeChannel(socketId, channel)
		return NextResponse.json(authResponse)
	}

	// Presence channels (presence-admin, presence-page-{type}-{id})
	if (channel.startsWith("presence-")) {
		const presenceData = {
			user_id: session.user.id,
			user_info: {
				name: session.user.name,
				image: session.user.image,
				role: session.user.role,
			},
		}
		const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData)
		return NextResponse.json(authResponse)
	}

	const authResponse = pusherServer.authorizeChannel(socketId, channel)
	return NextResponse.json(authResponse)
}
