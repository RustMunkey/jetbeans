import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@jetbeans/db/client"
import { eq } from "@jetbeans/db/drizzle"
import { users } from "@jetbeans/db/schema"
import { getSettings } from "../actions"
import { IntegrationsClient } from "./integrations-client"

export default async function IntegrationsPage() {
	const session = await auth.api.getSession({ headers: await headers() })

	if (!session) {
		redirect("/login")
	}

	// Only owners can access integrations
	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1)

	if (user?.role !== "owner") {
		redirect("/settings")
	}

	const settings = await getSettings()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<IntegrationsClient settings={settings} />
		</div>
	)
}
