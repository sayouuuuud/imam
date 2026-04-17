import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cache redirects for 5 minutes to avoid hitting DB on every request
let redirectsCache: { source_path: string; destination_path: string; redirect_type: number }[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Canonical production host. Every other variant (www, uppercased, trailing
// slash) is 301'd to this so Google indexes exactly one version of each URL.
const CANONICAL_HOST = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://elsayed-mourad.online"
    return new URL(raw).host.toLowerCase()
  } catch {
    return "elsayed-mourad.online"
  }
})()

async function getRedirects() {
  const now = Date.now()
  if (redirectsCache && now - cacheTimestamp < CACHE_TTL) {
    return redirectsCache
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl === "https://placeholder.supabase.co") {
      return []
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { data } = await supabase
      .from("redirects")
      .select("source_path, destination_path, redirect_type")
      .eq("is_active", true)

    redirectsCache = data || []
    cacheTimestamp = now
    return redirectsCache
  } catch {
    return []
  }
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname
  const hostHeader = request.headers.get("host")?.toLowerCase() || ""

  // 1) Canonical host enforcement — only on real production requests.
  //    Skip preview/localhost hosts to avoid breaking dev / Vercel previews.
  const isProdHost =
    hostHeader.endsWith(".elsayed-mourad.online") ||
    hostHeader === "elsayed-mourad.online" ||
    hostHeader === `www.${CANONICAL_HOST}` ||
    hostHeader === CANONICAL_HOST

  if (isProdHost && hostHeader !== CANONICAL_HOST) {
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
    const match = redirects.find((r) => r.source_path === pathname)

    if (match) {
      const destination = match.destination_path.startsWith("http")
        ? match.destination_path
        : `${url.origin}${match.destination_path}`

      // Fire-and-forget: increment hit count
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseKey && supabaseUrl !== "https://placeholder.supabase.co") {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
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
