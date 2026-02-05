"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { Loader2, ArrowLeft } from "lucide-react"

export function ForgotPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [email, setEmail] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [emailSent, setEmailSent] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email) return

		setIsLoading(true)
		setError(null)

		try {
			const result = await authClient.forgetPassword({
				email,
				redirectTo: "/reset-password",
			})
			if (result.error) {
				setError(result.error.message || "Failed to send reset link")
			} else {
				setEmailSent(true)
			}
		} catch (err) {
			setError("Failed to send reset link. Please try again.")
		} finally {
			setIsLoading(false)
		}
	}

	if (emailSent) {
		return (
			<div className={cn("flex flex-col gap-6", className)} {...props}>
				<div className="flex flex-col items-center gap-2 text-center">
					<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
						<svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					<h1 className="text-2xl font-bold">Check your email</h1>
					<p className="text-muted-foreground text-sm text-balance">
						We sent a password reset link to <span className="font-medium text-foreground">{email}</span>
					</p>
				</div>
				<Button
					variant="ghost"
					onClick={() => {
						setEmailSent(false)
						setEmail("")
					}}
				>
					Use a different email
				</Button>
				<Link
					href="/login"
					className="text-center text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
				>
					<ArrowLeft className="size-4" />
					Back to sign in
				</Link>
			</div>
		)
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="text-2xl font-bold">Forgot password?</h1>
				<p className="text-muted-foreground text-sm text-balance">
					Enter your email and we&apos;ll send you a link to reset your password
				</p>
			</div>

			{error && (
				<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>
				<Button type="submit" className="w-full h-11" disabled={isLoading}>
					{isLoading ? (
						<Loader2 className="size-5 animate-spin" />
					) : (
						"Send Reset Link"
					)}
				</Button>
			</form>

			<Link
				href="/login"
				className="text-center text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
			>
				<ArrowLeft className="size-4" />
				Back to sign in
			</Link>
		</div>
	)
}
