import type React from "react"
import type { Metadata, Viewport } from "next"
import { Amiri, Cairo } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { createPublicClient } from "@/lib/supabase/public"
import { unstable_cache } from "next/cache"
import { withTimeout } from "@/lib/utils/with-timeout"
import "./globals.css"

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

const getSiteSettings = unstable_cache(
  async () => {
    try {
      const supabase = createPublicClient()
      const { data } = await supabase.from("site_settings").select("*")
      if (!data) {
        return {}
      }

      const settings: Record<string, string> = {}
      data.forEach((item: any) => {
        const key = item.key || item.setting_key
        const value = item.value || item.setting_value
        if (key && value) {
          settings[key] = value
        }
      })
      return settings
    } catch {
      return {}
    }
  },
  ["site_settings"],
  { revalidate: 300 }
)

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
  const siteTitle =
    settings.site_title || "الشيخ السيد مراد - عالم أزهري"
  const siteDescription =
    settings.site_description ||
    "الموقع الرسمي للشيخ السيد مراد - منصة إسلامية شاملة تضم الخطب والدروس العلمية والمقالات والكتب. تعلم العلم الشرعي بفهم وسطي مستنير."
  const siteKeywords =
    settings.site_keywords ||
    "الشيخ السيد مراد,دروس إسلامية,خطب الجمعة,علم شرعي,فقه إسلامي,سيرة نبوية,مقالات دينية,كتب إسلامية" 
  return {
    title: {
      default: siteTitle,
      template: `%s | ${settings.site_name || "الشيخ السيد مراد"}`,
    },
    description: siteDescription,
    keywords: siteKeywords.split(",").map((k: string) => k.trim()),
    authors: [{ name: settings.site_author || "الشيخ السيد مراد" }],
    creator: settings.site_author || "الشيخ السيد مراد",
    openGraph: {
      type: "website",
      locale: "ar_EG",
      siteName: settings.site_name || "الشيخ السيد مراد",
      title: siteTitle,
      description: siteDescription,
      images: settings.og_image ? [{ url: settings.og_image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: settings.og_image ? [settings.og_image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
    generator: "v0.app",
  }
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
  const primaryColor = appearance.primary_color || "#1e4338"
  const secondaryColor = appearance.secondary_color || "#d4af37"
  // Generate CSS variables for colors
  const colorStyles = `
    :root {
      --color-primary: ${primaryColor};
      --color-primary-hover: ${adjustBrightness(primaryColor, -10)};
      --color-primary-light: ${adjustBrightness(primaryColor, 20)};
      --color-secondary: ${secondaryColor};
      --color-secondary-hover: ${adjustBrightness(secondaryColor, -10)};
      --color-secondary-light: ${adjustBrightness(secondaryColor, 20)};
    }
  ` 
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${amiri.variable} ${cairo.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: colorStyles }} />
      </head>

      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = Number.parseInt(hex.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt

  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  )
}
