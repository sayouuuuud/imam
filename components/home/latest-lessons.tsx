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

const TYPE_META: Record<
  ContentItem["content_type"],
  { label: string; href: (id: string) => string; badge: string; icon: React.ReactNode }
> = {
  article: {
    label: "مقالة",
    href: (id) => `/articles/${id}`,
    badge: "bg-primary/10 text-primary border-primary/20",
    icon: <FileText className="h-5 w-5" />,
  },
  sermon: {
    label: "خطبة",
    href: (id) => `/khutba/${id}`,
    badge: "bg-secondary/10 text-secondary border-secondary/20",
    icon: <Mic className="h-5 w-5" />,
  },
  lesson: {
    label: "درس",
    href: (id) => `/dars/${id}`,
    badge: "bg-primary/10 text-primary border-primary/20",
    icon: <Play className="h-5 w-5" />,
  },
  book: {
    label: "كتاب",
    href: (id) => `/books/${id}`,
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: <BookOpen className="h-5 w-5" />,
  },
  video: {
    label: "مرئي",
    href: (id) => `/videos/${id}`,
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: <Video className="h-5 w-5" />,
  },
}

export function LatestContent({ content }: LatestContentProps) {
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="bg-secondary/10 text-secondary p-2.5 rounded-xl border border-secondary/20">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground leading-tight">أحدث المحتويات</h2>
            <p className="text-sm text-muted-foreground mt-1">جديد الدروس والخطب والمقالات والكتب في مكان واحد.</p>
          </div>
        </div>
        <Link
          href="/search"
          className="text-xs font-bold text-primary hover:text-primary/70 flex items-center gap-1.5 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 transition-all"
        >
          المكتبة الكاملة
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      {content.length === 0 ? (
        <div className="text-center py-16 bg-card/60 dark:bg-card/40 backdrop-blur-sm rounded-2xl border border-border/60">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">لا توجد محتويات حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {content.map((item) => {
            const meta = TYPE_META[item.content_type] ?? TYPE_META.article
            const description = item.excerpt || item.description
            const cleanDescription = description ? stripHtml(description) : ""
            const thumbnailUrl = getThumbnailUrl(item)
            const metaLine = item.read_time ? `${item.read_time} دقيقة قراءة` : item.duration

            return (
              <Link
                key={`${item.content_type}-${item.id}`}
                href={meta.href(item.id)}
                className="group flex flex-col bg-card/70 dark:bg-card/40 backdrop-blur-sm border border-border/60 dark:border-border/30 rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 shadow-sm hover:shadow-xl"
              >
                <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                  {thumbnailUrl ? (
                    item.content_type === "book" ? (
                      <>
                        <img
                          src={thumbnailUrl}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-50"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <img
                          src={thumbnailUrl}
                          alt={item.title}
                          className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </>
                    ) : (
                      <img
                        src={thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                      <span className="text-primary/50 [&>svg]:h-10 [&>svg]:w-10">{meta.icon}</span>
                    </div>
                  )}
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md border backdrop-blur-md bg-background/80 ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
                    {item.title}
                  </h3>
                  {cleanDescription && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                      {cleanDescription}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar })}
                    </span>
                    {metaLine && (
                      <span className="flex items-center gap-1.5 font-bold">
                        <Clock className="h-3 w-3" />
                        {metaLine}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
