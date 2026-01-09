import type { Metadata } from "next"
import { createPublicClient } from "@/lib/supabase/public"
import { HeroSection } from "@/components/home/hero-section"
import { LatestContent } from "@/components/home/latest-lessons"
import { WeeklySchedule } from "@/components/home/weekly-schedule"
import { ExploreSections } from "@/components/home/explore-sections"
import { FeaturedBooks } from "@/components/home/featured-books"
import { LatestArticles } from "@/components/home/latest-articles"
import { NewsletterSection } from "@/components/home/newsletter-section"
import { DebugTheme } from "@/components/debug-theme"

export const revalidate = 60

export const metadata: Metadata = {
  title: "الرئيسية",
  description:
    "منصة إسلامية شاملة تقدم خطب ودروس علمية ومقالات وكتب من الشيخ السيد مراد. تعلم العلم الشرعي بسهولة ويسر.",
  openGraph: {
    title: "الشيخ السيد مراد - الرئيسية",
    description: "منصة إسلامية شاملة تقدم خطب ودروس وكتب إسلامية",
    type: "website",
  },
}

function formatTime12h(time: string | null): string {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? "م" : "ص"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function getDayName(day: string | null): string {
  const days: Record<string, string> = {
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
  }
  return day ? days[day.toLowerCase()] || day : ""
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
  const supabase = createPublicClient()


  // جلب البيانات من مصادر مختلفة

  const queryResults = await Promise.all([
    supabase.from("hero_section").select("*").order("updated_at", { ascending: false }).limit(1),
    supabase
      .from("lessons")
      .select("id, title, description, created_at, type, media_source, duration")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("sermons")
      .select("id, title, description, created_at")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("articles")
      .select("id, title, excerpt, content, author, created_at, read_time, thumbnail, featured_image, views_count")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("events")
      .select("*")
      .eq("type", "weekly")
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .limit(5),
    supabase
      .from("books")
      .select("*")
      .eq("publish_status", "published")
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  const heroDataArray = queryResults[0].data
  const lessons = queryResults[1].data
  const sermons = queryResults[2].data
  const articles = queryResults[3].data
  const weeklyEvents = queryResults[4].data
  const books = queryResults[5].data


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
        }))
      : []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)


  const schedule = (Array.isArray(weeklyEvents) ? weeklyEvents : []).map((event, index) => ({
    id: event.id,
    day_name: getDayName(event.day_of_week),
    time_text: formatTime12h(event.event_time),
    title: event.title,
    description: event.description,
    is_active: event.is_active ?? true,
    sort_order: event.order_index ?? index,
  }))


  return (
    <>
      <DebugTheme />
      <HeroSection data={heroData} />

      {/* Latest Content & Schedule Section */}
      <section className="py-12 lg:py-16 bg-surface dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <LatestContent content={latestContent} />
            <WeeklySchedule schedule={schedule} />
          </div>
        </div>
      </section>
      <ExploreSections />
      <FeaturedBooks books={Array.isArray(books) ? books : []} />
      <LatestArticles articles={Array.isArray(articlesWithImageUrls) ? articlesWithImageUrls : []} />
      <NewsletterSection />
    </>
  )
}
