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

    console.log('📡 API Download Debug:', {
      fileKey,
      format,
      hasFileKey: !!fileKey,
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    })

    if (!fileKey) {
      console.log('❌ No file key provided')
      return NextResponse.json({ error: "مطلوب مسار/Key الملف" }, { status: 400 })
    }

    // Check if B2 environment variables are configured
    const b2EnvCheck = {
      hasEndpoint: !!process.env.B2_S3_ENDPOINT,
      hasKeyId: !!process.env.B2_KEY_ID,
      hasAppKey: !!process.env.B2_APPLICATION_KEY,
      hasBucket: !!process.env.B2_BUCKET,
      endpoint: process.env.B2_S3_ENDPOINT?.substring(0, 20) + '...',
      bucket: process.env.B2_BUCKET
    }

    console.log('🔧 B2 Environment Check:', b2EnvCheck)

    if (!process.env.B2_S3_ENDPOINT || !process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_BUCKET) {
      console.warn("❌ B2 environment variables not configured - returning null")
      return NextResponse.json({ url: null }, { status: 200 })
    }

    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: fileKey,
    })

    console.log('📦 S3 Command:', {
      bucket: process.env.B2_BUCKET,
      key: fileKey,
      endpoint: process.env.B2_S3_ENDPOINT
    })

    // Signed URL expires in 1 hour
    try {
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 60 })
      console.log('✅ Signed URL Generated:', {
        success: true,
        urlLength: signedUrl.length,
        urlPreview: signedUrl.substring(0, 50) + '...',
        format
      })

      // If format=json, return JSON response, otherwise redirect
      if (format === "json") {
        return NextResponse.json({ url: signedUrl }, {
          headers: {
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'CDN-Cache-Control': 'max-age=3600',
          }
        })
      }

      // Redirect so it works in <img>, <audio>, <video>, <iframe>, and normal links
      return NextResponse.redirect(signedUrl, {
        status: 302,
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'CDN-Cache-Control': 'max-age=3600',
        }
      })
    } catch (signError) {
      console.error('❌ Failed to generate signed URL:', signError)
      return NextResponse.json({ error: "فشل إنشاء رابط التحميل", details: signError.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return NextResponse.json({ error: "فشل إنشاء رابط التحميل" }, { status: 500 })
  }
}

