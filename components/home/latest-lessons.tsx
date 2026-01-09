import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { FileText, Play, ArrowLeft, Clock, Mic } from "lucide-react"
import { stripHtml } from "@/lib/utils/strip-html"

export const revalidate = 60

interface ContentItem {
  id: string
  title: string
  description?: string | null
  excerpt?: string | null
  content_type: "article" | "sermon" | "lesson"
  created_at: string
  thumbnail?: string | null
  read_time?: number | null
  duration?: string | null
}

interface LatestContentProps {
  content: ContentItem[]
}

export function LatestContent({ content }: LatestContentProps) {
  return (
    <div>
<div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
<span className="bg-info-bg text-info-border p-2.5 rounded-xl shadow-sm">
            <FileText className="h-5 w-5" />
</span>
<h3 className="text-2xl font-bold font-serif text-foreground">أحدث المحتويات</h3>
</div>
        <Link href="/articles" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          عرض المكتبة
          <ArrowLeft className="h-4 w-4" />
</Link>
</div>
<div className="space-y-3">
        {content.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-2xl border border-border">
<FileText className="h-12 w-12 mx-auto text-text-muted mb-4" />
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
                default:
                  return "#"
              }
            }

const getItemIcon = () => {
              switch (item.content_type) {
                case "article":
                  return <FileText className="h-6 w-6" />
                case "sermon":
                  return <Mic className="h-6 w-6" />
                case "lesson":
                  return <Play className="h-6 w-6" />
                default:
                  return <FileText className="h-6 w-6" />
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
                default:
                  return ""
              }
            }

const getItemTypeColor = () => {
              switch (item.content_type) {
                case "article":
                  return "bg-info-bg text-info-border"
                case "sermon":
                  return "bg-success-bg text-success-border"
                case "lesson":
                  return "bg-accent text-accent-foreground"
                default:
                  return "bg-muted text-muted-foreground"
              }
            }

const description = item.excerpt || item.description
            const cleanDescription = description ? stripHtml(description) : ""

            return (
              <Link
                key={`${item.content_type}-${item.id}`}
href={getItemUrl()}
className="block bg-card hover:bg-card-hover border-2 border-border rounded-xl p-4 transition-all hover:shadow-lg group"
              >
<div className="flex gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${getItemTypeColor()}`}
                  >
                    {getItemIcon()}
                  </div>
<div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
<span className={`text-xs px-2 py-0.5 rounded-full ${getItemTypeColor()}`}>
                        {getItemTypeLabel()}
                      </span>
<span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </span>
</div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    {cleanDescription && (
                      <p className="text-sm text-text-muted line-clamp-1 mt-1">{cleanDescription}</p>
                    )}
                    {(item.read_time || item.duration) && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
<Clock className="h-3 w-3" />
                        <span>{item.read_time ? `${item.read_time} دقيقة قراءة` : item.duration}</span>
</div>
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
