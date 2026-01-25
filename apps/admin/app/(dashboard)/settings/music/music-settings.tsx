"use client"

import * as React from "react"
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
import { useBreadcrumbOverride } from "@/components/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { useMusicPlayer, type Track } from "@/components/music-player"
import {
	getUserAudioTracks,
	uploadAudioTrack,
	updateAudioTrack,
	deleteAudioTrack,
	type UserAudioTrack,
} from "./actions"

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

export function MusicSettings({ initialTracks }: { initialTracks: UserAudioTrack[] }) {
	useBreadcrumbOverride("settings", "Settings")
	useBreadcrumbOverride("music", "Music Library")

	const [tracks, setTracks] = React.useState(initialTracks)
	const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
	const [editDialogOpen, setEditDialogOpen] = React.useState(false)
	const [editingTrack, setEditingTrack] = React.useState<UserAudioTrack | null>(null)
	const [uploading, setUploading] = React.useState(false)
	const [previewAudio, setPreviewAudio] = React.useState<HTMLAudioElement | null>(null)
	const [playingId, setPlayingId] = React.useState<string | null>(null)

	const { setTracks: setMusicPlayerTracks, playTrack } = useMusicPlayer()

	// Sync tracks with music player
	React.useEffect(() => {
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

	const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.currentTarget)

		const file = formData.get("file") as File
		if (!file || !file.size) {
			toast.error("Please select a file")
			return
		}

		setUploading(true)
		try {
			const track = await uploadAudioTrack(formData)
			setTracks((prev) => [track, ...prev])
			setUploadDialogOpen(false)
			toast.success("Track uploaded successfully")
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to upload track")
		} finally {
			setUploading(false)
		}
	}

	const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!editingTrack) return

		const formData = new FormData(e.currentTarget)
		const name = formData.get("name") as string
		const artist = formData.get("artist") as string

		try {
			const updated = await updateAudioTrack(editingTrack.id, { name, artist: artist || null })
			setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
			setEditDialogOpen(false)
			setEditingTrack(null)
			toast.success("Track updated")
		} catch {
			toast.error("Failed to update track")
		}
	}

	const handleDelete = async (id: string) => {
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

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Music Library</CardTitle>
							<CardDescription>
								Upload and manage your personal music collection for the radio player.
							</CardDescription>
						</div>
						<Button onClick={() => setUploadDialogOpen(true)}>
							<HugeiconsIcon icon={Upload04Icon} size={16} className="mr-2" />
							Upload Track
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{tracks.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
								<HugeiconsIcon icon={MusicNote03Icon} size={24} className="text-muted-foreground" />
							</div>
							<h3 className="font-medium mb-1">No tracks uploaded</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Upload MP3 files to add them to your music player.
							</p>
							<Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
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
											onClick={() => handleDelete(track.id)}
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

			{/* Upload Dialog */}
			<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Upload Track</DialogTitle>
						<DialogDescription>
							Upload an MP3 file to add it to your music library.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleUpload}>
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
							<Button type="submit" disabled={uploading}>
								{uploading ? "Uploading..." : "Upload"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Track</DialogTitle>
						<DialogDescription>
							Update the track details.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleEdit}>
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
