import { type NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Ensure Node.js runtime (AWS SDK + crypto)
export const runtime = "nodejs"

const s3 = new S3Client({
  region: process.env.B2_REGION || "us-east-1",
  endpoint: process.env.B2_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  // Backblaze S3 endpoints work more reliably with path-style.
  forcePathStyle: true,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileKey = searchParams.get("key")
    const format = searchParams.get("format")

    if (!fileKey) {
      return NextResponse.json({ error: "مطلوب مسار/Key الملف" }, { status: 400 })
    }

    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: fileKey,
    })

    // Signed URL expires in 1 hour
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 60 })

    // If format=json, return JSON response, otherwise redirect
    if (format === "json") {
      return NextResponse.json({ url: signedUrl })
    }

    // Redirect so it works in <img>, <audio>, <video>, <iframe>, and normal links
    return NextResponse.redirect(signedUrl, { status: 302 })
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return NextResponse.json({ error: "فشل إنشاء رابط التحميل" }, { status: 500 })
  }
}

