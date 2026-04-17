import { MetadataRoute } from "next"
import { createPublicClient } from "@/lib/supabase/public"

// Refresh the sitemap every hour so new content shows up quickly.
// (Was 86400 / 24h which made indexing slow for fresh content.)
export const revalidate = 3600

// Use one canonical host everywhere. Without this, we end up mixing
// `www.elsayed-mourad.online` and `elsayed-mourad.online` between the
// sitemap, robots.txt, and JSON-LD, which Google treats as duplicate hosts.
const CANONICAL_BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://elsayed-mourad.online"

function buildUrl(path: string): string {
    if (!path) return CANONICAL_BASE_URL
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    return `${CANONICAL_BASE_URL}${cleanPath}`
}

function safeDate(d: string | null | undefined): Date {
    if (!d) return new Date()
    const parsed = new Date(d)
    return isNaN(parsed.getTime()) ? new Date() : parsed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createPublicClient()

    // 1. Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
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
    ].map((r) => ({
        url: buildUrl(r.path),
        lastModified: new Date(),
        changeFrequency: r.changeFrequency,
        priority: r.priority,
    }))

    try {
        // 2. Dynamic content — ONLY published items.
        //    Previous version ignored publish_status and leaked drafts into
        //    the sitemap, which Google rightly treated as low-quality noise.
        const [sermons, lessons, books, articles, media] = await Promise.all([
            supabase
                .from("sermons")
                .select("id, slug, updated_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false }),
            supabase
                .from("lessons")
                .select("id, slug, updated_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false }),
            supabase
                .from("books")
                .select("id, slug, updated_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false }),
            supabase
                .from("articles")
                .select("id, slug, updated_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false }),
            supabase
                .from("media")
                .select("id, updated_at")
                .eq("publish_status", "published")
                .order("updated_at", { ascending: false }),
        ])

        const dynamicRoutes: MetadataRoute.Sitemap = []

        const pushContent = (
            items: Array<{ id: string; slug?: string | null; updated_at: string | null }> | null | undefined,
            prefix: string,
            opts: { priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }
        ) => {
            items?.forEach((item) => {
                // Prefer slug for canonical URLs; fall back to id.
                // encodeURI handles Arabic slugs correctly.
                const identifier = item.slug
                    ? encodeURI(item.slug)
                    : item.id
                if (!identifier) return
                dynamicRoutes.push({
                    url: buildUrl(`${prefix}/${identifier}`),
                    lastModified: safeDate(item.updated_at),
                    changeFrequency: opts.changeFrequency,
                    priority: opts.priority,
                })
            })
        }

        pushContent(sermons.data, "/khutba", { priority: 0.7, changeFrequency: "weekly" })
        pushContent(lessons.data, "/dars", { priority: 0.7, changeFrequency: "weekly" })
        pushContent(books.data, "/books", { priority: 0.6, changeFrequency: "monthly" })
        pushContent(articles.data, "/articles", { priority: 0.7, changeFrequency: "weekly" })
        // `media` uses id-based routes (/videos/[id])
        pushContent(
            media.data?.map((m) => ({ id: m.id, slug: null, updated_at: m.updated_at })),
            "/videos",
            { priority: 0.6, changeFrequency: "monthly" }
        )

        return [...staticRoutes, ...dynamicRoutes]
    } catch (error) {
        console.error("[v0] Sitemap generation error:", error)
        // Never fail the sitemap entirely — always return static routes
        // so Google still gets something valid.
        return staticRoutes
    }
}
