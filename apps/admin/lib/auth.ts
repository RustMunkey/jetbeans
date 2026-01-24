import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@jetbeans/db/client";
import { eq, count } from "@jetbeans/db/drizzle";
import { users, sessions, accounts, verifications, invites, auditLog } from "@jetbeans/db/schema";

export const auth = betterAuth({
	baseURL: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001",
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: users,
			session: sessions,
			account: accounts,
			verification: verifications,
		},
	}),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			prompt: "select_account",
		},
	},
	session: {
		expiresIn: 60 * 60 * 24, // 24 hours
		updateAge: 60 * 60, // refresh token every hour of activity
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // cache session for 5 min (avoids DB hit every request)
		},
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "member",
				input: false,
			},
		},
	},
	databaseHooks: {
		session: {
			create: {
				after: async (session) => {
					// Log sign-in to audit log
					const [user] = await db
						.select({ name: users.name, email: users.email })
						.from(users)
						.where(eq(users.id, session.userId))
						.limit(1);

					if (user) {
						await db.insert(auditLog).values({
							userId: session.userId,
							userName: user.name,
							userEmail: user.email,
							action: "auth.sign_in",
							ipAddress: session.ipAddress ?? null,
							metadata: {
								userAgent: session.userAgent,
							},
						}).catch(() => {});
					}
				},
			},
		},
		user: {
			create: {
				before: async (user) => {
					const email = user.email;

					// Check if this is an initial admin bootstrap
					const initialEmails = process.env.INITIAL_ADMIN_EMAILS
						?.split(",")
						.map((e) => e.trim().toLowerCase());
					if (initialEmails?.includes(email.toLowerCase())) {
						const [ownerCount] = await db
							.select({ count: count() })
							.from(users)
							.where(eq(users.role, "owner"));
						if (Number(ownerCount.count) < initialEmails.length) {
							return {
								data: {
									...user,
									role: "owner",
								},
							};
						}
					}

					// Check for a pending invite
					const [invite] = await db
						.select()
						.from(invites)
						.where(eq(invites.email, email))
						.limit(1);

					if (invite && invite.status === "pending") {
						await db
							.update(invites)
							.set({ status: "accepted" })
							.where(eq(invites.id, invite.id));

						return {
							data: {
								...user,
								role: invite.role,
							},
						};
					}

					// No invite found — deny access
					return false;
				},
			},
		},
	},
	plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
