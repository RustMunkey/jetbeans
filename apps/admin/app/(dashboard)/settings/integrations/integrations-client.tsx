"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateSettings } from "../actions"

type Setting = {
	id: string
	key: string
	value: string | null
	group: string
}

function getVal(settings: Setting[], key: string): string {
	return settings.find((s) => s.key === key)?.value || ""
}

type IntegrationCardProps = {
	name: string
	description: string
	connected: boolean
	children: React.ReactNode
	onSave: () => Promise<void>
}

function IntegrationCard({ name, description, connected, children, onSave }: IntegrationCardProps) {
	const [expanded, setExpanded] = useState(false)
	const [saving, setSaving] = useState(false)

	async function handleSave() {
		setSaving(true)
		try {
			await onSave()
			toast.success(`${name} settings saved`)
		} catch {
			toast.error("Failed to save")
		} finally {
			setSaving(false)
		}
	}

	return (
		<Card className="py-2 gap-2 sm:py-6 sm:gap-6 rounded-lg sm:rounded-xl">
			<CardHeader className="px-3 sm:px-6">
				<div className="flex items-center justify-between gap-2 sm:gap-3">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-1.5">
							<CardTitle className="text-xs sm:text-sm font-medium truncate">{name}</CardTitle>
							<Badge variant={connected ? "default" : "secondary"} className="text-[9px] sm:text-[10px] px-1.5 py-0 shrink-0">
								{connected ? "Connected" : "Not Set"}
							</Badge>
						</div>
						<p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">{description}</p>
					</div>
					<Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2.5 sm:h-8 sm:px-3" onClick={() => setExpanded(!expanded)}>
						{expanded ? "Hide" : "Configure"}
					</Button>
				</div>
			</CardHeader>
			{expanded && (
				<CardContent className="space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4 px-3 sm:px-6">
					{children}
					<div className="flex justify-end">
						<Button size="sm" onClick={handleSave} disabled={saving}>
							{saving ? "Saving..." : "Save"}
						</Button>
					</div>
				</CardContent>
			)}
		</Card>
	)
}

