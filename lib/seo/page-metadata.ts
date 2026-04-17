import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"
import { getSiteSettings } from "@/lib/site-settings"

/**
 * Row shape expected in `seo_settings` (per-page overrides managed in
 * /admin/seo → per-page tab). Any of these fields can be null/empty.
 */
export type PageSEORow = {
  page_path: string
  page_title?: string | null
  meta_description?: string | null
  meta_keywords?: string | null
  og_title?: string | null
  og_description?: string | null
  og_image?: string | null
  robots?: string | null
  canonical_url?: string | null
}

/**
 * Load per-page SEO rows once and cache for 5 minutes.
 * A single fetch is cheaper than per-route lookups on an edge runtime.
 */
const getAllPageSEO = unstable_cache(
  async (): Promise<PageSEORow[]> => {
    try {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from("seo_settings")
        .select(
          "page_path,page_title,meta_description,meta_keywords,og_title,og_description,og_image,robots,canonical_url"
        )
      return (data as PageSEORow[]) || []
    } catch {
      return []
    }
  },
  ["seo_settings_all"],
  { revalidate: 300, tags: ["seo-settings"] }
)

function normalizePath(path: string) {
  if (!path) return "/"
  // Strip trailing slash except for root; make sure we start with "/"
  let p = path.trim()
  if (!p.startsWith("/")) p = "/" + p
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1)
  return p
}

function parseRobots(robots?: string | null): { index: boolean; follow: boolean } | undefined {
  if (!robots) return undefined
  const lowered = robots.toLowerCase()
  return {
    index: !lowered.includes("noindex"),
    follow: !lowered.includes("nofollow"),
  }
}

/**
 * Build a Next.js Metadata object for the given route, merging (in priority
 * order): per-page override → hard-coded fallback → global site settings.
 *
 * Before this helper existed, every page carried its own hard-coded
 * `export const metadata = {...}`, which meant changes made in /admin/seo were
 * NEVER reflected in the HTML that Google crawls. That is the root cause of
 * "I updated the meta title but Google still shows the old one".
 */
export async function buildPageMetadata(
  path: string,
  fallback: {
    title?: string
    description?: string
    keywords?: string
    image?: string
    type?: "website" | "article" | "book"
  } = {}
): Promise<Metadata> {
  const normalized = normalizePath(path)
  const [site, pages] = await Promise.all([getSiteSettings(), getAllPageSEO()])
  const pageRow = pages.find((p) => normalizePath(p.page_path) === normalized)

  // Resolve canonical base URL (same algorithm as root layout, kept local to
  // avoid a circular import).
  const rawCanonical =
    pageRow?.canonical_url || site.canonical_url || "https://elsayed-mourad.online"
  let canonicalBase: string
  try {
    const u = new URL(rawCanonical)
    canonicalBase = `${u.protocol}//${u.host}`
  } catch {
    canonicalBase = "https://elsayed-mourad.online"
  }

  const canonicalUrl = normalized === "/" ? canonicalBase : `${canonicalBase}${normalized}`

  const siteName = site.site_name || "الشيخ السيد مراد"
  const title =
    pageRow?.page_title ||
    fallback.title ||
    site.meta_title ||
    site.site_title ||
    siteName

  const description =
    pageRow?.meta_description ||
    fallback.description ||
    site.meta_description ||
    site.site_description ||
    ""

  const keywordsSource =
    pageRow?.meta_keywords ||
    fallback.keywords ||
    site.meta_keywords ||
    site.site_keywords ||
    ""
  const keywords = keywordsSource
    .split(",")
    .map((k: string) => k.trim())
    .filter(Boolean)

  const ogTitle = pageRow?.og_title || title
  const ogDescription = pageRow?.og_description || description
  const ogImage =
    pageRow?.og_image || fallback.image || site.og_image || "/og-default.jpg"

  const robots = parseRobots(pageRow?.robots)

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: fallback.type || "website",
      locale: "ar_EG",
      siteName,
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    ...(robots ? { robots } : {}),
  }
}
