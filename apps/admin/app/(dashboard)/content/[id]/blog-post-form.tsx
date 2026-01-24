"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/rich-text-editor"
import { MediaUploader, type MediaItem } from "@/components/media-uploader"
import { createBlogPost, updateBlogPost, deleteBlogPost } from "../actions"

type BlogPost = {
	id: string
	title: string
	slug: string
	excerpt: string | null
	content: string | null
	coverImage: string | null
	status: string
	metaTitle: string | null
	metaDescription: string | null
	tags: string[] | null
}

function slugify(text: string) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)+/g, "")
}

export function BlogPostForm({ post }: { post: BlogPost | null }) {
	const router = useRouter()
	const isNew = !post

	const [title, setTitle] = useState(post?.title || "")
	const [slug, setSlug] = useState(post?.slug || "")
	const [excerpt, setExcerpt] = useState(post?.excerpt || "")
	const [content, setContent] = useState(post?.content || "")
	const [status, setStatus] = useState(post?.status || "draft")
	const [coverMedia, setCoverMedia] = useState<MediaItem[]>(
		post?.coverImage ? [{ id: "cover", url: post.coverImage, type: "image" }] : []
	)
	const [tagsInput, setTagsInput] = useState((post?.tags || []).join(", "))
	const [metaTitle, setMetaTitle] = useState(post?.metaTitle || "")
	const [metaDescription, setMetaDescription] = useState(post?.metaDescription || "")
	const [saving, setSaving] = useState(false)

	function handleTitleChange(value: string) {
		setTitle(value)
		if (isNew || slug === slugify(post?.title || "")) {
			setSlug(slugify(value))
		}
	}

	async function handleSave() {
		if (!title.trim() || !slug.trim()) {
			toast.error("Title and slug are required")
			return
		}
		setSaving(true)
		try {
			const data = {
				title,
				slug,
				excerpt: excerpt || undefined,
				content: content || undefined,
				coverImage: coverMedia[0]?.url || undefined,
				status,
				metaTitle: metaTitle || undefined,
				metaDescription: metaDescription || undefined,
				tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
			}
			if (isNew) {
				await createBlogPost(data)
				toast.success("Post created")
			} else {
				await updateBlogPost(post.id, data)
				toast.success("Post updated")
			}
			router.push("/content")
			router.refresh()
		} catch {
			toast.error("Failed to save post")
		} finally {
			setSaving(false)
		}
	}

	async function handleDelete() {
		if (!post) return
		if (!confirm("Delete this post?")) return
		await deleteBlogPost(post.id)
		toast.success("Post deleted")
		router.push("/content")
		router.refresh()
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold tracking-tight">
					{isNew ? "New Blog Post" : "Edit Blog Post"}
				</h2>
				<div className="flex gap-2">
					{!isNew && (
						<Button variant="destructive" onClick={handleDelete}>Delete</Button>
					)}
					<Button onClick={handleSave} disabled={saving}>
						{saving ? "Saving..." : "Save"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Content</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">Title</Label>
								<Input
									id="title"
									value={title}
									onChange={(e) => handleTitleChange(e.target.value)}
									placeholder="Post title"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="slug">Slug</Label>
								<Input
									id="slug"
									value={slug}
									onChange={(e) => setSlug(e.target.value)}
									placeholder="post-slug"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="excerpt">Excerpt</Label>
								<Textarea
									id="excerpt"
									value={excerpt}
									onChange={(e) => setExcerpt(e.target.value)}
									placeholder="Brief summary..."
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<Label>Body</Label>
								<RichTextEditor
									content={content}
									onChange={setContent}
									placeholder="Write your post..."
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Status</CardTitle>
						</CardHeader>
						<CardContent>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="published">Published</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectContent>
							</Select>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Cover Image</CardTitle>
						</CardHeader>
						<CardContent>
							<MediaUploader
								items={coverMedia}
								onChange={setCoverMedia}
								maxItems={1}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Tags</CardTitle>
						</CardHeader>
						<CardContent>
							<Input
								value={tagsInput}
								onChange={(e) => setTagsInput(e.target.value)}
								placeholder="coffee, brewing, tips"
							/>
							<p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>SEO</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Meta Title</Label>
								<Input
									value={metaTitle}
									onChange={(e) => setMetaTitle(e.target.value)}
									placeholder="SEO title"
								/>
								<p className="text-xs text-muted-foreground">{metaTitle.length}/60</p>
							</div>
							<div className="space-y-2">
								<Label>Meta Description</Label>
								<Textarea
									value={metaDescription}
									onChange={(e) => setMetaDescription(e.target.value)}
									placeholder="SEO description"
									rows={3}
								/>
								<p className="text-xs text-muted-foreground">{metaDescription.length}/160</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
