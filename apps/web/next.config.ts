import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {}

export default withSentryConfig(nextConfig, {
	org: "jetbeans",
	project: "jetbeans-web",
	silent: !process.env.CI,
	widenClientFileUpload: true,
})
