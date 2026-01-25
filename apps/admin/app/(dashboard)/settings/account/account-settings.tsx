"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { updateProfile } from "./actions"

type User = {
	id: string
	name: string
	email: string
	image: string | null
	role: string | null
	phone: string | null
	createdAt: Date
}

export function AccountSettings({ user }: { user: User }) {
	const router = useRouter()
	const [name, setName] = useState(user.name)
	const [phone, setPhone] = useState(user.phone || "")
	const [image, setImage] = useState(user.image || "")
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const initials = name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.toUpperCase()
		.slice(0, 2)

	async function handleUpload(file: File) {
		setUploading(true)
		try {
			const formData = new FormData()
			formData.append("file", file)
			const res = await fetch("/api/upload", { method: "POST", body: formData })
			if (!res.ok) throw new Error("Upload failed")
			const { url } = await res.json()
			setImage(url)
			toast.success("Photo uploaded")
		} catch {
			toast.error("Failed to upload photo")
		} finally {
			setUploading(false)
		}
	}

	async function handleSave() {
		if (!name.trim()) {
			toast.error("Name is required")
			return
		}
		setSaving(true)
		try {
			await updateProfile({
				name: name.trim(),
				phone: phone.trim() || undefined,
				image: image || undefined,
			})
			toast.success("Profile updated")
			// Refresh server components to update sidebar, header, etc.
			router.refresh()
		} catch {
			toast.error("Failed to update profile")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Account</h2>
				<p className="text-muted-foreground text-sm">Manage your profile and account settings.</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Profile Photo</CardTitle>
					<CardDescription>Click the avatar or upload a new photo.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4">
						<div
							className="relative cursor-pointer group"
							onClick={() => fileInputRef.current?.click()}
						>
							<Avatar className="h-20 w-20">
								{image && <AvatarImage src={image} alt={name} />}
								<AvatarFallback className="text-lg">{initials}</AvatarFallback>
							</Avatar>
							<div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
								<span className="text-white text-xs font-medium">
									{uploading ? "..." : "Edit"}
								</span>
							</div>
						</div>
						<div className="space-y-2">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0]
									if (file) handleUpload(file)
								}}
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading}
							>
								{uploading ? "Uploading..." : "Upload Photo"}
							</Button>
							{image && (
								<Button
									variant="ghost"
									size="sm"
									className="text-destructive"
									onClick={() => setImage("")}
								>
									Remove
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Personal Info</CardTitle>
					<CardDescription>Update your name and contact details.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								value={user.email}
								readOnly
								className="text-muted-foreground"
							/>
							<p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input
								id="phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+1 555-0000"
							/>
						</div>
						<div className="space-y-2">
							<Label>Role</Label>
							<div className="pt-2">
								<Badge variant="secondary" className="capitalize">
									{user.role || "member"}
								</Badge>
							</div>
						</div>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
						</p>
						<Button onClick={handleSave} disabled={saving}>
							{saving ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
