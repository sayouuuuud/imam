import "./globals.css"
import type React from "react"
import type { Metadata, Viewport } from "next"
import { Noto_Naskh_Arabic, Amiri, Cairo } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import Script from 'next/script'
import { createPublicClient } from "@/lib/supabase/public"
import { unstable_cache } from "next/cache"
import { withTimeout } from "@/lib/utils/with-timeout"
import { SessionManager } from "@/components/session-manager"
import { InAppBrowserBlocker } from "@/components/in-app-browser-blocker"
import { AnalyticsTracker } from "@/components/analytics-tracker"
import { JsonLd } from "@/components/json-ld"
import { generateWebsiteSchema, generatePersonSchema } from "@/lib/schema-generator"
import { getSiteSettings } from "@/lib/site-settings"

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
})

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
})

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-naskh",
  display: "swap",
})


const getAppearanceSettings = unstable_cache(
  async () => {
    try {
      const supabase = createPublicClient()
      const { data } = await supabase.from("appearance_settings").select("*").limit(1)
      return data?.[0] || {}
    } catch {
      return {}
    }
  },
  ["appearance_settings"],
  { revalidate: 300 }
)

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  // Admin SEO keys (meta_title, meta_description, etc.) take priority
  // over old keys (site_title, site_description, etc.) for backward compatibility
  const siteTitle =
    settings.meta_title || settings.site_title || "الشيخ السيد مراد - عالم أزهري"
  const siteDescription =
    settings.meta_description || settings.site_description ||
    "الموقع الرسمي للشيخ السيد مراد - منصة إسلامية شاملة تضم الخطب والدروس العلمية والمقالات والكتب. تعلم العلم الشرعي بفهم وسطي مستنير."
  const siteKeywords =
    settings.meta_keywords || settings.site_keywords ||
    "الشيخ السيد مراد,دروس إسلامية,خطب الجمعة,علم شرعي,فقه إسلامي,سيرة نبوية,مقالات دينية,كتب إسلامية"

  // OG fields from admin, fallback to general title/description
  const ogTitle = settings.og_title || siteTitle
  const ogDescription = settings.og_description || siteDescription
  const ogImage = settings.og_image || "/og-default.jpg"

  // Twitter fields from admin
  const twitterTitle = settings.twitter_title || siteTitle
  const twitterDescription = settings.twitter_description || siteDescription
  const twitterImage = settings.twitter_image || ogImage

  // Verification codes from admin (fallback to hardcoded)
  const googleVerification = settings.google_verification || "t3yRqEKg6tGfcJWSeOMPcIisJSkYbIlsVkUF7zrpzdI"
  const bingVerification = settings.bing_verification || undefined

  // Canonical URL from admin — normalized (no trailing slash) and guarded
  // against broken values so we don't blow up `new URL()`.
  const rawCanonical = settings.canonical_url || "https://elsayed-mourad.online"
  const canonicalUrl = (() => {
    try {
      const u = new URL(rawCanonical)
      return `${u.protocol}//${u.host}`
    } catch {
      return "https://elsayed-mourad.online"
    }
  })()

  // Use the production domain
  const baseUrl = new URL(canonicalUrl)

  const metadata: Metadata = {
    title: {
      default: siteTitle,
      template: `%s | ${settings.site_name || "الشيخ السيد مراد"}`,
    },
    metadataBase: baseUrl,
    description: siteDescription,
    keywords: siteKeywords.split(",").map((k: string) => k.trim()),
    authors: [{ name: settings.site_author || "الشيخ السيد مراد" }],
    creator: settings.site_author || "الشيخ السيد مراد",
    // Advertise the site-wide canonical so Google knows which host is primary
    // (prevents www / non-www or http / https duplicate indexing).
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "ar_EG",
      siteName: settings.site_name || "الشيخ السيد مراد",
      title: ogTitle,
      description: ogDescription,
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: ogTitle,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: [twitterImage],
      ...(settings.twitter_handle ? { creator: settings.twitter_handle } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: googleVerification,
      other: {
        "msvalidate.01": ["7FA9C0D56E06CA724EDF3C306615F8D4", bingVerification].filter(Boolean) as string[],
      },
    },
    generator: "v0.app",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: settings.site_name || "الشيخ السيد مراد",
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
    },
  }

  return metadata
}

