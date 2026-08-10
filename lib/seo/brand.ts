/**
 * Single source of truth for the site's brand name.
 *
 * Google picks the "site name" shown above the URL in search results from a
 * handful of signals — the WebSite schema `name`, `og:site_name`, and the
 * <title> — and it only trusts the value when they all agree. When they
 * disagree, or when the name reads like a description rather than a name, it
 * silently falls back to the bare domain ("elsayedmourad.com").
 *
 * Every place that needs the brand name must import from here so those signals
 * can never drift apart again.
 */
export const BRAND_NAME = "السيد مراد سلامة"

/**
 * Normalise an admin-provided site name into something usable as a *name*.
 *
 * The admin value was "موقع الشيخ السيد مراد سلامة" — "the website of Sheikh
 * …". That is a description of the site, not its name, and it also made the
 * title template repeat the brand twice. We strip the leading "موقع" so the
 * admin keeps control of the wording without being able to reintroduce the
 * exact shape that made Google discard the name.
 *
 * Falls back to BRAND_NAME when the setting is missing or empty.
 */
export function resolveBrandName(siteName?: string | null): string {
  const cleaned = (siteName ?? "").replace(/\s+/g, " ").trim().replace(/^موقع\s+/, "")
  return cleaned || BRAND_NAME
}
