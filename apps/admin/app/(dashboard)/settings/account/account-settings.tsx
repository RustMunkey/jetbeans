"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { updateProfile } from "./actions"
import { themePresets } from "@/components/accent-theme-provider"

const themeOptions = [
	// Row 1: Warm tones
	{ id: "coffee", name: "Coffee", description: "Warm brown classic" },
	{ id: "cherry", name: "Cherry", description: "Bold red warmth" },
	{ id: "rose", name: "Rose", description: "Soft pink blush" },
	{ id: "peach", name: "Peach", description: "Gentle coral glow" },
	{ id: "sunset", name: "Sunset", description: "Amber orange hues" },
	// Row 2: Earth & nature
	{ id: "honey", name: "Honey", description: "Golden amber light" },
	{ id: "tea", name: "Tea", description: "Yellow-green zen" },
	{ id: "matcha", name: "Matcha", description: "Fresh green energy" },
	{ id: "sage", name: "Sage", description: "Earthy green calm" },
	{ id: "forest", name: "Forest", description: "Deep woodland" },
	// Row 3: Cool tones
	{ id: "mint", name: "Mint", description: "Crisp aqua fresh" },
	{ id: "sky", name: "Sky", description: "Light azure blue" },
	{ id: "ocean", name: "Ocean", description: "Deep sea depths" },
	{ id: "midnight", name: "Midnight", description: "Rich indigo night" },
	{ id: "lavender", name: "Lavender", description: "Soft purple mist" },
	// Row 4: Rich & neutral
	{ id: "plum", name: "Plum", description: "Deep violet luxury" },
	{ id: "berry", name: "Berry", description: "Vibrant magenta" },
	{ id: "wine", name: "Wine", description: "Rich burgundy" },
	{ id: "slate", name: "Slate", description: "Cool gray minimal" },
	{ id: "neutral", name: "Neutral", description: "Pure grayscale" },
]

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
	const { theme, setTheme, resolvedTheme } = useTheme()
	const [name, setName] = useState(user.name)
	const [phone, setPhone] = useState(user.phone || "")
	const [image, setImage] = useState(user.image || "")
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [mounted, setMounted] = useState(false)
	const [accentTheme, setAccentTheme] = useState("coffee")
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		setMounted(true)
		// Load saved accent theme from localStorage
		const savedAccent = localStorage.getItem("jetbeans-accent-theme")
		if (savedAccent) {
			setAccentTheme(savedAccent)
		}
	}, [])

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

			<Card>
				<CardHeader>
					<CardTitle>Appearance</CardTitle>
					<CardDescription>Customize how the dashboard looks for you.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-3">
						<Label>Color Mode</Label>
						<div className="flex gap-2">
							<Button
								variant={mounted && theme === "light" ? "default" : "outline"}
								size="sm"
								onClick={() => setTheme("light")}
								disabled={!mounted}
							>
								Light
							</Button>
							<Button
								variant={mounted && theme === "dark" ? "default" : "outline"}
								size="sm"
								onClick={() => setTheme("dark")}
								disabled={!mounted}
							>
								Dark
							</Button>
							<Button
								variant={mounted && theme === "system" ? "default" : "outline"}
								size="sm"
								onClick={() => setTheme("system")}
								disabled={!mounted}
							>
								System
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							{mounted
								? theme === "system"
									? `Follows your device's color scheme (currently ${resolvedTheme})`
									: `Currently using ${theme} mode`
								: "Loading..."}
						</p>
					</div>

					<Separator />

					<div className="space-y-3">
						<Label>Theme</Label>
						<p className="text-sm text-muted-foreground">Choose a color palette for the interface.</p>
						<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
							{themeOptions.map((option) => (
								<button
									key={option.id}
									type="button"
									onClick={() => {
										setAccentTheme(option.id)
										localStorage.setItem("jetbeans-accent-theme", option.id)
										window.dispatchEvent(new CustomEvent("accent-theme-change", { detail: option.id }))
										toast.success(`${option.name} theme applied`)
									}}
									className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
										accentTheme === option.id
											? "border-primary bg-muted"
											: "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
									}`}
								>
									<div
										className="size-8 rounded-full border-2 border-white shadow-sm"
										style={{ backgroundColor: themePresets[option.id]?.light.primary }}
									/>
									<div className="text-center">
										<p className="text-xs font-medium">{option.name}</p>
										<p className="text-[10px] text-muted-foreground">{option.description}</p>
									</div>
								</button>
							))}
						</div>
						<p className="text-xs text-muted-foreground">
							Your accent theme preference is saved to this browser.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
