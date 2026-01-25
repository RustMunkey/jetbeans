import { inngest } from "./inngest"

// Order confirmation email
export const sendOrderConfirmation = inngest.createFunction(
	{ id: "send-order-confirmation" },
	{ event: "order/created" },
	async ({ event, step }) => {
		const { orderId, customerEmail, orderNumber } = event.data

		await step.run("send-email", async () => {
			// TODO: Send email via Resend when configured
			console.log(`Sending order confirmation to ${customerEmail} for order ${orderNumber}`)
		})

		return { success: true, orderId }
	}
)

// Low stock alert
export const sendLowStockAlert = inngest.createFunction(
	{ id: "send-low-stock-alert" },
	{ event: "inventory/low-stock" },
	async ({ event, step }) => {
		const { productId, productName, currentStock, threshold } = event.data

		await step.run("notify-team", async () => {
			// TODO: Send Pusher notification to admin team
			console.log(`Low stock alert: ${productName} has ${currentStock} units (threshold: ${threshold})`)
		})

		return { success: true, productId }
	}
)

// Subscription renewal reminder
export const sendSubscriptionReminder = inngest.createFunction(
	{ id: "send-subscription-reminder" },
	{ event: "subscription/renewal-upcoming" },
	async ({ event, step }) => {
		const { subscriptionId, customerEmail, renewalDate } = event.data

		await step.run("send-reminder", async () => {
			// TODO: Send email via Resend when configured
			console.log(`Sending subscription renewal reminder to ${customerEmail} for ${renewalDate}`)
		})

		return { success: true, subscriptionId }
	}
)

// Process subscription renewal
export const processSubscriptionRenewal = inngest.createFunction(
	{ id: "process-subscription-renewal" },
	{ event: "subscription/renew" },
	async ({ event, step }) => {
		const { subscriptionId } = event.data

		const result = await step.run("charge-customer", async () => {
			// TODO: Process payment via Polar
			console.log(`Processing renewal for subscription ${subscriptionId}`)
			return { charged: true }
		})

		if (result.charged) {
			await step.run("create-order", async () => {
				// TODO: Create new order from subscription
				console.log(`Creating order for subscription ${subscriptionId}`)
			})
		}

		return { success: true, subscriptionId }
	}
)

// Scheduled: Check for expiring subscriptions daily
export const checkExpiringSubscriptions = inngest.createFunction(
	{ id: "check-expiring-subscriptions" },
	{ cron: "0 9 * * *" }, // Every day at 9 AM
	async ({ step }) => {
		await step.run("find-expiring", async () => {
			// TODO: Query subscriptions expiring in 3 days
			console.log("Checking for expiring subscriptions...")
		})

		return { success: true }
	}
)

// Scheduled: Generate daily sales report
export const generateDailySalesReport = inngest.createFunction(
	{ id: "generate-daily-sales-report" },
	{ cron: "0 0 * * *" }, // Every day at midnight
	async ({ step }) => {
		await step.run("generate-report", async () => {
			// TODO: Aggregate daily sales and send report
			console.log("Generating daily sales report...")
		})

		return { success: true }
	}
)

// All functions to register with the serve handler
export const inngestFunctions = [
	sendOrderConfirmation,
	sendLowStockAlert,
	sendSubscriptionReminder,
	processSubscriptionRenewal,
	checkExpiringSubscriptions,
	generateDailySalesReport,
]
