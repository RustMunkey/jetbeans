import type {
	ActionHandler,
	WebhookSendConfig,
	SlackSendMessageConfig,
	ActionResult,
} from "../types"
import { resolveConfigVariables } from "../variable-resolver"

/**
 * Send a webhook to an external URL
 */
export const handleWebhookSend: ActionHandler<WebhookSendConfig> = async (
	config,
	context
): Promise<ActionResult> => {
	const resolved = resolveConfigVariables(config, context)
	const { url, method = "POST", headers = {}, body = {} } = resolved

	if (!url) {
		return { success: false, error: "Webhook URL is required" }
	}

	try {
		const requestHeaders: Record<string, string> = {
			"Content-Type": "application/json",
			"User-Agent": "JetBeans-Workflow/1.0",
			"X-Workflow-ID": context.workflowId,
			"X-Workflow-Run-ID": context.workflowRunId,
			...(headers as Record<string, string>),
		}

		const requestBody =
			method !== "GET" && method !== "DELETE"
				? JSON.stringify({
						...body,
						_workflow: {
							id: context.workflowId,
							runId: context.workflowRunId,
							trigger: context.trigger,
						},
					})
				: undefined

		const startTime = Date.now()

		const response = await fetch(url, {
			method,
			headers: requestHeaders,
			body: requestBody,
		})

		const duration = Date.now() - startTime
		const responseText = await response.text()

		// Try to parse as JSON
		let responseData: unknown
		try {
			responseData = JSON.parse(responseText)
		} catch {
			responseData = responseText
		}

		if (!response.ok) {
			return {
				success: false,
				error: `Webhook returned ${response.status}: ${responseText.slice(0, 200)}`,
				output: {
					url,
					method,
					statusCode: response.status,
					duration,
					response: responseData,
				},
			}
		}

		return {
			success: true,
			output: {
				url,
				method,
				statusCode: response.status,
				duration,
				response: responseData,
			},
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to send webhook",
		}
	}
}

/**
 * Send a message to Slack via incoming webhook
 */
export const handleSlackSendMessage: ActionHandler<SlackSendMessageConfig> = async (
	config,
	context
): Promise<ActionResult> => {
	const resolved = resolveConfigVariables(config, context)
	const { webhookUrl, message, channel, username, iconEmoji } = resolved

	if (!webhookUrl) {
		return { success: false, error: "Slack webhook URL is required" }
	}

	if (!message) {
		return { success: false, error: "Message is required" }
	}

	try {
		const payload: Record<string, unknown> = {
			text: message,
		}

		// Optional fields
		if (channel) payload.channel = channel
		if (username) payload.username = username
		if (iconEmoji) payload.icon_emoji = iconEmoji

		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		})

		const responseText = await response.text()

		// Slack returns "ok" on success
		if (response.ok && responseText === "ok") {
			return {
				success: true,
				output: {
					channel: channel || "default",
					message,
				},
			}
		}

		return {
			success: false,
			error: `Slack webhook failed: ${responseText}`,
			output: {
				statusCode: response.status,
				response: responseText,
			},
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to send Slack message",
		}
	}
}
