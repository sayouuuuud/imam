import { revalidatePath, revalidateTag } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

const DEFAULT_PATHS = [
    "/",
    "/about",
    "/khutba",
    "/dars",
    "/articles",
    "/books",
    "/videos",
    "/schedule",
    "/projects",
    "/contact",
    "/search",
    "/dars/fiqh",
    "/dars/seerah",
    "/sermons",
]

const SEO_ARTIFACTS = ["/sitemap.xml", "/robots.txt"]

// Tags that cached data uses. Busting these forces the next request to refetch
// `site_settings` / `seo_settings` from Supabase, which is what makes the
// admin's SEO edits visible on the actual pages.
const DEFAULT_TAGS = ["seo-settings", "site-settings"]

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const paths: string[] | null = body.paths || (body.path ? [body.path] : null)
        const tags: string[] | null = body.tags ?? null

        const targetPaths = paths && paths.length > 0 ? paths : DEFAULT_PATHS
        const dedupedPaths = Array.from(new Set([...targetPaths, ...SEO_ARTIFACTS]))

        for (const p of dedupedPaths) {
            try {
                revalidatePath(p)
            } catch (err) {
                console.warn("[v0] Failed to revalidate path", p, err)
            }
        }

        const targetTags = tags && tags.length > 0 ? tags : DEFAULT_TAGS
        for (const t of targetTags) {
            try {
                revalidateTag(t)
            } catch (err) {
                console.warn("[v0] Failed to revalidate tag", t, err)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Revalidated ${dedupedPaths.length} paths and ${targetTags.length} tags`,
            paths: dedupedPaths,
            tags: targetTags,
        })
    } catch (error) {
        console.error("[v0] Revalidate error:", error)
        return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 })
    }
}
