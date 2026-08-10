import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type RedirectRow = { source_path: string; destination_path: string; redirect_type: number }

// Cache redirects to avoid hitting the DB on every request. The table is
// currently empty, and an empty result is the common case — so we cache the
// "nothing to do" answer for much longer than a populated one. Otherwise every
// cold lambda pays a Supabase round-trip before rendering anything.
let redirectsCache: Map<string, RedirectRow> | null = null
let cacheTimestamp = 0
let cacheTtl = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes when redirects exist
const EMPTY_CACHE_TTL = 30 * 60 * 1000 // 30 minutes when the table is empty

// One Supabase client per lambda instance instead of one per request.
let supabaseSingleton: ReturnType<typeof createClient> | null = null

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === "https://placeholder.supabase.co") {
    return null
  }

  if (!supabaseSingleton) {
    supabaseSingleton = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  return supabaseSingleton
}

// Canonical production host — read from env. This is the host that all
// legacy traffic (the old .online domain) should be 301'd to.
//
// IMPORTANT: We deliberately do NOT enforce a www-vs-non-www redirect here.
// Vercel handles that at the platform/DNS level. If the deployment is
// configured so `www.elsayedmourad.com` is the live host and the apex
// 308's to it (or vice versa), forcing the opposite in proxy.ts creates an
// infinite redirect loop (`ERR_TOO_MANY_REDIRECTS`).
const CANONICAL_HOST = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://elsayedmourad.com"
    return new URL(raw).host.toLowerCase()
  } catch {
    return "elsayedmourad.com"
  }
})()

// Legacy hosts that should permanently 301 to the canonical host.
// Only the old .online domain — DO NOT add www variants of the live domain
// here (see comment above).
const LEGACY_HOST_SUFFIX = "elsayed-mourad.online"

const EMPTY_REDIRECTS: Map<string, RedirectRow> = new Map()

async function getRedirects(): Promise<Map<string, RedirectRow>> {
  const now = Date.now()
  if (redirectsCache && now - cacheTimestamp < cacheTtl) {
    return redirectsCache
  }

  try {
    const supabase = getSupabase()
    if (!supabase) return EMPTY_REDIRECTS

    const { data } = await supabase
      .from("redirects")
      .select("source_path, destination_path, redirect_type")
      .eq("is_active", true)

    const rows = (data || []) as RedirectRow[]
    // A Map keeps lookup O(1) instead of scanning the array on every request.
    redirectsCache = new Map(rows.map((r) => [r.source_path, r]))
    cacheTimestamp = now
    cacheTtl = rows.length === 0 ? EMPTY_CACHE_TTL : CACHE_TTL
    return redirectsCache
  } catch {
    return EMPTY_REDIRECTS
  }
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname
  const hostHeader = request.headers.get("host")?.toLowerCase() || ""

  // 1) Legacy domain redirect ONLY. Anyone arriving on the old
  //    `elsayed-mourad.online` (or any subdomain of it) is permanently
  //    redirected to the new canonical host. We do not touch any other
  //    host — Vercel's domain config decides www vs apex.
  const isLegacyHost =
    hostHeader === LEGACY_HOST_SUFFIX ||
    hostHeader.endsWith(`.${LEGACY_HOST_SUFFIX}`)

  if (isLegacyHost) {
    const canonicalUrl = new URL(request.url)
    canonicalUrl.host = CANONICAL_HOST
    canonicalUrl.protocol = "https:"
    return NextResponse.redirect(canonicalUrl, 301)
  }

  // 2) Skip static files, API routes, and admin pages for the redirect table.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/admin")
  ) {
    return NextResponse.next()
  }

  // 3) Strip trailing slash (except root). "/books/" and "/books" should not
  //    both be indexable — they are the same page.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const clean = new URL(request.url)
    clean.pathname = pathname.replace(/\/+$/, "")
    return NextResponse.redirect(clean, 301)
  }

  try {
    const redirects = await getRedirects()
    const match = redirects.get(pathname)

    if (match) {
      const destination = match.destination_path.startsWith("http")
        ? match.destination_path
        : `${url.origin}${match.destination_path}`

      // Fire-and-forget: increment hit count
      const supabase = getSupabase()
      if (supabase) {
        void supabase.rpc("increment_redirect_hits", { source: pathname })
      }

      return NextResponse.redirect(destination, {
        status: match.redirect_type || 301,
      })
    }
  } catch {
    // Don't block requests if redirect logic fails
  }

  return NextResponse.next()
}

export default proxy
