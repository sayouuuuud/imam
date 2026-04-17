import { revalidatePath } from "next/cache"
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
]

const SEO_ARTIFACTS = ["/sitemap.xml", "/robots.txt"]

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const paths: string[] | null = body.paths || (body.path ? [body.path] : null)

        const targets = paths && paths.length > 0 ? paths : DEFAULT_PATHS
        const deduped = Array.from(new Set([...targets, ...SEO_ARTIFACTS]))

        for (const p of deduped) {
            try {
                revalidatePath(p)
            } catch (err) {
                console.warn("[v0] Failed to revalidate", p, err)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Revalidated ${deduped.length} paths (including sitemap & robots)`,
            paths: deduped,
        })
    } catch (error) {
        console.error("[v0] Revalidate error:", error)
        return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 })
    }
}
