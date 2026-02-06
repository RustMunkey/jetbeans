// Shared types and constants for API keys
// This file can be imported by both client and server components

export type ApiKeyPermissions = {
	// Read permissions
	readProducts?: boolean
	readOrders?: boolean
	readCustomers?: boolean
	readInventory?: boolean
	readWebhooks?: boolean
	readAnalytics?: boolean

	// Write permissions
	writeProducts?: boolean
	writeOrders?: boolean
	writeCustomers?: boolean
	writeInventory?: boolean
	writeWebhooks?: boolean

	// Full access (overrides individual permissions)
	fullAccess?: boolean
}

export const DEFAULT_API_KEY_PERMISSIONS: ApiKeyPermissions = {
	readProducts: true,
	readOrders: true,
	readCustomers: true,
	readInventory: true,
	readWebhooks: true,
	readAnalytics: true,
	writeProducts: false,
	writeOrders: false,
	writeCustomers: false,
	writeInventory: false,
	writeWebhooks: false,
	fullAccess: false,
}
