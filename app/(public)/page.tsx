
import type { Metadata } from "next"
import { createPublicClient } from "@/lib/supabase/public"
import { buildPageMetadata } from "@/lib/seo/page-metadata"
import { HeroSection } from "@/components/home/hero-section"
import { LatestContent } from "@/components/home/latest-lessons"
import { ExploreSections } from "@/components/home/explore-sections"
import { FeaturedBooks } from "@/components/home/featured-books"

import { LatestSermons } from "@/components/home/latest-sermons"
import { LatestVideos } from "@/components/home/latest-videos"
import { NewsletterSection } from "@/components/home/newsletter-section"
import { ScrollAnimation } from "@/components/ui/scroll-animation"
import { unstable_cache } from "next/cache"

export const revalidate = 60

// Cache all home page data for 60 seconds
const getHomePageData = unstable_cache(
  async () => {
    const supabase = createPublicClient()

    const queryResults = await Promise.all([
      supabase.from("hero_section").select("*").order("updated_at", { ascending: false }).limit(1),
      supabase
        .from("lessons")
        .select("id, title, description, created_at, type, media_source, duration, author_name, thumbnail, thumbnail_path")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("sermons")
        .select("id, title, description, created_at")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("articles")
        .select("id, title, excerpt, author, created_at, read_time, thumbnail, featured_image, views_count")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("books")
        .select("*")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("media")
        .select("id, title, description, created_at, duration, thumbnail, url")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(4),
    ])

    return {
      heroDataArray: queryResults[0].data,
      lessons: queryResults[1].data,
      sermons: queryResults[2].data,
      articles: queryResults[3].data,
      books: queryResults[4].data,
      videos: queryResults[5].data,
    }
  },
  ["home_page_data"],
  { revalidate: 60 }
)

export async function generateMetadata(): Promise<Metadata> {
  // Reads the admin's /admin/seo values (global + per-page row for "/")
  // so that changes made in the dashboard actually reach Google.
  return buildPageMetadata("/", {
    title: "الرئيسية",
    description:
      "منصة إسلامية شاملة تقدم خطب ودروس علمية ومقالات وكتب من الشيخ السيد مراد. تعلم العلم الشرعي بسهولة ويسر.",
  })
}

function getPrimaryImageUrl(thumbnail: string | null, featuredImage: string | null): string | null {
  const isFeaturedPlaceholder = !featuredImage || featuredImage.includes("placeholder")
  const isThumbnailPlaceholder = !thumbnail || thumbnail.includes("placeholder")

  if (!isFeaturedPlaceholder) {
    return featuredImage?.startsWith("uploads/")
      ? `/api/download?key=${encodeURIComponent(featuredImage)}`
      : featuredImage
  } else if (!isThumbnailPlaceholder) {
    return thumbnail?.startsWith("uploads/") ? `/api/download?key=${encodeURIComponent(thumbnail)}` : thumbnail
  } else {
    return null
  }
}

export default async function HomePage() {
  // Use cached data
  const {
    heroDataArray,
    lessons,
    sermons,
    articles,
    books,
    videos,
  } = await getHomePageData()


  // Convert article image keys to download URLs
  const articlesWithImageUrls =
    articles?.map((article) => {
      const primaryImageUrl = getPrimaryImageUrl(article.thumbnail, article.featured_image)
      return {
        ...article,
        thumbnailUrl: article.thumbnail?.startsWith("uploads/")
          ? `/api/download?key=${encodeURIComponent(article.thumbnail)}`
          : article.thumbnail,
        featuredImageUrl: article.featured_image?.startsWith("uploads/")
          ? `/api/download?key=${encodeURIComponent(article.featured_image)}`
          : article.featured_image,
        // Determine primary image for display
        primaryImageUrl: primaryImageUrl || undefined,
      }
    }) || []


  // Get first item from array or null
  const heroData = heroDataArray?.[0] || null

  // تجميع المحتويات من مصادر مختلفة

  const latestContent = [
    ...(Array.isArray(lessons)
      ? lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content_type: "lesson" as const,
        created_at: lesson.created_at,
        duration: lesson.duration,
        author: lesson.author_name,
        thumbnail: lesson.thumbnail_path || lesson.thumbnail,
      }))
      : []),
    ...(Array.isArray(sermons)
      ? sermons.map((sermon) => ({
        id: sermon.id,
        title: sermon.title,
        description: sermon.description,
        content_type: "sermon" as const,
        created_at: sermon.created_at,
      }))
      : []),
    ...(Array.isArray(articles)
      ? articles.map((article) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        content_type: "article" as const,
        created_at: article.created_at,
        read_time: article.read_time,
        author: article.author,
        thumbnail: article.featured_image || article.thumbnail,
      }))
      : []),
    ...(Array.isArray(books)
      ? books.map((book: any) => ({
        id: book.id,
        title: book.title,
        description: book.description,
        author: book.author,
        content_type: "book" as const,
        created_at: book.created_at,
        thumbnail: book.cover_image_path,
      }))
      : []),
    ...(Array.isArray(videos)
      ? videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        content_type: "video" as const,
        created_at: video.created_at,
        duration: video.duration,
        thumbnail: video.thumbnail,
        url: video.url,
      }))
      : []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)


  return (
    <div className="bg-[#fdfbf7] dark:bg-background bg-pattern">

      <ScrollAnimation>
        <HeroSection data={heroData} />
      </ScrollAnimation>

      {/* Latest Content Section - Full Width */}
      <section className="py-12 lg:py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollAnimation delay={0.1}>
            <LatestContent content={latestContent} />
          </ScrollAnimation>
        </div>
      </section>

      <ScrollAnimation delay={0.2}>
        <ExploreSections />
      </ScrollAnimation>

      <ScrollAnimation delay={0.3}>
        <FeaturedBooks books={Array.isArray(books) ? books : []} />
      </ScrollAnimation>

      <ScrollAnimation delay={0.4}>
        <LatestSermons sermons={Array.isArray(sermons) ? sermons : []} />
      </ScrollAnimation>

      <ScrollAnimation delay={0.45}>
        <LatestVideos videos={Array.isArray(videos) ? videos : []} />
      </ScrollAnimation>

      <ScrollAnimation delay={0.5}>
        <NewsletterSection />
      </ScrollAnimation>
    </div>
  )
}
