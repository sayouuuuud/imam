import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { FileText, Play, ArrowLeft, Clock, Mic, BookOpen, Video } from "lucide-react"
import { stripHtml } from "@/lib/utils/strip-html"

export const revalidate = 60

interface ContentItem {
  id: string
  title: string
  description?: string | null
  excerpt?: string | null
  content_type: "article" | "sermon" | "lesson" | "book" | "video"
  created_at: string
  thumbnail?: string | null
  read_time?: number | null
  duration?: string | null
  author?: string | null
  url?: string | null
}

interface LatestContentProps {
  content: ContentItem[]
}

const getYouTubeThumbnail = (url: string | undefined | null): string | null => {
  if (!url) return null
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/
  )
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null
}

const getThumbnailUrl = (item: ContentItem) => {
  const thumbnail = item.thumbnail

  if (thumbnail?.startsWith("uploads/")) {
    return `/api/download?key=${encodeURIComponent(thumbnail)}`
  }

  if (item.content_type === "video" && !thumbnail && item.url) {
    return getYouTubeThumbnail(item.url)
  }

  return thumbnail || null
}

export function LatestContent({ content }: LatestContentProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-secondary/10 text-secondary p-2.5 rounded-xl border border-secondary/20">
            <FileText className="h-5 w-5" />
          </span>
          <h3 className="text-2xl font-bold font-serif text-foreground">أحدث المحتويات</h3>
        </div>
        <Link href="/articles" className="text-xs font-bold text-primary hover:text-primary/70 flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 transition-all">
          المكتبة الكاملة
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 bg-card/50 dark:bg-card/40 backdrop-blur-sm rounded-2xl border border-border/60">
            <FileText className="h-12 w-12 mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">لا توجد محتويات حالياً</p>
          </div>
        ) : (
          content.map((item) => {
            const getItemUrl = () => {
              switch (item.content_type) {
                case "article":
                  return `/articles/${item.id}`
                case "sermon":
                  return `/khutba/${item.id}`
                case "lesson":
                  return `/dars/${item.id}`
                case "book":
                  return `/books/${item.id}`
                case "video":
                  return `/videos/${item.id}`
                default:
                  return "#"
              }
            }

            const getItemIcon = () => {
              switch (item.content_type) {
                case "article":
                  return <FileText className="h-5 w-5 text-primary" />
                case "sermon":
                  return <Mic className="h-5 w-5 text-secondary" />
                case "lesson":
                  return <Play className="h-5 w-5 text-primary" />
                case "book":
                  return <BookOpen className="h-5 w-5 text-emerald-600" />
                case "video":
                  return <Video className="h-5 w-5 text-red-500" />
                default:
                  return <FileText className="h-5 w-5 text-primary" />
              }
            }

            const getItemTypeLabel = () => {
              switch (item.content_type) {
                case "article":
                  return "مقالة"
                case "sermon":
                  return "خطبة"
                case "lesson":
                  return "درس"
                case "book":
                  return "كتاب"
                case "video":
                  return "مرئي"
                default:
                  return ""
              }
            }

            const getItemTypeColor = () => {
              switch (item.content_type) {
                case "article":
                  return "bg-primary/10 text-primary border-primary/20"
                case "sermon":
                  return "bg-secondary/10 text-secondary border-secondary/20"
                case "lesson":
                  return "bg-primary/10 text-primary border-primary/20"
                case "book":
                  return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                case "video":
                  return "bg-red-500/10 text-red-500 border-red-500/20"
                default:
                  return "bg-primary/10 text-primary border-primary/20"
              }
            }

            const description = item.excerpt || item.description
            const cleanDescription = description ? stripHtml(description) : ""

            const thumbnailUrl = getThumbnailUrl(item)
            const showThumbnail = thumbnailUrl

            return (
              <Link
                key={`${item.content_type}-${item.id}`}
                href={getItemUrl()}
                className="group block bg-card/40 dark:bg-card/30 backdrop-blur-sm border border-border/60 dark:border-border/30 rounded-xl p-4 transition-all duration-300 hover:border-primary/40 hover:bg-muted/30 dark:hover:bg-white/5 shadow hover:shadow-lg"
              >
                <div className="flex gap-4">
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center border ${showThumbnail ? 'border-border/40' : getItemTypeColor()}`}
                  >
                    {showThumbnail ? (
                      <img
                        src={thumbnailUrl!}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="transition-transform duration-300 group-hover:scale-110">
                        {getItemIcon()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getItemTypeColor()}`}>
                          {getItemTypeLabel()}
                        </span>
                        <span className="text-[10px] font-medium text-text-muted">
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight mb-1">
                      {item.title}
                    </h4>

                    {/* Special Layout for Lessons */}
                    {item.content_type === "lesson" && (
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <p className="font-medium opacity-80">{item.author || "السيد مراد سلامة"}</p>
                      </div>
                    )}

                    {/* Default Layout for others */}
                    {item.content_type !== "lesson" && (
                      <>
                        {(item.content_type === "book" || item.content_type === "article") && item.author && (
                          <p className="text-[11px] text-text-muted font-medium opacity-80">{item.author}</p>
                        )}
                        {cleanDescription && item.content_type !== "book" && (
                          <p className="text-xs text-text-muted line-clamp-1 opacity-70 mt-1">{cleanDescription}</p>
                        )}
                        {(item.read_time || item.duration) && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-text-muted/60 uppercase">
                            <Clock className="h-3 w-3" />
                            <span>{item.read_time ? `${item.read_time} دقيقة قراءة` : item.duration}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
