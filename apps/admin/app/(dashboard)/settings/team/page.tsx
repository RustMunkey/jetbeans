import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getTeamMembers, getPendingInvites } from "./actions"
import { TeamClient } from "./team-client"

export default async function TeamPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const members = await getTeamMembers()
  const pendingInvites = await getPendingInvites()
  const OWNER_WHITELIST = [
    "wilson.asher00@gmail.com",
    "reeseroberge10@gmail.com",
  ]
  const currentMember = members.find((m) => m.id === session?.user.id)
  const isOwner = currentMember?.role === "owner" && OWNER_WHITELIST.includes(currentMember.email)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <p className="text-sm text-muted-foreground">
        Manage who has access to the admin panel.
      </p>
      <TeamClient
        members={members}
        pendingInvites={pendingInvites}
        isOwner={isOwner}
      />
    </div>
  )
}
