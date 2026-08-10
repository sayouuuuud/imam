import { MetadataRoute } from "next"
import { getSiteSettings } from "@/lib/site-settings"

// Keep the same canonical host used by the sitemap & JSON-LD.
const CANONICAL_BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://elsayedmourad.com"

export const revalidate = 3600

/**
 * Dynamic robots.txt.
 *
 * Previous version was hardcoded and ignored the `robots_txt` field that the
 * admin panel lets the user edit, so those edits silently did nothing.
 *
 * This version:
 *  - Always blocks /admin, /api, /login, /private.
 *  - Always advertises the sitemap (single canonical host).
 *  - Lets the admin append extra rules via the `robots_txt` setting.
 *    (Next.js's MetadataRoute.Robots doesn't support raw blobs, so if the
 *    admin sets a full custom body we fall back to parsing a small subset of
 *    directives.)
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
    const settings = await getSiteSettings().catch(() => ({} as Record<string, string>))
    const customDisallow = parseDirectiveList(settings.robots_txt, "Disallow")
    const customAllow = parseDirectiveList(settings.robots_txt, "Allow")

    // Block all internal/non-public surfaces. /search would otherwise let
    // Google index a blank or repeated results page for every query string,
    // which hurts the overall site quality score.
    const baseDisallow = [
        "/admin/",
        "/api/",
        "/login",
        "/private/",
        "/search",
        "/debug",
        "/cloud",
        "/import",
        "/*?*utm_", // strip tracked URLs
        "/*?*ref=",
    ]
    const disallow = Array.from(new Set([...baseDisallow, ...customDisallow]))
    // /api/download serves cover images, thumbnails, and audio files used in
    // og:image tags and on-page media. Google's robots.txt matcher applies
    // the longest matching rule, so this Allow overrides the broader
    // "/api/" Disallow above for this one path without opening up the rest
    // of the API surface.
    const baseAllow = ["/", "/api/download"]
    const allow = customAllow.length > 0 ? Array.from(new Set([...baseAllow, ...customAllow])) : baseAllow

    return {
        rules: [
            {
                userAgent: "*",
                allow,
                disallow,
            },
        ],
        sitemap: `${CANONICAL_BASE_URL}/sitemap.xml`,
        host: CANONICAL_BASE_URL,
    }
}

function parseDirectiveList(blob: string | undefined, directive: string): string[] {
    if (!blob) return []
    const re = new RegExp(`^\\s*${directive}\\s*:\\s*(.+)$`, "gim")
    const out: string[] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(blob)) !== null) {
        const v = m[1].trim()
        if (v && v !== "/") out.push(v)
        else if (v === "/") out.push(v)
    }
    return out
}