export const viewport: Viewport = {
  themeColor: "#1e5631",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appearance = await getAppearanceSettings()
  const siteSettings = await getSiteSettings()

  // Parse the admin-provided JSON-LD. Previous code read this field into
  // the form but never rendered it anywhere, so anything the admin pasted
  // was silently discarded.
  let customStructuredData: unknown = null
  if (siteSettings.structured_data && siteSettings.structured_data.trim()) {
    try {
      customStructuredData = JSON.parse(siteSettings.structured_data)
    } catch (e) {
      // Malformed JSON — log and skip instead of crashing the whole page.
      console.warn("[v0] Invalid structured_data JSON in site_settings:", e)
    }
  }

  // Google Analytics / Facebook Pixel IDs (rendered only if set)
  const gaId = siteSettings.google_analytics_id?.trim()
  const fbPixelId = siteSettings.facebook_pixel_id?.trim()

  // Note: Colors are now handled by globals.css CSS variables, not inline styles
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${amiri.variable} ${cairo.variable} ${notoNaskhArabic.variable}`}
    >
      <head>
        {/* Optimize Font Loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Warm up the Supabase image/storage host early so article and
            book covers start downloading before the parser hits them. Cuts
            LCP on content-heavy pages noticeably. */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link
              rel="preconnect"
              href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin}
              crossOrigin="anonymous"
            />
            <link
              rel="dns-prefetch"
              href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin}
            />
          </>
        )}

        {/* RSS autodiscovery helps Google News / readers surface new posts. */}
        <link rel="alternate" type="application/rss+xml" title="آخر المقالات" href="/feed.xml" />

        {/* Preload Material Icons to prevent FOUC (Flash of Unstyled Content) */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
        {/* Hide icon text until font loads */}
        <style dangerouslySetInnerHTML={{
          __html: `
          /* Hide icons until Material Icons font is loaded */
          .material-icons-outlined {
            font-size: 0 !important;
            line-height: 0;
          }
          .material-icons-outlined::before {
            font-size: 24px;
            line-height: 1;
          }
          /* When font is loaded, show normally */
          .fonts-loaded .material-icons-outlined {
            font-size: inherit !important;
            line-height: inherit;
          }
        `}} />
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            if (document.fonts && document.fonts.check) {
              function checkFont() {
                if (document.fonts.check('24px "Material Icons Outlined"')) {
                  document.documentElement.classList.add('fonts-loaded');
                } else {
                  requestAnimationFrame(checkFont);
                }
              }
              checkFont();
            } else {
              // Fallback: add class after a delay
              setTimeout(function() {
                document.documentElement.classList.add('fonts-loaded');
              }, 100);
            }
          })();
        `}} />
      </head>

      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          storageKey="theme"
        >
          <AuthProvider>
            <InAppBrowserBlocker />
            <SessionManager />
            <AnalyticsTracker />
            <JsonLd schema={[await generateWebsiteSchema(), await generatePersonSchema()]} />
            {customStructuredData !== null && (
              <JsonLd schema={customStructuredData as Record<string, unknown>} />
            )}
            {gaId && (
              <>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                  strategy="afterInteractive"
                />
                <Script id="ga-init" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gaId}', { anonymize_ip: true });
                  `}
                </Script>
              </>
            )}
            {fbPixelId && (
              <Script id="fb-pixel" strategy="afterInteractive">
                {`
                  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
                  document,'script','https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${fbPixelId}');
                  fbq('track', 'PageView');
                `}
              </Script>
            )}
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
