"use client"

import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ShareButtons } from "@/components/share-buttons"
import { SafeHtml } from "@/components/ui/safe-html"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { useEffect, useState } from "react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ArticleDetailPage({ params }: PageProps) {
  const [articleData, setArticleData] = useState<any>(null)
  const [articleWithImageUrls, setArticleWithImageUrls] = useState<any>(null)
  const [relatedArticlesData, setRelatedArticlesData] = useState<any[]>([])
  const [relatedArticlesWithImageUrls, setRelatedArticlesWithImageUrls] = useState<any[]>([])
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const { id } = await params
        const supabase = createPublicClient()

        // Fetch article details
        const { data: article, error } = await supabase
          .from("articles")
          .select("*")
          .eq("id", id)
          .eq("publish_status", "published")
          .single()

        if (error || !article) {
          notFound()
          return
        }

        // Increment views count
        await supabase
          .from("articles")
          .update({ views_count: (article.views_count || 0) + 1 })
          .eq("id", id)

        // Convert image keys to download URLs
        const articleWithImageUrls = {
          ...article,
          thumbnailUrl: article.thumbnail?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(article.thumbnail)}` : article.thumbnail,
          featuredImageUrl: article.featured_image?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(article.featured_image)}` : article.featured_image,
          primaryImageUrl: getPrimaryImageUrl(article.thumbnail, article.featured_image)
        }

        // Fetch related articles
        const { data: relatedArticles } = await supabase
          .from("articles")
          .select("id, title, author, featured_image, created_at")
          .eq("publish_status", "published")
          .neq("id", id)
          .limit(3)

        // Convert related articles image keys to download URLs
        const processedRelatedArticles = relatedArticles?.map(relatedArticle => ({
          ...relatedArticle,
          featuredImageUrl: relatedArticle.featured_image?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(relatedArticle.featured_image)}` : relatedArticle.featured_image,
        })) || []

        setArticleData(article)
        setArticleWithImageUrls(articleWithImageUrls)
        setRelatedArticlesData(relatedArticles || [])
        setRelatedArticlesWithImageUrls(processedRelatedArticles)

        // Set content element for PDF export
        setTimeout(() => {
          const element = document.getElementById('article-content')
          setContentElement(element)
        }, 100)

      } catch (error) {
        console.error('Error loading article:', error)
        notFound()
      }
    }

    loadArticle()
  }, [params])

  // Helper function to determine which image to show
  function getPrimaryImageUrl(thumbnail: string | null, featuredImage: string | null): string | null {
    // Priority: featured_image if it's not a placeholder, then thumbnail if it's not a placeholder
    const isFeaturedPlaceholder = !featuredImage || featuredImage.includes('placeholder')
    const isThumbnailPlaceholder = !thumbnail || thumbnail.includes('placeholder')

    if (!isFeaturedPlaceholder) {
      return featuredImage?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(featuredImage)}` : featuredImage
    } else if (!isThumbnailPlaceholder) {
      return thumbnail?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(thumbnail)}` : thumbnail
    } else {
      return null // Will show placeholder
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (!articleData || !articleWithImageUrls) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">جاري تحميل المقال...</p>
        </div>
      </div>
    )
  }

  const article = articleData

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Print styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-content, #print-content * {
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
          <span className="material-icons-outlined text-xs mx-2">chevron_left</span>
          <Link href="/articles" className="hover:text-primary">
            المقالات
          </Link>
          <span className="material-icons-outlined text-xs mx-2">chevron_left</span>
          <span className="text-primary font-medium">{article.title}</span>
        </nav>

        {/* Article Header */}
        <article id="article-content">
          {/* Print-only content */}
          <div id="print-content" className="hidden print:block print:p-8 print:max-w-none print:text-black print:bg-white">
            <div className="print:text-center print:mb-8 print:border-b-2 print:border-gray-300 print:pb-4">
              <h1 className="print:text-3xl print:font-bold print:mb-4 print:text-gray-900">{article.title}</h1>
              <div className="print:flex print:justify-between print:text-sm print:text-gray-600">
                <span>الكاتب: {article.author}</span>
                <span>التاريخ: {formatDate(article.created_at)}</span>
                <span>وقت القراءة: {article.read_time || 5} دقائق</span>
              </div>
            </div>

            <div className="print:text-gray-800 print:leading-relaxed">
              <SafeHtml
                html={article.content}
                className="print:text-base print:leading-8 print:text-gray-900"
              />
            </div>
          </div>

          {/* Screen content */}
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
            <ImageWithFallback
              src={articleWithImageUrls.primaryImageUrl || "/placeholder.svg"}
              alt={article.title}
              className="w-full h-96 object-cover"
            />
          </div>

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-text-muted no-print">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-sm">person</span>
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-sm">calendar_today</span>
                <span>{formatDate(article.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-sm">visibility</span>
                <span>{article.views_count || 0} مشاهدة</span>
              </div>
            </div>
          </div>

          <SafeHtml
            html={article.content}
className="prose prose-lg max-w-none mb-12 prose-headings:text-foreground prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-bold prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-li:mb-1 prose-blockquote:text-foreground prose-blockquote:border-primary prose-blockquote:bg-muted prose-blockquote:p-4 prose-blockquote:rounded-lg prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-a:text-primary prose-a:underline hover:prose-a:no-underline dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-strong:text-white dark:prose-li:text-gray-300 dark:prose-blockquote:text-white dark:prose-code:text-blue-400 dark:prose-pre:text-gray-200"
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-8 pb-8 border-b border-border no-print">
              <h3 className="font-bold text-foreground mb-3">الوسوم</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string, index: number) => (
                  <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-12 pb-12 border-b border-border no-print">
            <h3 className="font-bold text-foreground mb-4">مشاركة المقال</h3>
            <ShareButtons
              title={article.title}
              content={article.content}
              author={article.author}
              readTime={article.read_time}
            />
          </div>



          {/* Related Articles */}
          {relatedArticlesWithImageUrls && relatedArticlesWithImageUrls.length > 0 && (
            <div className="no-print">
              <h2 className="text-2xl font-bold text-foreground mb-6">مقالات ذات صلة</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticlesWithImageUrls.map((relatedArticle) => (
                  <Link key={relatedArticle.id} href={`/articles/${relatedArticle.id}`} className="group">
                    <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-colors">
                      <ImageWithFallback
                        src={relatedArticle.featuredImageUrl || "/placeholder.svg"}
                        alt={relatedArticle.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedArticle.title}
                        </h3>
                        <p className="text-sm text-text-muted">{relatedArticle.author}</p>
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
