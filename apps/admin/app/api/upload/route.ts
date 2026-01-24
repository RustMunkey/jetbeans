import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
	}

	const formData = await req.formData()
	const file = formData.get("file") as File | null

	if (!file) {
		return NextResponse.json({ error: "No file provided" }, { status: 400 })
	}

	const maxSize = 50 * 1024 * 1024 // 50MB
	if (file.size > maxSize) {
		return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
	}

	if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
		return NextResponse.json({ error: "Only image and video files are allowed" }, { status: 400 })
	}

	try {
		if (process.env.BLOB_READ_WRITE_TOKEN) {
			const { put } = await import("@vercel/blob")
			const blob = await put(`products/${Date.now()}-${file.name}`, file, {
				access: "public",
			})
			return NextResponse.json({ url: blob.url, type: file.type })
		}

		// Local development fallback: save to public/uploads/
		const uploadsDir = path.join(process.cwd(), "public", "uploads")
		await mkdir(uploadsDir, { recursive: true })

		const ext = file.name.split(".").pop() || "bin"
		const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
		const filepath = path.join(uploadsDir, filename)

		const buffer = Buffer.from(await file.arrayBuffer())
		await writeFile(filepath, buffer)

		return NextResponse.json({ url: `/uploads/${filename}`, type: file.type })
	} catch (error: any) {
		return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
	}
}
