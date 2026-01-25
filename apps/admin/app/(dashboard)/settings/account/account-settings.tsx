"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	MusicNote03Icon,
	Upload04Icon,
	Delete02Icon,
	PlayIcon,
	PauseIcon,
	Edit02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { updateProfile } from "./actions"
import { themePresets } from "@/components/accent-theme-provider"
import { useMusicPlayer, type Track } from "@/components/music-player"
import {
	getUserAudioTracks,
	uploadAudioTrack,
	updateAudioTrack,
	deleteAudioTrack,
	type UserAudioTrack,
} from "../music/actions"

function formatFileSize(bytes: number | null): string {
	if (!bytes) return "Unknown"
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number | null): string {
	if (!seconds) return "--:--"
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	return `${mins}:${secs.toString().padStart(2, "0")}`
}

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

	// Music library state
	const [tracks, setTracks] = useState<UserAudioTrack[]>([])
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editingTrack, setEditingTrack] = useState<UserAudioTrack | null>(null)
	const [uploadingTrack, setUploadingTrack] = useState(false)
	const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null)
	const [playingId, setPlayingId] = useState<string | null>(null)

	const { setTracks: setMusicPlayerTracks, playTrack } = useMusicPlayer()

	useEffect(() => {
		setMounted(true)
		// Load saved accent theme from localStorage
		const savedAccent = localStorage.getItem("jetbeans-accent-theme")
		if (savedAccent) {
			setAccentTheme(savedAccent)
		}
		// Load music tracks
		getUserAudioTracks().then(setTracks).catch(() => {})
	}, [])

	// Sync tracks with music player
	useEffect(() => {
		const uploadedTracks: Track[] = tracks.map((t) => ({
			id: t.id,
			name: t.name,
			url: t.url,
			artist: t.artist || undefined,
			duration: t.duration || undefined,
			type: "uploaded" as const,
		}))
		setMusicPlayerTracks(uploadedTracks)
	}, [tracks, setMusicPlayerTracks])

	const handleTrackUpload = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.currentTarget)

		const file = formData.get("file") as File
		if (!file || !file.size) {
			toast.error("Please select a file")
			return
		}

		setUploadingTrack(true)
		try {
			const track = await uploadAudioTrack(formData)
			setTracks((prev) => [track, ...prev])
			setUploadDialogOpen(false)
			toast.success("Track uploaded successfully")
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to upload track")
		} finally {
			setUploadingTrack(false)
		}
	}

	const handleTrackEdit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!editingTrack) return

		const formData = new FormData(e.currentTarget)
		const trackName = formData.get("name") as string
		const artist = formData.get("artist") as string

		try {
			const updated = await updateAudioTrack(editingTrack.id, { name: trackName, artist: artist || null })
			setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
			setEditDialogOpen(false)
			setEditingTrack(null)
			toast.success("Track updated")
		} catch {
			toast.error("Failed to update track")
		}
	}

	const handleTrackDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this track?")) return

		try {
			await deleteAudioTrack(id)
			setTracks((prev) => prev.filter((t) => t.id !== id))
			toast.success("Track deleted")
		} catch {
			toast.error("Failed to delete track")
		}
	}

	const handlePreview = (track: UserAudioTrack) => {
		if (playingId === track.id) {
			previewAudio?.pause()
			setPlayingId(null)
			return
		}

		if (previewAudio) {
			previewAudio.pause()
		}

		const audio = new Audio(track.url)
		audio.volume = 0.5
		audio.onended = () => setPlayingId(null)
		audio.play().catch(() => {})
		setPreviewAudio(audio)
		setPlayingId(track.id)
	}

	const handlePlayInMusicPlayer = (track: UserAudioTrack) => {
		if (previewAudio) {
			previewAudio.pause()
			setPlayingId(null)
		}
		playTrack({
			id: track.id,
			name: track.name,
			url: track.url,
			artist: track.artist || undefined,
			duration: track.duration || undefined,
			type: "uploaded",
		})
	}

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

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Music Library</CardTitle>
							<CardDescription>
								Upload and manage your personal music collection for the radio player.
							</CardDescription>
						</div>
						<Button size="sm" onClick={() => setUploadDialogOpen(true)}>
							<HugeiconsIcon icon={Upload04Icon} size={16} className="mr-2" />
							Upload
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{tracks.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
								<HugeiconsIcon icon={MusicNote03Icon} size={24} className="text-muted-foreground" />
							</div>
							<h3 className="font-medium mb-1">No tracks uploaded</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Upload MP3 files to add them to your music player.
							</p>
							<Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
								Upload your first track
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							{tracks.map((track) => (
								<div
									key={track.id}
									className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
								>
									<Button
										variant="ghost"
										size="icon"
										className="size-10 shrink-0"
										onClick={() => handlePreview(track)}
									>
										<HugeiconsIcon
											icon={playingId === track.id ? PauseIcon : PlayIcon}
											size={20}
										/>
									</Button>
									<div className="flex-1 min-w-0">
										<p className="font-medium truncate">{track.name}</p>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											{track.artist && <span>{track.artist}</span>}
											{track.artist && <span>·</span>}
											<span>{formatDuration(track.duration)}</span>
											<span>·</span>
											<span>{formatFileSize(track.fileSize)}</span>
										</div>
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="size-8"
											onClick={() => handlePlayInMusicPlayer(track)}
										>
											<HugeiconsIcon icon={MusicNote03Icon} size={16} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-8"
											onClick={() => {
												setEditingTrack(track)
												setEditDialogOpen(true)
											}}
										>
											<HugeiconsIcon icon={Edit02Icon} size={16} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-8 text-destructive hover:text-destructive"
											onClick={() => handleTrackDelete(track.id)}
										>
											<HugeiconsIcon icon={Delete02Icon} size={16} />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Upload Track Dialog */}
			<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Upload Track</DialogTitle>
						<DialogDescription>
							Upload an MP3 file to add it to your music library.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleTrackUpload}>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="file">Audio File</Label>
								<Input
									id="file"
									name="file"
									type="file"
									accept="audio/*"
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="name">Track Name</Label>
								<Input
									id="name"
									name="name"
									placeholder="My awesome track"
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="artist">Artist (optional)</Label>
								<Input
									id="artist"
									name="artist"
									placeholder="Artist name"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={uploadingTrack}>
								{uploadingTrack ? "Uploading..." : "Upload"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Track Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Track</DialogTitle>
						<DialogDescription>
							Update the track details.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleTrackEdit}>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="edit-name">Track Name</Label>
								<Input
									id="edit-name"
									name="name"
									defaultValue={editingTrack?.name}
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="edit-artist">Artist (optional)</Label>
								<Input
									id="edit-artist"
									name="artist"
									defaultValue={editingTrack?.artist || ""}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
								Cancel
							</Button>
							<Button type="submit">Save Changes</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
