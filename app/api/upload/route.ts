import { type NextRequest, NextResponse } from "next/server"
import { uploadToB2 } from "@/lib/storage/b2"
import { createClient as createAuthClient } from "@/lib/supabase/server"

// Ensure Node.js runtime (AWS SDK + Buffer)
export const runtime = "nodejs"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // By default, require an authenticated user to prevent public abuse.
    // If you really want public uploads, set ALLOW_PUBLIC_UPLOADS=true
    const allowPublic = process.env.ALLOW_PUBLIC_UPLOADS === "true"

    if (!allowPublic) {
      const supabase = await createAuthClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
      }
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = formData.get("folder") as string | null

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحديد ملف" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      // Audio
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      // Video
      "video/mp4",
      "video/webm",
      // Documents
      "application/pdf",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مسموح به" }, { status: 400 })
    }

    // Max file size: 50MB
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "حجم الملف كبير جداً (الحد الأقصى 50 ميجابايت)" }, { status: 400 })
    }

    // Create unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}-${randomString}-${originalName}`

    // Determine upload folder based on file type or provided folder
    let uploadFolder = folder || "general"
    if (!folder) {
      if (file.type.startsWith("image/")) uploadFolder = "images"
      else if (file.type.startsWith("audio/")) uploadFolder = "audio"
      else if (file.type.startsWith("video/")) uploadFolder = "videos"
      else if (file.type === "application/pdf") uploadFolder = "documents"
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Store in B2 under: uploads/<folder>/<filename>
    const key = `uploads/${uploadFolder}/${fileName}`
    const { url } = await uploadToB2({
      key,
      body: buffer,
      contentType: file.type,
    })

    return NextResponse.json({
      success: true,
      url,
      key,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    const message = error instanceof Error ? error.message : "حدث خطأ أثناء رفع الملف"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}