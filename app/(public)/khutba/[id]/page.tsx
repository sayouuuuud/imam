"use client"

import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ShareButtons } from "@/components/share-buttons"
import { SafeHtml } from "@/components/ui/safe-html"
import { BookCoverImage } from "@/components/book-cover-image"
import { useEffect, useState } from "react"
import { Mic, Clock, Eye, Music, Play } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function KhutbaDetailPage({ params }: PageProps) {
  const [sermonData, setSermonData] = useState<any>(null)
  const [relatedSermonsData, setRelatedSermonsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSermon = async () => {
      try {
        const { id } = await params
        const supabase = createPublicClient()

        // Fetch sermon details
        const { data: sermon, error } = await supabase
          .from("sermons")
          .select("*")
          .eq("id", id)
          .eq("publish_status", "published")
          .single()

        if (error || !sermon) {
          notFound()
          return
        }

        // Increment views count
        await supabase
          .from("sermons")
          .update({ views_count: (sermon.views_count || 0) + 1 })
          .eq("id", id)

        // Fetch category name if category_id exists
        let categoryName = null
        if (sermon.category_id) {
          const { data: category } = await supabase
            .from("categories")
            .select("name")
            .eq("id", sermon.category_id)
            .single()
          categoryName = category?.name || null
        }

        // Fetch related sermons
        const { data: relatedSermons } = await supabase
          .from("sermons")
          .select("id, title, thumbnail_path, created_at, views_count")
          .eq("publish_status", "published")
          .neq("id", id)
          .limit(3)
          .order("created_at", { ascending: false })

        setSermonData({ ...sermon, categoryName })
        setRelatedSermonsData(relatedSermons || [])
        setLoading(false)
      } catch (error) {
        console.error("Error loading sermon:", error)
        notFound()
      }
    }

    loadSermon()
  }, [params])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getAudioUrl = (sermon: any) => {
    if (sermon.audio_file_path?.startsWith("uploads/")) {
      return `/api/download?key=${encodeURIComponent(sermon.audio_file_path)}`
    }
    return sermon.audio_url || sermon.audio_file_path
  }

  const getThumbnailUrl = (sermon: any) => {
    if (sermon.thumbnail_path?.startsWith("uploads/")) {
      return `/api/download?key=${encodeURIComponent(sermon.thumbnail_path)}`
    }
    return sermon.thumbnail_path || sermon.thumbnail
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">جاري تحميل الخطبة...</p>
        </div>
      </div>
    )
  }

  if (!sermonData) {
    notFound()
    return null
  }

  const sermon = sermonData
  const audioUrl = getAudioUrl(sermon)
  const thumbnailUrl = getThumbnailUrl(sermon)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Print styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-content,
            #print-content * {
              visibility: visible;
            }
            #print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: none;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-text-muted dark:text-text-subtext mb-8 overflow-x-auto whitespace-nowrap print:hidden">
          <Link href="/" className="hover:text-primary">
            الرئيسية
          </Link>
          <span className="mx-2">/</span>
          <Link href="/khutba" className="hover:text-primary">
            الخطب المنبرية
          </Link>
          <span className="mx-2">/</span>
          <span className="text-primary font-medium">{sermon.title}</span>
        </nav>

        {/* Sermon Header */}
        <article id="sermon-content">
          {/* Print-only content */}
          <div
            id="print-content"
            className="hidden print:block print:p-8 print:max-w-none print:text-black print:bg-white"
          >
            <div className="print:text-center print:mb-8 print:border-b-2 print:border-gray-300 print:pb-4">
              <h1 className="print:text-3xl print:font-bold print:mb-4 print:text-gray-900">
                {sermon.title}
              </h1>
              <div className="print:flex print:justify-between print:text-sm print:text-gray-600">
                <span>التاريخ: {formatDate(sermon.created_at)}</span>
                {sermon.duration && (
                  <span>المدة: {sermon.duration}</span>
                )}
              </div>
            </div>

            {sermon.description && (
              <div className="print:text-gray-600 print:mb-4 print:italic">
                {sermon.description}
              </div>
            )}

            <div className="print:text-gray-800 print:leading-relaxed">
              <SafeHtml
                html={sermon.content || sermon.description || ""}
                className="print:text-base print:leading-8 print:text-gray-900"
              />
            </div>
          </div>

          {/* Screen content */}
          {thumbnailUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
              <BookCoverImage
                coverImagePath={thumbnailUrl}
                title={sermon.title}
                variant="detail"
              />
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif leading-tight">
              {sermon.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-text-muted no-print">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDate(sermon.created_at)}</span>
              </div>
              {sermon.duration && (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span>{sermon.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{sermon.views_count || 0} مشاهدة</span>
              </div>
              {sermon.categoryName && (
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span>{sermon.categoryName}</span>
                </div>
              )}
            </div>
          </div>

          {sermon.description && (
            <div className="mb-6 text-lg text-text-muted italic">
              {sermon.description}
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="mb-8 no-print">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">استمع إلى الخطبة</h3>
                </div>
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/mpeg" />
                  <source src={audioUrl} type="audio/mp3" />
                  متصفحك لا يدعم تشغيل الصوتيات
                </audio>
              </div>
            </div>
          )}

          {/* YouTube Video */}
          {sermon.youtube_url && (
            <div className="mb-8 no-print">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${sermon.youtube_url.split("v=")[1]?.split("&")[0] || sermon.youtube_url.split("/").pop()}`}
                    title={sermon.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {sermon.content && (
            <SafeHtml
              html={sermon.content}
              className="prose prose-lg max-w-none mb-12 prose-headings:text-foreground prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-bold prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-li:mb-1 prose-blockquote:text-foreground prose-blockquote:border-primary prose-blockquote:bg-muted prose-blockquote:p-4 prose-blockquote:rounded-lg prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-a:text-primary prose-a:underline hover:prose-a:no-underline dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-strong:text-white dark:prose-li:text-gray-300 dark:prose-blockquote:text-white dark:prose-code:text-blue-400 dark:prose-pre:text-gray-200"
            />
          )}

          {/* Transcript */}
          {sermon.transcript && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">نص الخطبة</h2>
              <SafeHtml
                html={sermon.transcript}
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed"
              />
            </div>
          )}

          <div className="mb-12 pb-12 border-b border-border no-print">
            <h3 className="font-bold text-foreground mb-4">مشاركة الخطبة</h3>
            <ShareButtons
              title={sermon.title}
              content={sermon.content || sermon.description || ""}
              author="الشيخ السيد مراد"
            />
          </div>

          {/* Related Sermons */}
          {relatedSermonsData && relatedSermonsData.length > 0 && (
            <div className="no-print">
              <h2 className="text-2xl font-bold text-foreground mb-6">خطب ذات صلة</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedSermonsData.map((relatedSermon) => (
                  <Link
                    key={relatedSermon.id}
                    href={`/khutba/${relatedSermon.id}`}
                    className="group"
                  >
                    <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-colors">
                      <BookCoverImage
                        coverImagePath={
                          relatedSermon.thumbnail_path?.startsWith("uploads/")
                            ? `/api/download?key=${encodeURIComponent(relatedSermon.thumbnail_path)}`
                            : relatedSermon.thumbnail_path || ""
                        }
                        title={relatedSermon.title}
                        variant="card"
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedSermon.title}
                        </h3>
                        <p className="text-sm text-text-muted">
                          {formatDate(relatedSermon.created_at)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                          <Eye className="h-3 w-3" />
                          <span>{relatedSermon.views_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  )
}