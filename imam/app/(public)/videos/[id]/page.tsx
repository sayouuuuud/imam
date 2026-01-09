"use client"

import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import { ShareButtons } from "@/components/share-buttons"
import { SafeHtml } from "@/components/ui/safe-html"
import { Calendar, Eye, Play, Clock } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function VideoDetailPage({ params }: PageProps) {
  const [videoData, setVideoData] = useState<any>(null)
  const [relatedVideosData, setRelatedVideosData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const { id } = await params
        const supabase = createPublicClient()

        // Fetch video details
        const { data: video, error } = await supabase
          .from("media")
          .select("*")
          .eq("id", id)
          .eq("publish_status", "published")
          .single()

        if (error || !video) {
          notFound()
          return
        }

        // Increment views count
        await supabase
          .from("media")
          .update({ views_count: (video.views_count || 0) + 1 })
          .eq("id", id)

        // Fetch category name if category_id exists
        let categoryName = null
        if (video.category_id) {
          const { data: category } = await supabase
            .from("categories")
            .select("name")
            .eq("id", video.category_id)
            .single()
          categoryName = category?.name || null
        }

        // Fetch related videos
        const { data: relatedVideos } = await supabase
          .from("media")
          .select("id, title, thumbnail, created_at, views_count, duration")
          .eq("publish_status", "published")
          .neq("id", id)
          .limit(4)
          .order("created_at", { ascending: false })

        setVideoData({ ...video, categoryName })
        setRelatedVideosData(relatedVideos || [])
        setLoading(false)
      } catch (error) {
        console.error("Error loading video:", error)
        notFound()
      }
    }

    loadVideo()
  }, [params])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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

  const getYouTubeVideoId = (url: string): string | null => {
    const match = url?.match(
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">جاري تحميل الفيديو...</p>
        </div>
      </div>
    )
  }

  if (!videoData) {
    notFound()
    return null
  }

  const video = videoData
  const thumbnailUrl = getThumbnailUrl(video)
  const videoId = video.source === "youtube" ? getYouTubeVideoId(video.url) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-text-muted mb-8">
          <ol className="inline-flex items-center space-x-reverse space-x-2">
            <li className="inline-flex items-center">
              <Link
                className="inline-flex items-center hover:text-primary"
                href="/"
              >
                <span className="material-icons-outlined text-base ml-1">home</span>
                الرئيسية
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-icons-outlined text-base mx-2 text-gray-400">
                  chevron_left
                </span>
                <Link className="hover:text-primary" href="/videos">
                  المرئيات
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="material-icons-outlined text-base mx-2 text-gray-400">
                  chevron_left
                </span>
                <span className="text-primary font-medium">{video.title}</span>
              </div>
            </li>
          </ol>
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
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
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
                  {video.categoryName && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      {video.categoryName}
                    </span>
                  )}
                </div>
              </div>

              {video.description && (
                <div className="bg-surface rounded-xl p-6 border border-border">
                  <h3 className="font-bold text-foreground mb-4 text-lg">
                    وصف الفيديو
                  </h3>
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <SafeHtml html={video.description} />
                  </div>
                </div>
              )}

              {/* Share Section */}
              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-4">مشاركة الفيديو</h3>
                <ShareButtons
                  title={video.title}
                  content={video.description || ""}
                  author="الشيخ السيد مراد سلامة"
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-xl font-bold text-foreground mb-6">
                فيديوهات ذات صلة
              </h3>

              {relatedVideosData && relatedVideosData.length > 0 ? (
                <div className="space-y-4">
                  {relatedVideosData.map((relatedVideo) => (
                    <Link
                      key={relatedVideo.id}
                      href={`/videos/${relatedVideo.id}`}
                      className="group block"
                    >
                      <div className="bg-surface rounded-xl overflow-hidden border border-border hover:border-primary transition-colors">
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={getThumbnailUrl(relatedVideo)}
                            alt={relatedVideo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                              <Play className="h-5 w-5 text-white fill-white" />
                            </div>
                          </div>
                          {relatedVideo.duration && (
                            <span className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {relatedVideo.duration}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-sm text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {relatedVideo.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-text-muted">
                            <span>{formatDate(relatedVideo.created_at)}</span>
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