export function IntegrationsClient({ settings }: { settings: Setting[] }) {
	// Neon
	const [neonDbUrl, setNeonDbUrl] = useState(getVal(settings, "neon_db_url"))

	// Redis / Upstash
	const [redisUrl, setRedisUrl] = useState(getVal(settings, "redis_url"))

	// Pusher
	const [pusherAppId, setPusherAppId] = useState(getVal(settings, "pusher_app_id"))
	const [pusherKey, setPusherKey] = useState(getVal(settings, "pusher_key"))
	const [pusherSecret, setPusherSecret] = useState(getVal(settings, "pusher_secret"))
	const [pusherCluster, setPusherCluster] = useState(getVal(settings, "pusher_cluster"))

	// Resend
	const [resendApiKey, setResendApiKey] = useState(getVal(settings, "resend_api_key"))
	const [resendFromEmail, setResendFromEmail] = useState(getVal(settings, "resend_from_email"))

	// Sentry
	const [sentryDsnAdmin, setSentryDsnAdmin] = useState(getVal(settings, "sentry_dsn_admin"))
	const [sentryDsnWeb, setSentryDsnWeb] = useState(getVal(settings, "sentry_dsn_web"))
	const [sentryOrg, setSentryOrg] = useState(getVal(settings, "sentry_org"))
	const [sentryProject, setSentryProject] = useState(getVal(settings, "sentry_project"))
	const [sentryAuthToken, setSentryAuthToken] = useState(getVal(settings, "sentry_auth_token"))

	// Inngest
	const [inngestEventKey, setInngestEventKey] = useState(getVal(settings, "inngest_event_key"))
	const [inngestSigningKey, setInngestSigningKey] = useState(getVal(settings, "inngest_signing_key"))

	// Vercel Blob
	const [blobToken, setBlobToken] = useState(getVal(settings, "blob_read_write_token"))

	// Polar
	const [polarAccessToken, setPolarAccessToken] = useState(getVal(settings, "polar_access_token"))
	const [polarWebhookSecret, setPolarWebhookSecret] = useState(getVal(settings, "polar_webhook_secret"))
	const [polarTestMode, setPolarTestMode] = useState(getVal(settings, "polar_test_mode") === "true")

	// PayPal
	const [paypalClientId, setPaypalClientId] = useState(getVal(settings, "paypal_client_id"))
	const [paypalClientSecret, setPaypalClientSecret] = useState(getVal(settings, "paypal_client_secret"))
	const [paypalTestMode, setPaypalTestMode] = useState(getVal(settings, "paypal_test_mode") === "true")

	// Reown
	const [reownProjectId, setReownProjectId] = useState(getVal(settings, "reown_project_id"))
	const [reownChains, setReownChains] = useState<string[]>(
		getVal(settings, "reown_chains") ? JSON.parse(getVal(settings, "reown_chains")) : ["btc", "eth", "sol", "usdc", "usdt", "bnb", "zec", "xrp"]
	)

	// Algolia
	const [algoliaAppId, setAlgoliaAppId] = useState(getVal(settings, "algolia_app_id"))
	const [algoliaSearchKey, setAlgoliaSearchKey] = useState(getVal(settings, "algolia_search_key"))
	const [algoliaAdminKey, setAlgoliaAdminKey] = useState(getVal(settings, "algolia_admin_key"))
	const [algoliaIndexName, setAlgoliaIndexName] = useState(getVal(settings, "algolia_index_name"))

	// EasyPost
	const [easypostApiKey, setEasypostApiKey] = useState(getVal(settings, "easypost_api_key"))
	const [easypostTestKey, setEasypostTestKey] = useState(getVal(settings, "easypost_test_key"))

	// Google Analytics
	const [gaMeasurementId, setGaMeasurementId] = useState(getVal(settings, "ga_measurement_id"))

	// Twilio
	const [twilioAccountSid, setTwilioAccountSid] = useState(getVal(settings, "twilio_account_sid"))
	const [twilioAuthToken, setTwilioAuthToken] = useState(getVal(settings, "twilio_auth_token"))
	const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(getVal(settings, "twilio_phone_number"))

	// PostHog
	const [posthogKey, setPosthogKey] = useState(getVal(settings, "posthog_key"))
	const [posthogHost, setPosthogHost] = useState(getVal(settings, "posthog_host"))

	// Cloudflare Turnstile
	const [turnstileSiteKey, setTurnstileSiteKey] = useState(getVal(settings, "turnstile_site_key"))
	const [turnstileSecretKey, setTurnstileSecretKey] = useState(getVal(settings, "turnstile_secret_key"))

	// Meta Pixel
	const [metaPixelId, setMetaPixelId] = useState(getVal(settings, "meta_pixel_id"))
	const [metaConversionsToken, setMetaConversionsToken] = useState(getVal(settings, "meta_conversions_token"))

	// Google OAuth
	const [googleClientId, setGoogleClientId] = useState(getVal(settings, "google_client_id"))
	const [googleClientSecret, setGoogleClientSecret] = useState(getVal(settings, "google_client_secret"))

	// Cloudinary
	const [cloudinaryCloudName, setCloudinaryCloudName] = useState(getVal(settings, "cloudinary_cloud_name"))
	const [cloudinaryApiKey, setCloudinaryApiKey] = useState(getVal(settings, "cloudinary_api_key"))
	const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState(getVal(settings, "cloudinary_api_secret"))

	// Google Maps
	const [googleMapsApiKey, setGoogleMapsApiKey] = useState(getVal(settings, "google_maps_api_key"))

	// Slack
	const [slackWebhookUrl, setSlackWebhookUrl] = useState(getVal(settings, "slack_webhook_url"))
	const [slackBotToken, setSlackBotToken] = useState(getVal(settings, "slack_bot_token"))
	const [slackChannel, setSlackChannel] = useState(getVal(settings, "slack_channel"))

	// OpenAI
	const [openaiApiKey, setOpenaiApiKey] = useState(getVal(settings, "openai_api_key"))
	const [openaiOrg, setOpenaiOrg] = useState(getVal(settings, "openai_org"))

	// TikTok Pixel
	const [tiktokPixelId, setTiktokPixelId] = useState(getVal(settings, "tiktok_pixel_id"))
	const [tiktokAccessToken, setTiktokAccessToken] = useState(getVal(settings, "tiktok_access_token"))

	// Crisp
	const [crispWebsiteId, setCrispWebsiteId] = useState(getVal(settings, "crisp_website_id"))

	// Klaviyo
	const [klaviyoApiKey, setKlaviyoApiKey] = useState(getVal(settings, "klaviyo_api_key"))
	const [klaviyoPublicKey, setKlaviyoPublicKey] = useState(getVal(settings, "klaviyo_public_key"))

	// Apple OAuth
	const [appleClientId, setAppleClientId] = useState(getVal(settings, "apple_client_id"))
	const [appleTeamId, setAppleTeamId] = useState(getVal(settings, "apple_team_id"))
	const [appleKeyId, setAppleKeyId] = useState(getVal(settings, "apple_key_id"))
	const [applePrivateKey, setApplePrivateKey] = useState(getVal(settings, "apple_private_key"))

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Integrations</h2>
				<p className="text-muted-foreground text-sm">Configure all third-party services powering the platform.</p>
			</div>

			<div className="space-y-4">
				{/* --- INFRASTRUCTURE --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Infrastructure</p>

				<IntegrationCard
					name="Neon"
					description="Serverless PostgreSQL database with branching and autoscaling."
					connected={!!neonDbUrl}
					onSave={() => updateSettings([
						{ key: "neon_db_url", value: neonDbUrl, group: "integrations" },
					])}
				>
					<div className="space-y-2">
						<Label>Database URL</Label>
						<Input
							type="password"
							value={neonDbUrl}
							onChange={(e) => setNeonDbUrl(e.target.value)}
							placeholder="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb"
						/>
						<p className="text-xs text-muted-foreground">
							Connection string from your Neon project dashboard. Also set as <code className="bg-muted px-1 py-0.5 rounded">DATABASE_URL</code> in environment.
						</p>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Redis / Upstash"
					description="Caching, rate limiting, and session storage."
					connected={!!redisUrl}
					onSave={() => updateSettings([
						{ key: "redis_url", value: redisUrl, group: "integrations" },
					])}
				>
					<div className="space-y-2">
						<Label>Redis URL</Label>
						<Input
							type="password"
							value={redisUrl}
							onChange={(e) => setRedisUrl(e.target.value)}
							placeholder="rediss://default:xxx@us1-xxx.upstash.io:6379"
						/>
						<p className="text-xs text-muted-foreground">
							Upstash Redis REST URL for production. Local Docker Redis for development.
						</p>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Vercel Blob"
					description="Object storage for product images, media uploads, and user avatars."
					connected={!!blobToken}
					onSave={() => updateSettings([
						{ key: "blob_read_write_token", value: blobToken, group: "integrations" },
					])}
				>
					<div className="space-y-2">
						<Label>Read/Write Token</Label>
						<Input
							type="password"
							value={blobToken}
							onChange={(e) => setBlobToken(e.target.value)}
							placeholder="vercel_blob_rw_..."
						/>
						<p className="text-xs text-muted-foreground">
							Generated in Vercel project settings under Storage → Blob. Also set as <code className="bg-muted px-1 py-0.5 rounded">BLOB_READ_WRITE_TOKEN</code> in environment.
						</p>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Cloudinary"
					description="Image and video CDN with on-the-fly resizing, format conversion, and optimization for product photos."
					connected={!!cloudinaryCloudName && !!cloudinaryApiKey}
					onSave={() => updateSettings([
						{ key: "cloudinary_cloud_name", value: cloudinaryCloudName, group: "integrations" },
						{ key: "cloudinary_api_key", value: cloudinaryApiKey, group: "integrations" },
						{ key: "cloudinary_api_secret", value: cloudinaryApiSecret, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>Cloud Name</Label>
							<Input
								value={cloudinaryCloudName}
								onChange={(e) => setCloudinaryCloudName(e.target.value)}
								placeholder="your-cloud-name"
							/>
						</div>
						<div className="space-y-2">
							<Label>API Key</Label>
							<Input
								value={cloudinaryApiKey}
								onChange={(e) => setCloudinaryApiKey(e.target.value)}
								placeholder="123456789012345"
							/>
						</div>
						<div className="space-y-2">
							<Label>API Secret</Label>
							<Input
								type="password"
								value={cloudinaryApiSecret}
								onChange={(e) => setCloudinaryApiSecret(e.target.value)}
							/>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						Used for product image optimization on the storefront. Transformations are applied via URL parameters.
					</p>
				</IntegrationCard>

				{/* --- REAL-TIME & MESSAGING --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Real-Time & Messaging</p>

				<IntegrationCard
					name="Pusher"
					description="WebSocket channels for real-time team messages, live dashboard updates, and inventory alerts."
					connected={!!pusherAppId && !!pusherKey}
					onSave={() => updateSettings([
						{ key: "pusher_app_id", value: pusherAppId, group: "integrations" },
						{ key: "pusher_key", value: pusherKey, group: "integrations" },
						{ key: "pusher_secret", value: pusherSecret, group: "integrations" },
						{ key: "pusher_cluster", value: pusherCluster, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>App ID</Label>
							<Input value={pusherAppId} onChange={(e) => setPusherAppId(e.target.value)} placeholder="1234567" />
						</div>
						<div className="space-y-2">
							<Label>Key</Label>
							<Input value={pusherKey} onChange={(e) => setPusherKey(e.target.value)} placeholder="abc123def456" />
						</div>
						<div className="space-y-2">
							<Label>Secret</Label>
							<Input type="password" value={pusherSecret} onChange={(e) => setPusherSecret(e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label>Cluster</Label>
							<Input value={pusherCluster} onChange={(e) => setPusherCluster(e.target.value)} placeholder="us2" />
						</div>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Resend"
					description="Transactional email delivery for order confirmations, password resets, shipping updates, and team invites."
					connected={!!resendApiKey}
					onSave={() => updateSettings([
						{ key: "resend_api_key", value: resendApiKey, group: "integrations" },
						{ key: "resend_from_email", value: resendFromEmail, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>API Key</Label>
							<Input
								type="password"
								value={resendApiKey}
								onChange={(e) => setResendApiKey(e.target.value)}
								placeholder="re_..."
							/>
						</div>
						<div className="space-y-2">
							<Label>From Email</Label>
							<Input
								value={resendFromEmail}
								onChange={(e) => setResendFromEmail(e.target.value)}
								placeholder="noreply@jetbeans.cafe"
							/>
							<p className="text-xs text-muted-foreground">Must be a verified domain in Resend.</p>
						</div>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Klaviyo"
					description="Email marketing automation for abandoned cart flows, product recommendations, win-back campaigns, and post-purchase sequences."
					connected={!!klaviyoApiKey}
					onSave={() => updateSettings([
						{ key: "klaviyo_api_key", value: klaviyoApiKey, group: "integrations" },
						{ key: "klaviyo_public_key", value: klaviyoPublicKey, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Private API Key</Label>
							<Input
								type="password"
								value={klaviyoApiKey}
								onChange={(e) => setKlaviyoApiKey(e.target.value)}
								placeholder="pk_..."
							/>
							<p className="text-xs text-muted-foreground">Server-side key for syncing customer and order data.</p>
						</div>
						<div className="space-y-2">
							<Label>Public API Key / Site ID</Label>
							<Input
								value={klaviyoPublicKey}
								onChange={(e) => setKlaviyoPublicKey(e.target.value)}
								placeholder="AbCdEf"
							/>
							<p className="text-xs text-muted-foreground">Client-side key for on-site tracking and signup forms.</p>
						</div>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Twilio"
					description="SMS notifications for order confirmations, shipping updates, and delivery alerts."
					connected={!!twilioAccountSid && !!twilioAuthToken}
					onSave={() => updateSettings([
						{ key: "twilio_account_sid", value: twilioAccountSid, group: "integrations" },
						{ key: "twilio_auth_token", value: twilioAuthToken, group: "integrations" },
						{ key: "twilio_phone_number", value: twilioPhoneNumber, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>Account SID</Label>
							<Input
								value={twilioAccountSid}
								onChange={(e) => setTwilioAccountSid(e.target.value)}
								placeholder="AC..."
							/>
						</div>
						<div className="space-y-2">
							<Label>Auth Token</Label>
							<Input
								type="password"
								value={twilioAuthToken}
								onChange={(e) => setTwilioAuthToken(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Phone Number</Label>
							<Input
								value={twilioPhoneNumber}
								onChange={(e) => setTwilioPhoneNumber(e.target.value)}
								placeholder="+1..."
							/>
							<p className="text-xs text-muted-foreground">Your Twilio phone number for sending SMS.</p>
						</div>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Slack"
					description="Webhook notifications for new orders, low stock alerts, refund requests, and team activity."
					connected={!!slackWebhookUrl || !!slackBotToken}
					onSave={() => updateSettings([
						{ key: "slack_webhook_url", value: slackWebhookUrl, group: "integrations" },
						{ key: "slack_bot_token", value: slackBotToken, group: "integrations" },
						{ key: "slack_channel", value: slackChannel, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2 sm:col-span-2">
							<Label>Incoming Webhook URL</Label>
							<Input
								type="password"
								value={slackWebhookUrl}
								onChange={(e) => setSlackWebhookUrl(e.target.value)}
								placeholder="https://hooks.slack.com/services/T.../B.../..."
							/>
							<p className="text-xs text-muted-foreground">Create via Slack App → Incoming Webhooks. Quick setup for order alerts.</p>
						</div>
						<div className="space-y-2">
							<Label>Bot Token (optional)</Label>
							<Input
								type="password"
								value={slackBotToken}
								onChange={(e) => setSlackBotToken(e.target.value)}
								placeholder="xoxb-..."
							/>
							<p className="text-xs text-muted-foreground">For richer interactions like threaded order updates.</p>
						</div>
						<div className="space-y-2">
							<Label>Default Channel</Label>
							<Input
								value={slackChannel}
								onChange={(e) => setSlackChannel(e.target.value)}
								placeholder="#orders"
							/>
						</div>
					</div>
				</IntegrationCard>

				{/* --- SEARCH --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Search</p>

				<IntegrationCard
					name="Algolia"
					description="Lightning-fast product search, filtering, and discovery for the storefront."
					connected={!!algoliaAppId && !!algoliaSearchKey}
					onSave={() => updateSettings([
						{ key: "algolia_app_id", value: algoliaAppId, group: "integrations" },
						{ key: "algolia_search_key", value: algoliaSearchKey, group: "integrations" },
						{ key: "algolia_admin_key", value: algoliaAdminKey, group: "integrations" },
						{ key: "algolia_index_name", value: algoliaIndexName, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Application ID</Label>
							<Input
								value={algoliaAppId}
								onChange={(e) => setAlgoliaAppId(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Search-Only API Key</Label>
							<Input
								value={algoliaSearchKey}
								onChange={(e) => setAlgoliaSearchKey(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Public key used by the storefront.</p>
						</div>
						<div className="space-y-2">
							<Label>Admin API Key</Label>
							<Input
								type="password"
								value={algoliaAdminKey}
								onChange={(e) => setAlgoliaAdminKey(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Private key for indexing products from admin.</p>
						</div>
						<div className="space-y-2">
							<Label>Index Name</Label>
							<Input
								value={algoliaIndexName}
								onChange={(e) => setAlgoliaIndexName(e.target.value)}
								placeholder="jetbeans_products"
							/>
						</div>
					</div>
				</IntegrationCard>

				{/* --- SHIPPING --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Shipping</p>

				<IntegrationCard
					name="EasyPost"
					description="Shipping rates, label generation, and package tracking across Canada Post, FedEx, UPS, and Purolator."
					connected={!!easypostApiKey}
					onSave={() => updateSettings([
						{ key: "easypost_api_key", value: easypostApiKey, group: "integrations" },
						{ key: "easypost_test_key", value: easypostTestKey, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Production API Key</Label>
							<Input
								type="password"
								value={easypostApiKey}
								onChange={(e) => setEasypostApiKey(e.target.value)}
								placeholder="EZ..."
							/>
						</div>
						<div className="space-y-2">
							<Label>Test API Key</Label>
							<Input
								type="password"
								value={easypostTestKey}
								onChange={(e) => setEasypostTestKey(e.target.value)}
								placeholder="EZ..."
							/>
							<p className="text-xs text-muted-foreground">Use test key during development for free label generation.</p>
						</div>
					</div>
				</IntegrationCard>

				{/* --- BACKGROUND JOBS --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Background Jobs</p>

				<IntegrationCard
					name="Inngest"
					description="Event-driven background jobs for order processing, subscription renewals, email sequences, and inventory sync."
					connected={!!inngestEventKey && !!inngestSigningKey}
					onSave={() => updateSettings([
						{ key: "inngest_event_key", value: inngestEventKey, group: "integrations" },
						{ key: "inngest_signing_key", value: inngestSigningKey, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Event Key</Label>
							<Input
								type="password"
								value={inngestEventKey}
								onChange={(e) => setInngestEventKey(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Used to send events from your app.</p>
						</div>
						<div className="space-y-2">
							<Label>Signing Key</Label>
							<Input
								type="password"
								value={inngestSigningKey}
								onChange={(e) => setInngestSigningKey(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Used to verify webhook requests from Inngest.</p>
						</div>
					</div>
				</IntegrationCard>

				{/* --- PAYMENTS --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Payments</p>

				<IntegrationCard
					name="Polar"
					description="Fiat payment processing for one-time orders, subscriptions, and tax-inclusive checkout."
					connected={!!polarAccessToken}
					onSave={() => updateSettings([
						{ key: "polar_access_token", value: polarAccessToken, group: "integrations" },
						{ key: "polar_webhook_secret", value: polarWebhookSecret, group: "integrations" },
						{ key: "polar_test_mode", value: polarTestMode ? "true" : "false", group: "integrations" },
					])}
				>
					<div className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Access Token</Label>
								<Input
									type="password"
									value={polarAccessToken}
									onChange={(e) => setPolarAccessToken(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>Webhook Secret</Label>
								<Input
									type="password"
									value={polarWebhookSecret}
									onChange={(e) => setPolarWebhookSecret(e.target.value)}
								/>
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<Label>Test Mode</Label>
								<p className="text-xs text-muted-foreground">Sandbox transactions only</p>
							</div>
							<Switch checked={polarTestMode} onCheckedChange={setPolarTestMode} />
						</div>
						<p className="text-xs text-muted-foreground">
							Webhook URL: <code className="bg-muted px-1 py-0.5 rounded">https://admin.jetbeans.cafe/api/webhooks/polar</code>
						</p>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="PayPal"
					description="PayPal checkout, Venmo, and Pay Later installment payments."
					connected={!!paypalClientId && !!paypalClientSecret}
					onSave={() => updateSettings([
						{ key: "paypal_client_id", value: paypalClientId, group: "integrations" },
						{ key: "paypal_client_secret", value: paypalClientSecret, group: "integrations" },
						{ key: "paypal_test_mode", value: paypalTestMode ? "true" : "false", group: "integrations" },
					])}
				>
					<div className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Client ID</Label>
								<Input
									value={paypalClientId}
									onChange={(e) => setPaypalClientId(e.target.value)}
									placeholder="AV..."
								/>
							</div>
							<div className="space-y-2">
								<Label>Client Secret</Label>
								<Input
									type="password"
									value={paypalClientSecret}
									onChange={(e) => setPaypalClientSecret(e.target.value)}
								/>
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<Label>Sandbox Mode</Label>
								<p className="text-xs text-muted-foreground">Test transactions only</p>
							</div>
							<Switch checked={paypalTestMode} onCheckedChange={setPaypalTestMode} />
						</div>
						<p className="text-xs text-muted-foreground">
							Create credentials at <code className="bg-muted px-1 py-0.5 rounded">developer.paypal.com</code> → Apps & Credentials.
						</p>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Reown (WalletConnect)"
					description="Cryptocurrency payments via BTC, ETH, SOL, stablecoins, and more."
					connected={!!reownProjectId}
					onSave={() => updateSettings([
						{ key: "reown_project_id", value: reownProjectId, group: "integrations" },
						{ key: "reown_chains", value: JSON.stringify(reownChains), group: "integrations" },
					])}
				>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Project ID</Label>
							<Input
								value={reownProjectId}
								onChange={(e) => setReownProjectId(e.target.value)}
								placeholder="your-walletconnect-project-id"
							/>
							<p className="text-xs text-muted-foreground">
								Get your Project ID from <code className="bg-muted px-1 py-0.5 rounded">cloud.reown.com</code> (formerly WalletConnect Cloud).
							</p>
						</div>
						<div className="space-y-2">
							<Label>Accepted Coins</Label>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
								{[
									{ id: "btc", name: "Bitcoin (BTC)" },
									{ id: "eth", name: "Ethereum (ETH)" },
									{ id: "sol", name: "Solana (SOL)" },
									{ id: "usdc", name: "USDC" },
									{ id: "usdt", name: "USDT" },
									{ id: "bnb", name: "BNB" },
									{ id: "zec", name: "Zcash (ZEC)" },
									{ id: "xrp", name: "XRP" },
								].map((chain) => (
									<label key={chain.id} className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={reownChains.includes(chain.id)}
											onCheckedChange={() => setReownChains((prev) =>
												prev.includes(chain.id) ? prev.filter((c) => c !== chain.id) : [...prev, chain.id]
											)}
										/>
										<span className="text-sm">{chain.name}</span>
									</label>
								))}
							</div>
						</div>
					</div>
				</IntegrationCard>

				{/* --- MONITORING --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Monitoring</p>

				<IntegrationCard
					name="Sentry"
					description="Error tracking, performance monitoring, and crash reporting for both admin and storefront."
					connected={!!sentryDsnAdmin || !!sentryDsnWeb}
					onSave={() => updateSettings([
						{ key: "sentry_dsn_admin", value: sentryDsnAdmin, group: "integrations" },
						{ key: "sentry_dsn_web", value: sentryDsnWeb, group: "integrations" },
						{ key: "sentry_org", value: sentryOrg, group: "integrations" },
						{ key: "sentry_project", value: sentryProject, group: "integrations" },
						{ key: "sentry_auth_token", value: sentryAuthToken, group: "integrations" },
					])}
				>
					<div className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Admin DSN</Label>
								<Input
									type="password"
									value={sentryDsnAdmin}
									onChange={(e) => setSentryDsnAdmin(e.target.value)}
									placeholder="https://xxx@o123.ingest.sentry.io/456"
								/>
							</div>
							<div className="space-y-2">
								<Label>Storefront DSN</Label>
								<Input
									type="password"
									value={sentryDsnWeb}
									onChange={(e) => setSentryDsnWeb(e.target.value)}
									placeholder="https://xxx@o123.ingest.sentry.io/789"
								/>
							</div>
							<div className="space-y-2">
								<Label>Organization Slug</Label>
								<Input
									value={sentryOrg}
									onChange={(e) => setSentryOrg(e.target.value)}
									placeholder="jetbeans"
								/>
							</div>
							<div className="space-y-2">
								<Label>Project Slug</Label>
								<Input
									value={sentryProject}
									onChange={(e) => setSentryProject(e.target.value)}
									placeholder="jetbeans-admin"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Auth Token (for source maps)</Label>
							<Input
								type="password"
								value={sentryAuthToken}
								onChange={(e) => setSentryAuthToken(e.target.value)}
								placeholder="sntrys_..."
							/>
							<p className="text-xs text-muted-foreground">
								Optional. Required for uploading source maps during builds for readable stack traces.
							</p>
						</div>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Google Analytics"
					description="Ecommerce conversion tracking, audience insights, and traffic analysis for the storefront."
					connected={!!gaMeasurementId}
					onSave={() => updateSettings([
						{ key: "ga_measurement_id", value: gaMeasurementId, group: "integrations" },
					])}
				>
					<div className="space-y-2">
						<Label>Measurement ID (GA4)</Label>
						<Input
							value={gaMeasurementId}
							onChange={(e) => setGaMeasurementId(e.target.value)}
							placeholder="G-XXXXXXXXXX"
						/>
						<p className="text-xs text-muted-foreground">
							From Google Analytics → Admin → Data Streams. Used on the storefront for ecommerce event tracking.
						</p>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="PostHog"
					description="Product analytics, session replays, feature flags, and A/B testing for both admin and storefront."
					connected={!!posthogKey}
					onSave={() => updateSettings([
						{ key: "posthog_key", value: posthogKey, group: "integrations" },
						{ key: "posthog_host", value: posthogHost, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Project API Key</Label>
							<Input
								value={posthogKey}
								onChange={(e) => setPosthogKey(e.target.value)}
								placeholder="phc_..."
							/>
						</div>
						<div className="space-y-2">
							<Label>Host</Label>
							<Input
								value={posthogHost}
								onChange={(e) => setPosthogHost(e.target.value)}
								placeholder="https://us.i.posthog.com"
							/>
							<p className="text-xs text-muted-foreground">US or EU cloud, or your self-hosted instance.</p>
						</div>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="Meta Pixel"
					description="Facebook and Instagram ad conversion tracking, retargeting audiences, and purchase event reporting."
					connected={!!metaPixelId}
					onSave={() => updateSettings([
						{ key: "meta_pixel_id", value: metaPixelId, group: "integrations" },
						{ key: "meta_conversions_token", value: metaConversionsToken, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Pixel ID</Label>
							<Input
								value={metaPixelId}
								onChange={(e) => setMetaPixelId(e.target.value)}
								placeholder="123456789012345"
							/>
						</div>
						<div className="space-y-2">
							<Label>Conversions API Token</Label>
							<Input
								type="password"
								value={metaConversionsToken}
								onChange={(e) => setMetaConversionsToken(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Server-side event tracking for iOS 14+ accuracy. From Meta Events Manager.</p>
						</div>
					</div>
				</IntegrationCard>

				<IntegrationCard
					name="TikTok Pixel"
					description="Ecommerce event tracking for TikTok ad campaigns, retargeting, and purchase conversion reporting."
					connected={!!tiktokPixelId}
					onSave={() => updateSettings([
						{ key: "tiktok_pixel_id", value: tiktokPixelId, group: "integrations" },
						{ key: "tiktok_access_token", value: tiktokAccessToken, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Pixel ID</Label>
							<Input
								value={tiktokPixelId}
								onChange={(e) => setTiktokPixelId(e.target.value)}
								placeholder="C..."
							/>
						</div>
						<div className="space-y-2">
							<Label>Events API Access Token</Label>
							<Input
								type="password"
								value={tiktokAccessToken}
								onChange={(e) => setTiktokAccessToken(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Server-side event tracking for accurate attribution. From TikTok Events Manager.</p>
						</div>
					</div>
				</IntegrationCard>

				{/* --- SECURITY --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Security</p>

				<IntegrationCard
					name="Cloudflare Turnstile"
					description="Bot protection for login, signup, checkout, and contact forms. Free privacy-friendly CAPTCHA alternative."
					connected={!!turnstileSiteKey && !!turnstileSecretKey}
					onSave={() => updateSettings([
						{ key: "turnstile_site_key", value: turnstileSiteKey, group: "integrations" },
						{ key: "turnstile_secret_key", value: turnstileSecretKey, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Site Key</Label>
							<Input
								value={turnstileSiteKey}
								onChange={(e) => setTurnstileSiteKey(e.target.value)}
								placeholder="0x..."
							/>
							<p className="text-xs text-muted-foreground">Public key embedded in the storefront widget.</p>
						</div>
						<div className="space-y-2">
							<Label>Secret Key</Label>
							<Input
								type="password"
								value={turnstileSecretKey}
								onChange={(e) => setTurnstileSecretKey(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Server-side verification key.</p>
						</div>
					</div>
				</IntegrationCard>

				{/* --- AUTHENTICATION --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Authentication</p>

				<IntegrationCard
					name="Google OAuth"
					description="Social login via Google accounts for admin team members and storefront customers."
					connected={!!googleClientId && !!googleClientSecret}
					onSave={() => updateSettings([
						{ key: "google_client_id", value: googleClientId, group: "integrations" },
						{ key: "google_client_secret", value: googleClientSecret, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Client ID</Label>
							<Input
								value={googleClientId}
								onChange={(e) => setGoogleClientId(e.target.value)}
								placeholder="xxx.apps.googleusercontent.com"
							/>
						</div>
						<div className="space-y-2">
							<Label>Client Secret</Label>
							<Input
								type="password"
								value={googleClientSecret}
								onChange={(e) => setGoogleClientSecret(e.target.value)}
							/>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						Configure OAuth consent screen and credentials in Google Cloud Console. Also set as <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_CLIENT_ID</code> and <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_CLIENT_SECRET</code> in environment.
					</p>
				</IntegrationCard>

			<IntegrationCard
					name="Apple OAuth"
					description="Sign in with Apple for storefront customers on iOS, macOS, and Safari."
					connected={!!appleClientId && !!appleTeamId}
					onSave={() => updateSettings([
						{ key: "apple_client_id", value: appleClientId, group: "integrations" },
						{ key: "apple_team_id", value: appleTeamId, group: "integrations" },
						{ key: "apple_key_id", value: appleKeyId, group: "integrations" },
						{ key: "apple_private_key", value: applePrivateKey, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>Services ID (Client ID)</Label>
							<Input
								value={appleClientId}
								onChange={(e) => setAppleClientId(e.target.value)}
								placeholder="com.jetbeans.auth"
							/>
						</div>
						<div className="space-y-2">
							<Label>Team ID</Label>
							<Input
								value={appleTeamId}
								onChange={(e) => setAppleTeamId(e.target.value)}
								placeholder="ABCD1234EF"
							/>
						</div>
						<div className="space-y-2">
							<Label>Key ID</Label>
							<Input
								value={appleKeyId}
								onChange={(e) => setAppleKeyId(e.target.value)}
								placeholder="ABC123DEFG"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Private Key (.p8 contents)</Label>
						<Input
							type="password"
							value={applePrivateKey}
							onChange={(e) => setApplePrivateKey(e.target.value)}
							placeholder="-----BEGIN PRIVATE KEY-----..."
						/>
						<p className="text-xs text-muted-foreground">
							Generate in Apple Developer → Certificates, Identifiers & Profiles → Keys. Download the .p8 file and paste contents here.
						</p>
					</div>
				</IntegrationCard>

				{/* --- AI --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">AI</p>

				<IntegrationCard
					name="OpenAI"
					description="AI-powered product descriptions, smart search enhancement, and automated customer support responses."
					connected={!!openaiApiKey}
					onSave={() => updateSettings([
						{ key: "openai_api_key", value: openaiApiKey, group: "integrations" },
						{ key: "openai_org", value: openaiOrg, group: "integrations" },
					])}
				>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>API Key</Label>
							<Input
								type="password"
								value={openaiApiKey}
								onChange={(e) => setOpenaiApiKey(e.target.value)}
								placeholder="sk-..."
							/>
						</div>
						<div className="space-y-2">
							<Label>Organization ID (optional)</Label>
							<Input
								value={openaiOrg}
								onChange={(e) => setOpenaiOrg(e.target.value)}
								placeholder="org-..."
							/>
							<p className="text-xs text-muted-foreground">Only needed if your key belongs to multiple orgs.</p>
						</div>
					</div>
				</IntegrationCard>

				{/* --- LOCATION --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Location</p>

				<IntegrationCard
					name="Google Maps Platform"
					description="Address autocomplete at checkout, shipping address validation, and store locator maps."
					connected={!!googleMapsApiKey}
					onSave={() => updateSettings([
						{ key: "google_maps_api_key", value: googleMapsApiKey, group: "integrations" },
					])}
				>
					<div className="space-y-2">
						<Label>API Key</Label>
						<Input
							type="password"
							value={googleMapsApiKey}
							onChange={(e) => setGoogleMapsApiKey(e.target.value)}
							placeholder="AIza..."
						/>
						<p className="text-xs text-muted-foreground">
							Enable Places API, Maps JavaScript API, and Geocoding API in Google Cloud Console. Restrict key to your domains.
						</p>
					</div>
				</IntegrationCard>

				{/* --- CUSTOMER SUPPORT --- */}
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4">Customer Support</p>

				<IntegrationCard
					name="Crisp"
					description="Live chat widget for the storefront with shared inbox, chatbot automation, and customer profiles."
					connected={!!crispWebsiteId}
					onSave={() => updateSettings([
						{ key: "crisp_website_id", value: crispWebsiteId, group: "integrations" },
					])}
				>
					<div className="space-y-2">
						<Label>Website ID</Label>
						<Input
							value={crispWebsiteId}
							onChange={(e) => setCrispWebsiteId(e.target.value)}
							placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
						/>
						<p className="text-xs text-muted-foreground">
							From Crisp Dashboard → Settings → Website Settings → Setup. The chat widget loads on the storefront automatically.
						</p>
					</div>
				</IntegrationCard>
			</div>
		</div>
	)
}
