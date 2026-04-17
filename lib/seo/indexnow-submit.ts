/**
 * Client helper to fire-and-forget submit URLs to IndexNow via our own
 * `/api/seo/ping` endpoint. Use this from admin CRUD flows right after a
 * publish succeeds so Bing / Yandex / Seznam etc. see the new URL within
 * minutes instead of days.
 *
 * Failures are swallowed on purpose — SEO submission must never block the
 * admin flow or surface errors to the editor.
 */
export async function submitUrlsToIndexNow(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return
  try {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")

    const urls = paths.map((p) => {
      if (p.startsWith("http")) return p
      const normalized = p.startsWith("/") ? p : `/${p}`
      return `${origin}${normalized}`
    })

    await fetch("/api/seo/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
      keepalive: true,
    })
  } catch (err) {
    console.warn("[v0] IndexNow auto-submit failed (non-fatal):", err)
  }
}

/**
 * Also kicks off a revalidate call so the sitemap / affected pages show the
 * new content immediately instead of after the 1h cache window.
 */
export async function revalidatePaths(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paths,
        tags: ["seo-settings", "site-settings"],
      }),
      keepalive: true,
    })
  } catch (err) {
    console.warn("[v0] Revalidate failed (non-fatal):", err)
  }
}

/**
 * Convenience: tell search engines AND revalidate at once. Call this from
 * admin publish handlers.
 */
export async function notifySearchEngines(paths: string[]): Promise<void> {
  await Promise.all([submitUrlsToIndexNow(paths), revalidatePaths(paths)])
}
