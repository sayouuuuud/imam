import { createPublicClient } from "@/lib/supabase/public"

// Refresh the feed once an hour. RSS readers poll periodically so this is
// a reasonable sweet spot between freshness and cache hit rate.
export const revalidate = 3600

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://elsayed-mourad.online"
).replace(/\/$/, "")

function escapeXml(str: string): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return ""
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Unified RSS 2.0 feed covering articles, خطب, and دروس.
 *
 * Why this matters for SEO:
 *  - Gives search engines and aggregators a lightweight freshness signal
 *    independent of sitemap cache.
 *  - Enables <link rel="alternate" type="application/rss+xml"> autodiscovery
 *    which Google News and Arabic content aggregators use.
 *  - Bing / Yandex pick up new items via feed polling in addition to
 *    IndexNow submissions.
 */
export async function GET() {
  const supabase = createPublicClient()

  try {
    const [articles, sermons, lessons] = await Promise.all([
      supabase
        .from("articles")
        .select("id, slug, title, content, created_at, updated_at, author")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("sermons")
        .select("id, slug, title, description, created_at, updated_at")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("lessons")
        .select("id, slug, title, description, created_at, updated_at")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(20),
    ])

    type FeedItem = {
      title: string
      url: string
      description: string
      pubDate: string
      category: string
      author?: string
    }

    const items: FeedItem[] = []

    articles.data?.forEach((a) => {
      const ident = a.slug || a.id
      items.push({
        title: a.title,
        url: `${SITE_URL}/articles/${ident}`,
        description: stripHtml(a.content).slice(0, 400),
        pubDate: new Date(a.updated_at || a.created_at).toUTCString(),
        category: "مقالات",
        author: a.author || undefined,
      })
    })

    sermons.data?.forEach((s) => {
      const ident = s.slug || s.id
      items.push({
        title: s.title,
        url: `${SITE_URL}/khutba/${ident}`,
        description: stripHtml(s.description).slice(0, 400),
        pubDate: new Date(s.updated_at || s.created_at).toUTCString(),
        category: "خطب",
      })
    })

    lessons.data?.forEach((l) => {
      const ident = l.slug || l.id
      items.push({
        title: l.title,
        url: `${SITE_URL}/dars/${ident}`,
        description: stripHtml(l.description).slice(0, 400),
        pubDate: new Date(l.updated_at || l.created_at).toUTCString(),
        category: "دروس",
      })
    })

    // Newest first across all categories, cap at 50.
    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    const latest = items.slice(0, 50)

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>الشيخ السيد مراد سلامة — أحدث المحتوى</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>أحدث الخطب والدروس والمقالات من الموقع الرسمي للشيخ السيد مراد سلامة</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
${latest
  .map(
    (i) => `    <item>
      <title>${escapeXml(i.title)}</title>
      <link>${escapeXml(i.url)}</link>
      <guid isPermaLink="true">${escapeXml(i.url)}</guid>
      <description>${escapeXml(i.description)}</description>
      <category>${escapeXml(i.category)}</category>
      ${i.author ? `<dc:creator>${escapeXml(i.author)}</dc:creator>` : ""}
      <pubDate>${i.pubDate}</pubDate>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (err) {
    console.error("[v0] RSS feed generation error:", err)
    // Never return a broken feed — empty channel is better than 500.
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>الشيخ السيد مراد سلامة</title>
<link>${SITE_URL}</link>
<description>RSS</description>
</channel></rss>`
    return new Response(fallback, {
      status: 200,
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    })
  }
}
