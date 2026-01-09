import type { Metadata } from "next"
import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import {
  BookOpen,
  History,
  School,
  Play,
  Download,
  Share2,
  Calendar,
  Eye,
  Music,
  Video,
  ArrowLeft,
} from "lucide-react"

export const metadata: Metadata = {
  title: "الدروس العلمية",
  description:
    "جداول الدروس العلمية الأسبوعية في الفقه والسيرة النبوية والعقيدة من الشيخ السيد مراد",
  keywords: ["دروس إسلامية", "فقه", "سيرة نبوية", "عقيدة"],
}

export default async function DarsPage() {
  const supabase = createPublicClient()

  // Fetch Fiqh lessons (audio only, latest 3)
  const { data: fiqhLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("lesson_type", "fiqh")
    .eq("publish_status", "published")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(3)

  // Fetch Seerah lessons (with featured one)
  const { data: seerahLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("lesson_type", "seerah")
    .eq("publish_status", "published")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(4)

  // Fetch General lessons
  const { data: generalLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("lesson_type", "general")
    .eq("publish_status", "published")
    .order("created_at", { ascending: false })
    .limit(6)

  const featuredSeerah = seerahLessons?.[0]
  const previousSeerah = seerahLessons?.slice(1) || []

  // Helper to format relative time
  function getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 0) return "اليوم"
    if (diffDays === 1) return "أمس"
    if (diffDays < 7) return `منذ ${diffDays} أيام`
    if (diffDays < 14) return "منذ أسبوع"
    if (diffDays < 21) return "منذ أسبوعين"
    if (diffDays < 30) return "منذ 3 أسابيع"
    return `منذ ${Math.floor(diffDays / 30)} شهر`
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="text-center py-16 relative">
        <span className="text-sm font-semibold text-primary/80 bg-primary/5 px-4 py-1.5 rounded-full inline-block mb-4">
          العلم الشرعي
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-6 relative inline-block font-serif">
          جداول الدروس العلمية
          <div className="absolute -bottom-2 left-0 w-full h-2 bg-secondary/30 -z-10 rounded-full"></div>
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
          متابعة دورية للدروس العلمية الأسبوعية، حيث نغوص في بحور الفقه والسيرة
          النبوية لنتعلم ديننا الحنيف بفهم وسطي مستنير.
        </p>
      </div>

      <div className="container mx-auto px-4 lg:px-8 pb-12">
        {/* Section 1: Fiqh Lessons */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground font-serif">
                  دروس الفقه
                </h2>
                <p className="text-sm text-text-muted">
                  {'شرح كتاب "منهاج الطالبين" للإمام النووي'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
              <Calendar className="h-4 w-4" />
              كل يوم اثنين
            </div>
          </div>

          {!fiqhLessons || fiqhLessons.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <School className="h-12 w-12 mx-auto text-text-muted mb-4" />
              <p className="text-text-muted">لا توجد دروس فقه حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fiqhLessons.map((lesson, index) => (
                <Link
                  key={lesson.id}
                  href={`/dars/${lesson.id}`}
                  className={`group bg-card rounded-xl shadow-sm hover:shadow-lg border transition-all duration-300 relative overflow-hidden ${
                    index === 0
                      ? "border-primary/20"
                      : "border-border hover:shadow-md"
                  }`}
                >
                  {lesson.thumbnail_path && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={lesson.thumbnail_path || "/placeholder.svg"}
                        alt={lesson.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(lesson.created_at).toLocaleDateString(
                            "ar-EG",
                            {
                              day: "numeric",
                              month: "long",
                            }
                          )}
                        </span>

                        {lesson.duration && (
                          <span className="flex items-center gap-1">
                            <History className="h-3 w-3" />
                            {lesson.duration} دقيقة
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white transition">
                          <Play className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Link
              href="/dars/fiqh"
              className="text-sm font-semibold text-text-muted hover:text-primary flex items-center justify-center gap-2 mx-auto transition"
            >
              عرض أرشيف الفقه
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Section 2: Seerah Lessons */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground font-serif">
                  دروس السيرة النبوية
                </h2>
                <p className="text-sm text-text-muted">
                  وقفات تربوية مع أحداث السيرة العطرة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg">
              <Calendar className="h-4 w-4" />
              كل يوم أربعاء
            </div>
          </div>

          {!seerahLessons || seerahLessons.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <History className="h-12 w-12 mx-auto text-text-muted mb-4" />
              <p className="text-text-muted">لا توجد دروس سيرة حالياً</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col md:flex-row">
              {/* Featured Lesson */}
              {featuredSeerah && (
                <div className="md:w-1/3 bg-primary/5 p-8 flex flex-col justify-center border-l border-border relative overflow-hidden">
                  {featuredSeerah.thumbnail_path && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                      <img
                        src={featuredSeerah.thumbnail_path || "/placeholder.svg"}
                        alt={featuredSeerah.title}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}
                  <div className="mb-6">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
                      درس الأسبوع
                    </span>
                    <h3 className="text-3xl font-extrabold text-primary mb-3 leading-tight font-serif">
                      {featuredSeerah.title}
                    </h3>
                  </div>

                  <Link
                    href={`/dars/${featuredSeerah.id}`}
                    className="mt-8 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                  >
                    <Play className="h-5 w-5" />
                    شاهد الدرس
                  </Link>
                </div>
              )}

              {/* Previous Lessons */}
              <div className="md:w-2/3 p-6 md:p-8">
                <h4 className="text-lg font-bold text-foreground mb-6">
                  دروس سابقة
                </h4>
                <div className="space-y-4">
                  {previousSeerah.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/dars/${lesson.id}`}
                      className="flex items-center justify-between group p-4 rounded-xl hover:bg-muted transition border border-transparent hover:border-border cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {lesson.thumbnail_path ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img
                              src={lesson.thumbnail_path || "/placeholder.svg"}
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h5 className="font-bold text-foreground group-hover:text-primary transition">
                            {lesson.title}
                          </h5>
                          <span className="text-xs text-text-muted">
                            {getRelativeTime(lesson.created_at)} •{" "}
                            {lesson.duration || "45"} دقيقة
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-text-muted hover:text-primary">
                          <Download className="h-5 w-5" />
                        </button>
                        <button className="text-text-muted hover:text-primary">
                          <Share2 className="h-5 w-5" />
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="mt-8 text-center">
            <Link
              href="/dars/seerah"
              className="text-sm font-semibold text-text-muted hover:text-primary flex items-center justify-center gap-2 mx-auto transition"
            >
              عرض أرشيف السيرة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Section 3: General Lessons */}
        {generalLessons && generalLessons.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <School className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground font-serif">
                    دروس متنوعة
                  </h2>
                  <p className="text-sm text-text-muted">
                    دروس عامة في مختلف العلوم الشرعية
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generalLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/dars/${lesson.id}`}
                  className="group bg-card rounded-xl shadow-sm hover:shadow-md border border-border transition-all duration-300"
                >
                  {lesson.thumbnail_path && (
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img
                        src={lesson.thumbnail_path || "/placeholder.svg"}
                        alt={lesson.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          lesson.type === "video"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {lesson.type === "video" ? (
                          <Video className="h-5 w-5" />
                        ) : (
                          <Music className="h-5 w-5" />
                        )}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded text-text-muted">
                        {lesson.type === "video" ? "مرئي" : "صوتي"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition mb-2">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {lesson.views_count || 0}
                      </span>
                      <span>
                        {new Date(lesson.created_at).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter CTA - Updated to WhatsApp/Telegram */}
        <section className="bg-primary rounded-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-white mb-2 font-serif">
                اشترك في التنبيهات
              </h2>
              <p className="text-white/80 text-sm">
                احصل على تنبيهات بالدروس الجديدة والملفات العلمية مباشرة عبر واتساب
                أو تيليجرام.
              </p>
            </div>

            <div className="md:w-1/2 w-full">
              <Link
                href="/subscribe"
                className="block w-full bg-secondary hover:bg-secondary-hover text-primary font-bold px-6 py-3 rounded-lg transition shadow-lg text-center"
              >
                اشترك الآن
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}