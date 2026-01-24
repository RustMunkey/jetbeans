import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"

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

	if (channel.startsWith("private-user-")) {
		const channelUserId = channel.replace("private-user-", "")
		if (channelUserId !== session.user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 })
		}
	}

	if (channel.startsWith("presence-")) {
		const presenceData = {
			user_id: session.user.id,
			user_info: { name: session.user.name, image: session.user.image },
		}
		const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData)
		return NextResponse.json(authResponse)
	}

	const authResponse = pusherServer.authorizeChannel(socketId, channel)
	return NextResponse.json(authResponse)
}
