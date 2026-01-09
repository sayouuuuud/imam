import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

interface Article {
  id: string
  title: string
  content: string
  author: string
  thumbnail?: string
  created_at: string
  views_count: number
}

interface ArticleWithImageUrls extends Article {
  thumbnailUrl?: string
  featuredImageUrl?: string
  primaryImageUrl?: string
}

interface LatestArticlesProps {
  articles: ArticleWithImageUrls[]
}

export function LatestArticles({ articles }: LatestArticlesProps) {
  return (
    <section className="py-16 bg-background dark:bg-background">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
<div>
            <span className="text-xs font-bold text-primary dark:text-secondary bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full mb-3 inline-block">
              المقالات العلمية
            </span>
<h2 className="text-4xl font-bold font-serif text-foreground dark:text-white">أحدث المقالات</h2>
</div>
          <Link
            href="/articles"
            className="hidden sm:flex items-center gap-2 text-text-muted dark:text-text-subtext hover:text-primary dark:hover:text-secondary transition bg-surface dark:bg-card px-4 py-2 rounded-lg text-sm"
          >
            عرض كل المقالات
            <span className="material-icons-outlined text-sm rtl-flip">arrow_right_alt</span>
</Link>
        </div>

        {articles.length === 0 ? (
          <p className="text-text-muted dark:text-text-subtext text-center py-12">لا توجد مقالات حالياً</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link href={`/articles/${article.id}`}
key = {article.id}>
<article className="bg-surface dark:bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-border dark:border-border group h-full">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
<ImageWithFallback
                      src={article.primaryImageUrl || "/placeholder.svg"}
alt = {article.title}
className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                  </div>
<div className="p-5">
                    {/* Title */}
                    <h3 className="text-xl font-bold mb-3 text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Author */}
                    <div className="flex items-center gap-2 text-sm text-secondary font-medium">
<span className="material-icons-outlined text-sm">person</span>
<span>{article.author}</span>
</div>

                    {/* Date */}
                    <div className="mt-3 pt-3 border-t border-border">
<span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: ar })}
                      </span>
</div>
                  </div>
</article>
              </Link>
            ))}
          </div>
        )}
      </div>
</section>
  )
}
