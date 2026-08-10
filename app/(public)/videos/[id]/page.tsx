import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { ChevronLeft, Calendar, Clock, Eye, Play } from "lucide-react"
import { SafeHtml } from "@/components/ui/safe-html"
import { SheikhProfileCard } from "@/components/sheikh-profile-card"
import { NewsletterCard } from "@/components/newsletter-card"
import { VideoInteractions } from "@/components/videos/video-interactions"
import { ViewTracker } from "@/components/view-tracker"
import { stripHtml } from "@/lib/utils/strip-html"
import { getVideoOgImage } from "@/lib/utils/og-images"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/json-ld"
import { generateVideoSchema, generateBreadcrumbSchema, formatDurationToISO } from "@/lib/schema-generator"

interface PageProps {
  params: Promise<{ id: string }>
}

// Revalidate the cached page at most once an hour instead of rendering (and
// hitting Supabase) on every request.
export const revalidate = 3600

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from("media")
    .select("id")
    .eq("publish_status", "published")
    .order("created_at", { ascending: false })
    .limit(100)

  return (data || []).map((v) => ({ id: v.id as string }))
}

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Roughly 40% of the 510 video rows have an empty or near-empty description.
 * Google treats those pages as thin content, so instead of shipping no
 * description at all we synthesise one from the metadata we *do* have
 * (title, category, date, duration). Every generated sentence differs per
 * video, so this is not boilerplate duplicated across the site.
 */
// 167 media rows literally store "<p>No description available</p>" and 14 store
// just "الوصف". Those are import artefacts, not content — never surface them.
const PLACEHOLDER_DESCRIPTIONS = new Set(["no description available", "الوصف", "-", "لا يوجد وصف"])

function cleanDescription(raw?: string | null): string {
  if (!raw) return ""
  const text = stripHtml(raw).replace(/\s+/g, " ").trim()
  if (!text || PLACEHOLDER_DESCRIPTIONS.has(text.toLowerCase())) return ""
  return text
}

function buildVideoDescription(video: {
  title: string
  description?: string | null
  created_at?: string | null
  duration?: string | null
}, categoryName?: string | null): string {
  const existing = cleanDescription(video.description)
  if (existing.length >= 50) return existing

  const parts: string[] = [`مقطع مرئي بعنوان «${video.title}» للشيخ السيد مراد سلامة`]
  if (categoryName) parts.push(`ضمن قسم ${categoryName}`)
  if (video.created_at) parts.push(`نُشر بتاريخ ${formatDate(video.created_at)}`)

  let text = parts.join("، ")
  if (video.duration) text += ` ومدته ${video.duration}`
  text += "."
  // Keep whatever short description the row already had — it still adds signal.
  if (existing) text += ` ${existing}.`
  text += " شاهد المقطع كاملًا على موقع الشيخ السيد مراد سلامة."
  return text
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = createPublicClient()
  const { data: video } = await supabase
    .from("media")
    .select("title, description, thumbnail, source, url, created_at, duration, category_id")
    .eq("id", id)
    .eq("publish_status", "published")
    .single()

  if (!video) return { title: "الفيديو غير موجود", robots: { index: false, follow: false } }

  let categoryName: string | null = null
  if (video.category_id) {
    const { data: category } = await supabase.from("categories").select("name").eq("id", video.category_id).single()
    categoryName = category?.name ?? null
  }

  const ogImage = getVideoOgImage(video)
  const canonicalPath = `/videos/${id}`
  const description = buildVideoDescription(video, categoryName).slice(0, 200)

  return {
    title: `${video.title} | الشيخ السيد مراد سلامة`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: video.title,
      description,
      images: [ogImage],
      type: "video.other",
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description,
      images: [ogImage.url],
    },
  }
}

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

const getYouTubeVideoId = (url: string | null): string | null => {
  if (!url) return null
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/
  )
  return match ? match[1] : null
}

