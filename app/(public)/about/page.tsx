import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import {
  GraduationCap,
  MapPin,
  Mic,
  Trophy,
  BookOpen,
  Youtube,
  Send,
  Facebook,
  MessageCircle,
  ChevronLeft,
  Mail,
  Twitter,
  Instagram,
} from "lucide-react"

export const revalidate = 60

export default async function AboutPage() {
  const supabase = createPublicClient()

  const { data: aboutData, error: aboutError } = await supabase.from("about_page").select("*").limit(1).maybeSingle()

  let socialLinks: Record<string, string> = {}

  // First try to get from about_page social_links field
  if (aboutData?.social_links && Array.isArray(aboutData.social_links)) {
    aboutData.social_links.forEach((link: { platform: string; url: string }) => {
      if (link.platform && link.url) {
        socialLinks[link.platform.toLowerCase()] = link.url
      }
    })
  }

  if (Object.keys(socialLinks).length === 0) {
    try {
      const { data: linksData } = await supabase.from("social_links").select("*")
      if (linksData) {
        // Filter active items in JavaScript if is_active exists
        linksData
          .filter((link: any) => link.is_active !== false)
          .forEach((link: any) => {
            socialLinks[link.platform?.toLowerCase()] = link.url
          })
      }
    } catch {
      // Fallback to about_page social_media if social_links table doesn't exist
      socialLinks = (aboutData?.social_media as Record<string, string>) || {}
    }
  }

  const about = {
    sheikh_name: aboutData?.sheikh_name || "الشيخ السيد مراد",
    sheikh_photo: aboutData?.image_path || aboutData?.sheikh_photo || "/islamic-scholar-portrait.jpg",
    biography:
      aboutData?.content ||
      aboutData?.biography ||
      "عالم أزهري ومفكر تربوي، كرس حياته لخدمة العلم والدعوة. يتميز بأسلوبه الهادئ والرزين في طرح القضايا المعاصرة.",
    achievements: aboutData?.achievements || "",
    education: aboutData?.education || "",
    current_positions: aboutData?.positions || aboutData?.current_positions || "",
    location: aboutData?.location || "القاهرة، مصر",
    title: aboutData?.title || "عالم أزهري ومصلح اجتماعي",
    position: aboutData?.position || "خطيب وإمام",
    quote_text: aboutData?.quote_text || "",
    quote_source: aboutData?.quote_source || "",
    youtube_channel: socialLinks.youtube || "",
    telegram_channel: socialLinks.telegram || "",
    facebook_page: socialLinks.facebook || "",
    whatsapp_channel: socialLinks.whatsapp || "",
    twitter_handle: socialLinks.twitter || "",
    instagram_handle: socialLinks.instagram || "",
    email_address: socialLinks.email || "",
  }

  // Parse achievements, education, and positions from text format
  const parseTextToArray = (text: string): string[] => {
    if (!text) return []
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  const achievementsList = parseTextToArray(about.achievements)
  const educationList = parseTextToArray(about.education)
  const positionsList = parseTextToArray(about.current_positions)

  const socialLinksArray = [
    { icon: Youtube, href: about.youtube_channel, label: "يوتيوب", color: "bg-red-500" },
    { icon: Send, href: about.telegram_channel, label: "تيليجرام", color: "bg-blue-500" },
    { icon: Facebook, href: about.facebook_page, label: "فيسبوك", color: "bg-blue-600" },
    { icon: MessageCircle, href: about.whatsapp_channel, label: "واتساب", color: "bg-green-500" },
    { icon: Twitter, href: about.twitter_handle, label: "تويتر", color: "bg-sky-500" },
    { icon: Instagram, href: about.instagram_handle, label: "انستجرام", color: "bg-pink-500" },
    {
      icon: Mail,
      href: about.email_address ? `mailto:${about.email_address}` : "",
      label: "البريد",
      color: "bg-gray-600",
    },
  ].filter((link) => link.href)

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-accent-light py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link href="/" className="hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="h-4 w-4 rtl-flip" />
            <span className="text-primary font-medium">عن الشيخ</span>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-center">
            {/* Photo */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl">
                  <img
                    src={about.sheikh_photo || "/placeholder.svg"}
                    alt={about.sheikh_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-full shadow-lg">
                  <Mic className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="md:col-span-8 text-center md:text-right">
              <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                السيرة الذاتية
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">{about.sheikh_name}</h1>
              <p className="text-xl text-primary font-medium mb-2">{about.title}</p>
              <p className="text-lg text-text-muted mb-4">{about.position}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-text-muted">
                <MapPin className="h-5 w-5" />
                <span>{about.location}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Biography Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Biography */}
              <div className="bg-card rounded-2xl border border-border p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 font-serif">
                  <BookOpen className="h-6 w-6 text-primary" />
                  نبذة تعريفية
                </h2>
                <div
                  className="prose prose-lg max-w-none text-text-muted leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: about.biography }}
                />
              </div>

              {/* Education */}
              {educationList.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 font-serif">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    المؤهلات العلمية
                  </h2>
                  <ul className="space-y-4">
                    {educationList.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-text-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Achievements */}
              {achievementsList.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 font-serif">
                    <Trophy className="h-6 w-6 text-primary" />
                    الإنجازات والمؤلفات
                  </h2>
                  <ul className="space-y-4">
                    {achievementsList.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0" />
                        <span className="text-text-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Current Positions */}
              {positionsList.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 font-serif">
                    <Mic className="h-6 w-6 text-primary" />
                    المناصب الحالية
                  </h2>
                  <ul className="space-y-4">
                    {positionsList.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                        <span className="text-text-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quote */}
              {about.quote_text && (
                <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
                  <div className="text-6xl text-primary/30 font-serif leading-none mb-4">"</div>
                  <blockquote className="text-lg text-foreground font-medium mb-4 leading-relaxed">
                    {about.quote_text}
                  </blockquote>
                  {about.quote_source && <cite className="text-sm text-text-muted">— {about.quote_source}</cite>}
                </div>
              )}

              {/* Social Links */}
              {socialLinksArray.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">تواصل معنا</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {socialLinksArray.map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${link.color} text-white rounded-xl p-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
                      >
                        <link.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">روابط سريعة</h3>
                <div className="space-y-2">
                  <Link
                    href="/khutba"
                    className="block p-3 rounded-xl bg-surface hover:bg-accent-light transition-colors text-text-muted hover:text-primary"
                  >
                    الخطب المنبرية
                  </Link>
                  <Link
                    href="/dars"
                    className="block p-3 rounded-xl bg-surface hover:bg-accent-light transition-colors text-text-muted hover:text-primary"
                  >
                    الدروس العلمية
                  </Link>
                  <Link
                    href="/books"
                    className="block p-3 rounded-xl bg-surface hover:bg-accent-light transition-colors text-text-muted hover:text-primary"
                  >
                    الكتب والمؤلفات
                  </Link>
                  <Link
                    href="/articles"
                    className="block p-3 rounded-xl bg-surface hover:bg-accent-light transition-colors text-text-muted hover:text-primary"
                  >
                    المقالات
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
