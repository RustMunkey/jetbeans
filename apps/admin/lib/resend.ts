import { Resend } from "resend"

let resendInstance: Resend | null = null

export function getResend(): Resend | null {
	const apiKey = process.env.RESEND_API_KEY
	if (!apiKey) return null
	if (!resendInstance) {
		resendInstance = new Resend(apiKey)
	}
	return resendInstance
}
