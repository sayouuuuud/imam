import { type NextRequest, NextResponse } from "next/server"

interface YouTubeVideoInfo {
  videoId: string
  title: string
  thumbnail: string
  embedUrl: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "رابط اليوتيوب مطلوب" }, { status: 400 })
    }

    // Extract video ID from various YouTube URL formats
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return NextResponse.json({ error: "رابط يوتيوب غير صحيح" }, { status: 400 })
    }

    // Get video info from YouTube oEmbed API
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

    try {
      const response = await fetch(oEmbedUrl)
      if (!response.ok) {
        throw new Error("Video not found")
      }

      const data = await response.json()
      const videoInfo: YouTubeVideoInfo = {
        videoId,
        title: data.title,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }

      return NextResponse.json({ success: true, videoInfo })
    } catch {
      // If oEmbed fails, return basic info
      const videoInfo: YouTubeVideoInfo = {
        videoId,
        title: "",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }

      return NextResponse.json({ success: true, videoInfo })
    }
  } catch (error) {
    console.error("YouTube API Error:", error)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

