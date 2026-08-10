import { MetadataRoute } from "next"
import { createPublicClient } from "@/lib/supabase/public"

// Refresh the sitemap every hour so new content shows up quickly.
// (Was 86400 / 24h which made indexing slow for fresh content.)
export const revalidate = 3600

// Use one canonical host everywhere. Without this, we end up mixing
// `www.elsayedmourad.com` and `elsayedmourad.com` between the
// sitemap, robots.txt, and JSON-LD, which Google treats as duplicate hosts.
const CANONICAL_BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://elsayedmourad.com"

// Supabase caps un-limited selects at 1000 rows. `media` alone is already 510
// rows and growing, so every query below asks for an explicit ceiling instead
// of silently truncating once a table crosses the default limit.
const MAX_ROWS_PER_TABLE = 5000

// Legal/boilerplate pages genuinely do not change. Previously these carried
// `lastModified: new Date()`, so every single sitemap fetch reported that all
// 12 static pages had just been modified. Google learns to distrust lastmod
// site-wide when that happens, and then ignores it for the real content too.
const STATIC_PAGE_LAST_MODIFIED = new Date("2025-01-01T00:00:00.000Z")

function buildUrl(path: string): string {
    if (!path) return CANONICAL_BASE_URL
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    return `${CANONICAL_BASE_URL}${cleanPath}`
}

function safeDate(...candidates: Array<string | null | undefined>): Date | undefined {
    for (const candidate of candidates) {
        if (!candidate) continue
        const parsed = new Date(candidate)
        if (!isNaN(parsed.getTime())) return parsed
    }
    // Better to omit lastmod than to invent "now" — a wrong date is worse
    // than no date.
    return undefined
}

type ContentRow = {
    id: string
    slug?: string | null
    updated_at?: string | null
    created_at?: string | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createPublicClient()

    // Index/listing pages reflect the newest content; the rest are static.
    const listingPages = ["", "/dars", "/khutba", "/books", "/articles", "/videos"]

    const staticRouteDefs = [
        { path: "", changeFrequency: "daily" as const, priority: 1.0 },
        { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
        { path: "/contact", changeFrequency: "yearly" as const, priority: 0.4 },
        { path: "/dars", changeFrequency: "daily" as const, priority: 0.9 },
        { path: "/khutba", changeFrequency: "daily" as const, priority: 0.9 },
        { path: "/books", changeFrequency: "weekly" as const, priority: 0.8 },
        { path: "/articles", changeFrequency: "daily" as const, priority: 0.9 },
        { path: "/videos", changeFrequency: "daily" as const, priority: 0.8 },
        { path: "/schedule", changeFrequency: "weekly" as const, priority: 0.6 },
        { path: "/projects", changeFrequency: "monthly" as const, priority: 0.5 },
        { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.2 },
        { path: "/terms", changeFrequency: "yearly" as const, priority: 0.2 },
    ]

    const buildStaticRoutes = (newestContentDate?: Date): MetadataRoute.Sitemap =>
        staticRouteDefs.map((r) => ({
            url: buildUrl(r.path),
            lastModified: listingPages.includes(r.path)
                ? newestContentDate ?? STATIC_PAGE_LAST_MODIFIED
                : STATIC_PAGE_LAST_MODIFIED,
            changeFrequency: r.changeFrequency,
            priority: r.priority,
        }))

    try {
        // Dynamic content — ONLY published items. An earlier version ignored
        // publish_status and leaked drafts into the sitemap.
        const [sermons, lessons, books, articles, media] = await Promise.all([
            supabase
                .from("sermons")
                .select("id, slug, updated_at, created_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false })
                .limit(MAX_ROWS_PER_TABLE),
            supabase
                .from("lessons")
                .select("id, slug, updated_at, created_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false })
                .limit(MAX_ROWS_PER_TABLE),
            supabase
                .from("books")
                .select("id, slug, updated_at, created_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false })
                .limit(MAX_ROWS_PER_TABLE),
            supabase
                .from("articles")
                .select("id, slug, updated_at, created_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false })
                .limit(MAX_ROWS_PER_TABLE),
            supabase
                .from("media")
                .select("id, updated_at, created_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false })
                .limit(MAX_ROWS_PER_TABLE),
        ])

        const dynamicRoutes: MetadataRoute.Sitemap = []
        let newestContentTime = 0

        const pushContent = (
            items: ContentRow[] | null | undefined,
            prefix: string,
            opts: { priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }
        ) => {
            items?.forEach((item) => {
                // Prefer slug for canonical URLs; fall back to id.
                // encodeURI handles Arabic slugs correctly.
                const identifier = item.slug ? encodeURI(item.slug) : item.id
                if (!identifier) return

                const lastModified = safeDate(item.updated_at, item.created_at)
                if (lastModified && lastModified.getTime() > newestContentTime) {
                    newestContentTime = lastModified.getTime()
                }

                dynamicRoutes.push({
                    url: buildUrl(`${prefix}/${identifier}`),
                    ...(lastModified ? { lastModified } : {}),
                    changeFrequency: opts.changeFrequency,
                    priority: opts.priority,
                })
            })
        }

        pushContent(sermons.data as ContentRow[], "/khutba", { priority: 0.7, changeFrequency: "weekly" })
        pushContent(lessons.data as ContentRow[], "/dars", { priority: 0.7, changeFrequency: "weekly" })
        pushContent(books.data as ContentRow[], "/books", { priority: 0.6, changeFrequency: "monthly" })
        pushContent(articles.data as ContentRow[], "/articles", { priority: 0.7, changeFrequency: "weekly" })
        // `media` uses id-based routes (/videos/[id]) — no slug column exists.
        pushContent(media.data as ContentRow[], "/videos", { priority: 0.5, changeFrequency: "monthly" })

        const newestContentDate = newestContentTime ? new Date(newestContentTime) : undefined

        return [...buildStaticRoutes(newestContentDate), ...dynamicRoutes]
    } catch (error) {
        console.error("[v0] Sitemap generation error:", error)
        // Never fail the sitemap entirely — always return static routes
        // so Google still gets something valid.
        return buildStaticRoutes()
    }
}
