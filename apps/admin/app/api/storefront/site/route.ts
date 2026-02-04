import { type NextRequest } from "next/server"
import { db } from "@jetbeans/db/client"
import { eq } from "@jetbeans/db/drizzle"
import { storeSettings, workspaces } from "@jetbeans/db/schema"
import { withStorefrontAuth, handleCorsOptions, type StorefrontContext } from "@/lib/storefront-auth"

// Public settings that storefronts can access
const PUBLIC_SETTING_KEYS = [
	// General
	"store_name",
	"store_tagline",
	"store_description",
	"store_logo",
	"store_favicon",
	"store_email",
	"store_phone",
	"store_address",
	// Social
	"social_facebook",
	"social_instagram",
	"social_twitter",
	"social_tiktok",
	"social_youtube",
	// Appearance
	"primary_color",
	"secondary_color",
	"accent_color",
	// Features
	"currency",
	"currency_symbol",
	"tax_rate",
	"free_shipping_threshold",
	// Legal
	"terms_url",
	"privacy_url",
	"refund_policy_url",
	// SEO
	"seo_title",
	"seo_description",
	"seo_keywords",
]

async function handleGet(request: NextRequest, storefront: StorefrontContext) {
	// Get all public settings for this workspace
	const settings = await db
		.select({
			key: storeSettings.key,
			value: storeSettings.value,
		})
		.from(storeSettings)
		.where(eq(storeSettings.workspaceId, storefront.workspaceId))

	// Filter to only public keys and convert to object
	const settingsMap: Record<string, string | null> = {}
	for (const setting of settings) {
		if (PUBLIC_SETTING_KEYS.includes(setting.key)) {
			settingsMap[setting.key] = setting.value
		}
	}

	// Also get workspace info for defaults
	const [workspace] = await db
		.select({
			name: workspaces.name,
			logo: workspaces.logo,
			primaryColor: workspaces.primaryColor,
			description: workspaces.description,
		})
		.from(workspaces)
		.where(eq(workspaces.id, storefront.workspaceId))
		.limit(1)

	return Response.json({
		site: {
			// Defaults from workspace
			name: settingsMap.store_name || workspace?.name || storefront.name,
			tagline: settingsMap.store_tagline || null,
			description: settingsMap.store_description || workspace?.description || null,
			logo: settingsMap.store_logo || workspace?.logo || null,
			favicon: settingsMap.store_favicon || null,
			email: settingsMap.store_email || null,
			phone: settingsMap.store_phone || null,
			address: settingsMap.store_address || null,
			// Social
			social: {
				facebook: settingsMap.social_facebook || null,
				instagram: settingsMap.social_instagram || null,
				twitter: settingsMap.social_twitter || null,
				tiktok: settingsMap.social_tiktok || null,
				youtube: settingsMap.social_youtube || null,
			},
			// Appearance
			theme: {
				primaryColor: settingsMap.primary_color || workspace?.primaryColor || "#000000",
				secondaryColor: settingsMap.secondary_color || null,
				accentColor: settingsMap.accent_color || null,
			},
			// Features
			currency: settingsMap.currency || "USD",
			currencySymbol: settingsMap.currency_symbol || "$",
			taxRate: settingsMap.tax_rate ? parseFloat(settingsMap.tax_rate) : null,
			freeShippingThreshold: settingsMap.free_shipping_threshold
				? parseFloat(settingsMap.free_shipping_threshold)
				: null,
			// Legal
			legal: {
				termsUrl: settingsMap.terms_url || null,
				privacyUrl: settingsMap.privacy_url || null,
				refundPolicyUrl: settingsMap.refund_policy_url || null,
			},
			// SEO
			seo: {
				title: settingsMap.seo_title || null,
				description: settingsMap.seo_description || null,
				keywords: settingsMap.seo_keywords || null,
			},
		},
	})
}

export const GET = withStorefrontAuth(handleGet)
export const OPTIONS = handleCorsOptions
