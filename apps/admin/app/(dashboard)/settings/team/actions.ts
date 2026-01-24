"use server"

import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { eq } from "@jetbeans/db/drizzle"
import { db } from "@jetbeans/db/client"
import { users, invites } from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { sendTemplateEmail } from "@/lib/send-email"

const OWNER_WHITELIST = [
	"wilson.asher00@gmail.com",
	"reeseroberge10@gmail.com",
]

async function requireOwner() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})
	if (!session) throw new Error("Not authenticated")

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1)

	if (!user || user.role !== "owner" || !OWNER_WHITELIST.includes(user.email)) {
		throw new Error("Only owners can manage the team")
	}

	return user
}

export async function getTeamMembers() {
	return db.select().from(users).where(eq(users.role, "owner"))
		.then(async (owners) => {
			const admins = await db.select().from(users).where(eq(users.role, "admin"))
			const members = await db.select().from(users).where(eq(users.role, "member"))
			return [...owners, ...admins, ...members]
		})
}

export async function getPendingInvites() {
	return db
		.select()
		.from(invites)
		.where(eq(invites.status, "pending"))
}

export async function createInvite(email: string, role: string) {
	const currentUser = await requireOwner()

	// Check if user already exists
	const [existingUser] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1)

	if (existingUser) {
		throw new Error("User already has access")
	}

	// Check if invite already exists
	const [existingInvite] = await db
		.select()
		.from(invites)
		.where(eq(invites.email, email))
		.limit(1)

	if (existingInvite) {
		throw new Error("Invite already sent to this email")
	}

	const token = nanoid(32)
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

	const [invite] = await db
		.insert(invites)
		.values({
			email,
			role,
			invitedBy: currentUser.id,
			token,
			expiresAt,
		})
		.returning()

	await logAudit({
		action: "invite.created",
		targetType: "invite",
		targetId: invite.id,
		targetLabel: email,
		metadata: { role },
	})

	// Send invite email (gracefully fails if Resend not configured)
	const loginUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"
	await sendTemplateEmail({
		to: email,
		templateSlug: "team-invite",
		variables: {
			invitee_email: email,
			inviter_name: currentUser.name,
			role,
			login_url: `${loginUrl}/sign-in`,
		},
		sentBy: currentUser.id,
	}).catch(() => {})

	return invite
}

export async function revokeInvite(inviteId: string) {
	await requireOwner()

	const [invite] = await db
		.select()
		.from(invites)
		.where(eq(invites.id, inviteId))
		.limit(1)

	await db.delete(invites).where(eq(invites.id, inviteId))

	await logAudit({
		action: "invite.revoked",
		targetType: "invite",
		targetId: inviteId,
		targetLabel: invite?.email,
	})
}

export async function updateMemberRole(userId: string, role: string) {
	await requireOwner()

	if (role !== "admin" && role !== "member") {
		throw new Error("Invalid role")
	}

	// Can't change other owners
	const [targetUser] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)

	if (targetUser?.role === "owner") {
		throw new Error("Cannot change owner role")
	}

	await db.update(users).set({ role }).where(eq(users.id, userId))

	await logAudit({
		action: "member.role_changed",
		targetType: "member",
		targetId: userId,
		targetLabel: targetUser?.name ?? targetUser?.email,
		metadata: { previousRole: targetUser?.role, newRole: role },
	})
}

export async function removeMember(userId: string) {
	await requireOwner()

	const [targetUser] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)

	if (targetUser?.role === "owner") {
		throw new Error("Cannot remove an owner")
	}

	await db.delete(users).where(eq(users.id, userId))

	await logAudit({
		action: "member.removed",
		targetType: "member",
		targetId: userId,
		targetLabel: targetUser?.name ?? targetUser?.email,
	})
}