const getThumbnailUrl = (video: any) => {
  if (video.thumbnail?.startsWith("uploads/")) {
    return `/api/download?key=${encodeURIComponent(video.thumbnail)}`
  }
  if (video.source === "youtube" && video.url) {
    const videoId = getYouTubeVideoId(video.url)
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "/video-thumbnail.png"
  }
  return video.thumbnail || "/video-thumbnail.png"
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createPublicClient()

  const { data: video } = await supabase
    .from("media")
    .select("*")
    .eq("id", id)
    .eq("publish_status", "published")
    .single()

  if (!video) {
    notFound()
  }

  const RELATED_SELECT = "id, title, thumbnail, source, url, created_at, views_count, duration"
  const RELATED_LIMIT = 8

  // Fetch the category name and same-category siblings in parallel.
  // The old version linked to only 2 videos picked purely by recency, which
  // left the ~500 older videos almost orphaned — nothing linked to them, so
  // Google had no crawl path in. Same-category links fix that.
  const [categoryResponse, sameCategoryResponse] = await Promise.all([
    video.category_id
      ? supabase.from("categories").select("name").eq("id", video.category_id).single()
      : Promise.resolve({ data: null }),
    video.category_id
      ? supabase
          .from("media")
          .select(RELATED_SELECT)
          .eq("publish_status", "published")
          .eq("category_id", video.category_id)
          .neq("id", id)
          .order("created_at", { ascending: false })
          .limit(RELATED_LIMIT)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const categoryName = (categoryResponse.data as { name?: string } | null)?.name || null

  let relatedVideos: any[] = (sameCategoryResponse.data as any[]) || []

  // Top up with recent videos when the category is too small to fill the rail.
  if (relatedVideos.length < RELATED_LIMIT) {
    const excludeIds = [id, ...relatedVideos.map((v) => v.id)]
    const { data: fallback } = await supabase
      .from("media")
      .select(RELATED_SELECT)
      .eq("publish_status", "published")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(RELATED_LIMIT - relatedVideos.length)
    relatedVideos = [...relatedVideos, ...((fallback as any[]) || [])]
  }

  const description = buildVideoDescription(video, categoryName)
  const hasRichDescription = cleanDescription(video.description).length >= 50
  const thumbnailUrl = getThumbnailUrl(video)
  const videoId = video.source === "youtube" ? getYouTubeVideoId(video.url) : null

  const videoSchema = await generateVideoSchema({
    title: video.title,
    description,
    uploadDate: video.created_at,
    url: `/videos/${video.id}`,
    thumbnail: thumbnailUrl.startsWith('http') ? thumbnailUrl : `https://elsayedmourad.com${thumbnailUrl}`,
    contentUrl: video.source !== "youtube" && video.url ? (video.url.startsWith('http') ? video.url : `https://elsayedmourad.com${video.url}`) : undefined,
    embedUrl: video.source === "youtube" && videoId ? `https://www.youtube.com/embed/${videoId}` : undefined,
    duration: formatDurationToISO(video.duration),
  })

  const breadcrumbSchema = await generateBreadcrumbSchema([
    { name: 'الرئيسية', item: '/' },
    { name: 'المرئيات', item: '/videos' },
    { name: video.title, item: `/videos/${video.id}` },
  ])

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-background bg-pattern text-foreground antialiased transition-colors duration-300">
      <JsonLd schema={[videoSchema, breadcrumbSchema]} />
      <ViewTracker table="media" id={video.id} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Link href="/" className="hover:text-primary dark:hover:text-secondary">الرئيسية</Link>
          <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
          <Link href="/videos" className="hover:text-primary dark:hover:text-secondary">المرئيات</Link>
          <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
          <span className="text-primary dark:text-secondary font-medium">{video.title}</span>
        </nav>

        {/* Video Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Video */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-2xl overflow-hidden shadow-lg mb-6">
              {video.source === "youtube" && videoId ? (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : video.url ? (
                <div className="aspect-video">
                  <video
                    controls
                    className="w-full h-full"
                    poster={thumbnailUrl}
                  >
                    <source src={video.url} type="video/mp4" />
                    <source src={video.url} type="video/webm" />
                    متصفحك لا يدعم تشغيل الفيديوهات
                  </video>
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">فيديو غير متوفر</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4 leading-tight">
                  {video.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(video.created_at)}</span>
                  </div>
                  {video.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{video.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{formatViews(video.views_count || 0)} مشاهدة</span>
                  </div>
                  {categoryName && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      {categoryName}
                    </span>
                  )}
                </div>

                <VideoInteractions title={video.title} />
              </div>

              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-4 text-lg">
                  وصف الفيديو
                </h3>
                <div className="prose prose-lg dark:prose-invert prose-p:font-body prose-p:text-foreground/90 max-w-none">
                  {hasRichDescription ? (
                    <SafeHtml html={video.description} />
                  ) : (
                    <p className="leading-relaxed">{description}</p>
                  )}
                </div>
              </div>

              {/* Share Section (legacy placeholder - now handled by VideoInteractions but kept structure if needed) */}
            </div>
          </div>

          {/* Sidebar - Related Videos + cards */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <SheikhProfileCard />
              <h3 className="text-xl font-bold text-foreground mb-6">
                {categoryName ? `المزيد من ${categoryName}` : "فيديوهات ذات صلة"}
              </h3>

              {relatedVideos.length > 0 ? (
                <div className="space-y-4">
                  {relatedVideos.map((relatedVideo) => (
                    <Link
                      key={relatedVideo.id}
                      href={`/videos/${relatedVideo.id}`}
                      className="group block"
                    >
                      <div className="flex bg-surface rounded-xl overflow-hidden border border-border hover:border-primary hover:bg-surface-hover transition-colors h-24">
                        <div className="w-36 relative shrink-0 overflow-hidden">
                          <img
                            src={getThumbnailUrl(relatedVideo)}
                            alt={relatedVideo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <Play className="h-4 w-4 text-white fill-white" />
                            </div>
                          </div>
                          {relatedVideo.duration && (
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {relatedVideo.duration}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-between relative">
                          <h4 className="font-bold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {relatedVideo.title}
                          </h4>
                          <div className="flex items-center justify-between text-[11px] text-text-muted mt-auto">
                            <span className="flex items-center gap-1">
                              {formatDate(relatedVideo.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatViews(relatedVideo.views_count || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد فيديوهات ذات صلة</p>
                </div>
              )}
              <NewsletterCard />

              <div className="mt-8 text-center">
                <Link
                  href="/videos"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  <span>عرض جميع الفيديوهات</span>
                  <span className="material-icons-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
