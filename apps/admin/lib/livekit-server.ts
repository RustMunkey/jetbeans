import { AccessToken } from "livekit-server-sdk"
import { env } from "@/env"

export function isLiveKitConfigured(): boolean {
	return !!(env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET && env.LIVEKIT_URL)
}

export async function createLiveKitToken(
	roomName: string,
	participantName: string,
	participantIdentity: string
): Promise<string | null> {
	if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
		return null
	}

	const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
		identity: participantIdentity,
		name: participantName,
		ttl: "2h", // Token valid for 2 hours
	})

	token.addGrant({
		room: roomName,
		roomJoin: true,
		canPublish: true,
		canSubscribe: true,
		canPublishData: true,
	})

	return await token.toJwt()
}

export function getLiveKitUrl(): string | null {
	return env.LIVEKIT_URL || null
}
