"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Download, Database, Loader2, FileJson, RefreshCw, Trash2, Upload, HardDrive } from "lucide-react"

export default function AdminSettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [stats, setStats] = useState({
    sermons: 0,
    lessons: 0,
    articles: 0,
    books: 0,
    media: 0,
    subscribers: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const [
        sermons,
        lessons,
        articles,
        books,
        media,
        subscribers,
      ] = await Promise.all([
        supabase.from("sermons").select("id", { count: "exact" }),
        supabase.from("lessons").select("id", { count: "exact" }),
        supabase.from("articles").select("id", { count: "exact" }),
        supabase.from("books").select("id", { count: "exact" }),
        supabase.from("media").select("id", { count: "exact" }),
        supabase.from("subscribers").select("id", { count: "exact" }),
      ])

      setStats({
        sermons: sermons.count || 0,
        lessons: lessons.count || 0,
        articles: articles.count || 0,
        books: books.count || 0,
        media: media.count || 0,
        subscribers: subscribers.count || 0,
      })
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
    setLoading(false)
  }

  async function exportDatabase() {
    setExporting(true)
    setMessage({ type: "", text: "" })

    try {
      // Fetch all data from each table
      const [
        sermons,
        lessons,
        articles,
        books,
        media,
        subscribers,
        siteSettings,
        heroSection,
        aboutPage,
        categories,
        weeklySchedule,
        socialLinks,
        notifications,
        communityPages,
        contactSubmissions,
        appearanceSettings,
      ] = await Promise.all([
        supabase.from("sermons").select("*"),
        supabase.from("lessons").select("*"),
        supabase.from("articles").select("*"),
        supabase.from("books").select("*"),
        supabase.from("media").select("*"),
        supabase.from("subscribers").select("*"),
        supabase.from("site_settings").select("*"),
        supabase.from("hero_section").select("*"),
        supabase.from("about_page").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("weekly_schedule").select("*"),
        supabase.from("social_links").select("*"),
        supabase.from("notifications").select("*"),
        supabase.from("community_pages").select("*"),
        supabase.from("contact_submissions").select("*"),
        supabase.from("appearance_settings").select("*"),
      ])

      const exportData = {
        exported_at: new Date().toISOString(),
        version: "2.0",
        data: {
          sermons: sermons.data || [],
          lessons: lessons.data || [],
          articles: articles.data || [],
          books: books.data || [],
          media: media.data || [],
          subscribers: subscribers.data || [],
          site_settings: siteSettings.data || [],
          hero_section: heroSection.data || [],
          about_page: aboutPage.data || [],
          categories: categories.data || [],
          weekly_schedule: weeklySchedule.data || [],
          social_links: socialLinks.data || [],
          notifications: notifications.data || [],
          community_pages: communityPages.data || [],
          contact_submissions: contactSubmissions.data || [],
          appearance_settings: appearanceSettings.data || [],
        },
      }

      // Create and download JSON file
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `database-backup-${new Date()
        .toISOString()
        .split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({
        type: "success",
        text: "تم تصدير قاعدة البيانات بنجاح!",
      })
    } catch (error: any) {
      console.error("[v0] Export error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء التصدير: " + error.message,
      })
    }
    setExporting(false)
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage({ type: "", text: "" })

    try {
      const text = await file.text()
      const importData = JSON.parse(text)

      if (!importData.data || !importData.version) {
        throw new Error("ملف النسخة الاحتياطية غير صالح")
      }

      // Confirm before importing
      if (
        !confirm(
          "تحذير: سيتم استبدال البيانات الحالية بالبيانات المستوردة. هل أنت متأكد من المتابعة؟"
        )
      ) {
        setImporting(false)
        return
      }

      // Import each table
      const tables = Object.keys(importData.data)
      let successCount = 0

      for (const table of tables) {
        const records = importData.data[table]
        if (records && records.length > 0) {
          // Delete existing records and insert new ones
          await supabase
            .from(table)
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
          const { error } = await supabase.from(table).insert(records)
          if (!error) successCount++
        }
      }

      setMessage({
        type: "success",
        text: `تم استيراد النسخة الاحتياطية بنجاح! (${successCount} جدول)`,
      })

      fetchStats()
    } catch (error: any) {
      console.error("[v0] Import error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء الاستيراد: " + error.message,
      })
    }

    setImporting(false)
    // Reset file input
    e.target.value = ""
  }

  async function clearCache() {
    setClearingCache(true)
    setMessage({ type: "", text: "" })

    try {
      // Call revalidate API endpoint
      const response = await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: "/" }),
      })

      if (!response.ok) {
        throw new Error("فشل في مسح الكاش")
      }

      setMessage({
        type: "success",
        text: "تم مسح الكاش بنجاح! سيتم تحديث الصفحات عند زيارتها.",
      })
    } catch (error: any) {
      console.error("[v0] Clear cache error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء مسح الكاش: " + error.message,
      })
    }

    setClearingCache(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-serif flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          الإعدادات العامة والنسخ الاحتياطي
        </h1>
        <p className="text-text-muted mt-2">
          إدارة وتصدير واستيراد بيانات الموقع
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-center ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Database Stats */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            إحصائيات قاعدة البيانات
          </h2>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.sermons}</p>
            <p className="text-sm text-text-muted">الخطب</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.lessons}</p>
            <p className="text-sm text-text-muted">الدروس</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.articles}</p>
            <p className="text-sm text-text-muted">المقالات</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.books}</p>
            <p className="text-sm text-text-muted">الكتب</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.media}</p>
            <p className="text-sm text-text-muted">المرئيات</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.subscribers}</p>
            <p className="text-sm text-text-muted">المشتركين</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            تصدير النسخة الاحتياطية
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            قم بتصدير جميع بيانات الموقع إلى ملف JSON للنسخ الاحتياطي. يتضمن
            التصدير: الخطب، الدروس، المقالات، الكتب، المرئيات، المشتركين، وجميع
            الإعدادات.
          </p>
          <Button
            onClick={exportDatabase}
            disabled={exporting}
            className="w-full bg-primary hover:bg-primary-hover text-white"
          >
            {exporting ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 ml-2" />
                تصدير قاعدة البيانات
              </>
            )}
          </Button>
        </div>

        {/* Import Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            استيراد نسخة احتياطية
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            قم باستيراد نسخة احتياطية سابقة. تحذير: سيتم استبدال البيانات الحالية
            بالبيانات المستوردة.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>تنبيه:</strong> تأكد من أخذ نسخة احتياطية من البيانات الحالية
              قبل الاستيراد.
            </p>
          </div>

          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
              disabled={importing}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              disabled={importing}
              onClick={() =>
                document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
              }
            >
              {importing ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 ml-2" />
                  اختيار ملف النسخة الاحتياطية
                </>
              )}
            </Button>
          </label>
        </div>
      </div>

      {/* Cache Section */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          إدارة الكاش
        </h2>
        <p className="text-text-muted mb-6">
          مسح الكاش يؤدي إلى إعادة تحميل جميع الصفحات من قاعدة البيانات. استخدم
          هذا الخيار إذا لم تظهر التغييرات الجديدة على الموقع.
        </p>
        <Button
          onClick={clearCache}
          disabled={clearingCache}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
        >
          {clearingCache ? (
            <>
              <Loader2 className="h-5 w-5 ml-2 animate-spin" />
              جاري المسح...
            </>
          ) : (
            <>
              <Trash2 className="h-5 w-5 ml-2" />
              مسح الكاش
            </>
          )}
        </Button>
      </div>
    </div>
  )
}