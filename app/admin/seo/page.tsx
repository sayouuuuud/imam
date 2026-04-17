"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { Save, Search, Globe, RefreshCw, Plus, Pencil, Trash2, X, FileText, Trash, Share2, BarChart3, Code, LinkIcon, Shield, Eye, Activity, ArrowRightLeft, Radar, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { FileUpload } from "@/components/admin/file-upload"

interface Redirect {
  id: string
  source_path: string
  destination_path: string
  redirect_type: number
  is_active: boolean
  hits_count: number
  created_at: string
}

interface ContentAuditItem {
  id: string
  title: string
  type: string
  typeName: string
  url: string
  issues: string[]
  score: number
  hasDescription: boolean
  hasImage: boolean
  hasTags: boolean
  titleLength: number
  descriptionLength: number
}

interface SEOSettings {
  meta_title: string
  meta_description: string
  meta_keywords: string
  og_title: string
  og_description: string
  og_image: string
  twitter_title: string
  twitter_description: string
  twitter_image: string
  twitter_handle: string
  robots_txt: string
  google_verification: string
  bing_verification: string
  google_analytics_id: string
  facebook_pixel_id: string
  canonical_url: string
  structured_data: string
  sitemap_enabled: boolean
  auto_generate_meta: boolean
}

interface PageSEO {
  id: string
  page_path: string
  page_title: string
  meta_description: string
  meta_keywords: string
  og_title: string
  og_description: string
  og_image: string
  robots: string
  canonical_url: string
  priority: number
}

const CONTENT_TYPES = [
  { value: "sermon", label: "خطبة" },
  { value: "lesson", label: "درس" },
  { value: "article", label: "مقال" },
  { value: "book", label: "كتاب" },
  { value: "media", label: "مرئيات" },
]

export default function SEOManagementPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"general" | "social" | "verification" | "pages" | "analytics" | "advanced" | "cache" | "audit" | "redirects" | "indexing">("general")

  // Audit state
  const [auditResults, setAuditResults] = useState<ContentAuditItem[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditFilter, setAuditFilter] = useState<string>("all")

  // Redirects state
  const [redirects, setRedirects] = useState<Redirect[]>([])
  const [redirectsLoading, setRedirectsLoading] = useState(false)
  const [isAddingRedirect, setIsAddingRedirect] = useState(false)
  const [editingRedirectId, setEditingRedirectId] = useState<string | null>(null)
  const [redirectForm, setRedirectForm] = useState({ source_path: "", destination_path: "", redirect_type: 301, is_active: true })

  // Indexing state
  const [indexingUrls, setIndexingUrls] = useState<{ url: string; type: string }[]>([])
  const [indexingLoading, setIndexingLoading] = useState(false)
  const [pingResults, setPingResults] = useState<{ url: string; indexnow?: string; google?: string }[]>([])
  const [pingSummary, setPingSummary] = useState<{ status: number; submitted: number; body?: string } | null>(null)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [diagnostic, setDiagnostic] = useState<{ endpoint: string; host: string; keyLocation: string; keyPreview: string } | null>(null)
  const [diagnosticLoading, setDiagnosticLoading] = useState(false)

  // Page-specific SEO
  const [pageSEOList, setPageSEOList] = useState<PageSEO[]>([])
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [isAddingPage, setIsAddingPage] = useState(false)
  const [pageFormData, setPageFormData] = useState({
    page_path: "",
    page_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    robots: "index, follow",
    canonical_url: "",
    priority: 0.5,
  })
  const [settings, setSettings] = useState<SEOSettings>({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    twitter_title: "",
    twitter_description: "",
    twitter_image: "",
    twitter_handle: "",
    robots_txt: "",
    google_verification: "",
    bing_verification: "",
    google_analytics_id: "",
    facebook_pixel_id: "",
    canonical_url: "",
    structured_data: "",
    sitemap_enabled: true,
    auto_generate_meta: true,
  })

  const supabase = createClient()

  useEffect(() => {
    loadSettings()
    loadPageSEO()
  }, [])

  async function loadSettings() {
    setLoading(true)
    const { data } = await supabase.from("site_settings").select("*")
    if (data) {
      const settingsObj: Record<string, any> = {}
      data.forEach((item: Record<string, unknown>) => {
        const key = (item.key || item.setting_key || "") as string
        const value = (item.value || item.setting_value || "") as string
        if (key && Object.keys(settings).includes(key)) {
          // Handle boolean values
          if (value === "true" || value === "false") {
            settingsObj[key] = value === "true"
          } else {
            settingsObj[key] = value
          }
        }
      })
      setSettings((prev) => ({ ...prev, ...settingsObj }))
    }
    setLoading(false)
  }

  async function loadPageSEO() {
    const { data } = await supabase
      .from("seo_settings")
      .select("*")
      .order("page_path", { ascending: true })
    if (data) setPageSEOList(data)
  }

  async function saveSettings() {
    setSaving(true)
    setMessage("")
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from("site_settings").upsert(
          {
            key: key,
            value: String(value),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        )
      }
      setMessage("تم حفظ إعدادات SEO بنجاح")
    } catch (error) {
      setMessage("حدث خطأ أثناء حفظ الإعدادات")
    }
    setSaving(false)
  }

  async function savePageSEO() {
    if (!pageFormData.page_path || !pageFormData.page_title) {
      setMessage("يرجى ملء مسار الصفحة والعنوان")
      return
    }
    try {
      if (editingPageId) {
        await supabase.from("seo_settings").update(
          {
            ...pageFormData,
            updated_at: new Date().toISOString(),
          },
          { eq: { id: editingPageId } }
        )
        setMessage("تم تحديث إعدادات SEO للصفحة بنجاح")
      } else {
        await supabase.from("seo_settings").insert(pageFormData)
        setMessage("تم إضافة إعدادات SEO للصفحة بنجاح")
      }
      resetPageForm()
      loadPageSEO()
    } catch (error) {
      setMessage("حدث خطأ أثناء الحفظ")
    }
  }

  async function deletePageSEO(id: string) {
    if (!confirm("هل أنت متأكد من حذف إعدادات SEO لهذه الصفحة؟")) return
    await supabase.from("seo_settings").delete().eq("id", id)
    setMessage("تم حذف إعدادات SEO بنجاح")
    loadPageSEO()
  }

  function startEditPage(page: PageSEO) {
    setPageFormData({
      page_path: page.page_path,
      page_title: page.page_title,
      meta_description: page.meta_description || "",
      meta_keywords: page.meta_keywords || "",
      og_title: page.og_title || "",
      og_description: page.og_description || "",
      og_image: page.og_image || "",
      robots: page.robots || "index, follow",
      canonical_url: page.canonical_url || "",
      priority: page.priority || 0.5,
    })
    setEditingPageId(page.id)
    setIsAddingPage(true)
  }

  function resetPageForm() {
    setPageFormData({
      page_path: "",
      page_title: "",
      meta_description: "",
      meta_keywords: "",
      og_title: "",
      og_description: "",
      og_image: "",
      robots: "index, follow",
      canonical_url: "",
      priority: 0.5,
    })
    setEditingPageId(null)
    setIsAddingPage(false)
  }

  async function clearCache() {
    try {
      await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paths: ["/", "/khutba", "/dars", "/articles", "/books", "/videos", "/about"],
        }),
      })
      setMessage("تم مسح الكاش بنجاح! قد يستغرق التحديث بضع ثوانٍ.")
    } catch (error) {
      setMessage("حدث خطأ أثناء مسح الكاش")
    }
  }

  async function generateSitemap() {
    try {
      setMessage("جاري إنشاء خريطة الموقع...")
      await fetch("/api/sitemap/generate", { method: "POST" })
      setMessage("تم إنشاء خريطة الموقع بنجاح!")
    } catch (error) {
      setMessage("حدث خطأ أثناء إنشاء خريطة الموقع")
    }
  }

  // === AUDIT FUNCTIONS ===
  async function runAudit() {
    setAuditLoading(true)
    setAuditResults([])
    try {
      const [sermonsRes, lessonsRes, articlesRes, booksRes, mediaRes] = await Promise.all([
        supabase.from("sermons").select("id, slug, title, description, thumbnail_path, tags, content").eq("publish_status", "published"),
        supabase.from("lessons").select("id, slug, title, description, thumbnail_path, tags, content").eq("publish_status", "published"),
        supabase.from("articles").select("id, slug, title, content, thumbnail, featured_image, tags, excerpt").eq("publish_status", "published"),
        supabase.from("books").select("id, slug, title, description, cover_image, tags").eq("publish_status", "published"),
        supabase.from("media").select("id, title, description, thumbnail, tags").eq("publish_status", "published"),
      ])

      const results: ContentAuditItem[] = []

      const analyze = (item: any, type: string, typeName: string, urlPrefix: string, descField: string, imgField: string | string[]) => {
        const issues: string[] = []
        const title = item.title || ""
        const desc = item[descField] || item.description || item.excerpt || ""
        const cleanDesc = desc.replace(/<[^>]*>/g, "")
        const content = item.content || ""
        const cleanContent = content.replace(/<[^>]*>/g, "")
        const wordCount = cleanContent.split(/\s+/).filter(Boolean).length

        // Check title (Google truncates titles around 50–60 chars, 70 is the hard ceiling)
        if (!title) issues.push("لا يوجد عنوان")
        else if (title.length < 10) issues.push("العنوان قصير جداً (أقل من 10 أحرف)")
        else if (title.length > 70) issues.push("العنوان طويل جداً (أكثر من 70 حرف)")

        // Check description (Google shows ~155–160 chars of meta description)
        const hasDescription = cleanDesc.length > 0
        if (!hasDescription) issues.push("لا يوجد وصف")
        else if (cleanDesc.length < 50) issues.push("الوصف قصير (أقل من 50 حرف)")
        else if (cleanDesc.length > 200) issues.push("الوصف طويل (أكثر من 200 حرف)")

        // Check image
        const imgFields = Array.isArray(imgField) ? imgField : [imgField]
        const hasImage = imgFields.some(f => !!item[f] && !item[f].includes("placeholder"))
        if (!hasImage) issues.push("لا توجد صورة")

        // Check tags
        const hasTags = item.tags && Array.isArray(item.tags) && item.tags.length > 0
        if (!hasTags) issues.push("لا توجد وسوم (tags)")

        // Check content length
        if (type !== "book" && type !== "media" && wordCount < 100) issues.push("المحتوى قصير (أقل من 100 كلمة)")

        // Check slug — missing slug means the URL has to fall back to a UUID
        // which is terrible for SEO.
        if (type !== "media" && !item.slug) {
          issues.push("لا يوجد slug (الرابط يستخدم UUID)")
        }

        // Calculate score
        const totalChecks = type !== "media" ? 6 : 5
        const passedChecks = totalChecks - issues.length
        const score = Math.max(0, Math.round((passedChecks / totalChecks) * 100))

        const identifier = item.slug ? encodeURI(item.slug) : item.id

        results.push({
          id: item.id, title, type, typeName, url: `${urlPrefix}/${identifier}`,
          issues, score,
          hasDescription, hasImage, hasTags,
          titleLength: title.length, descriptionLength: cleanDesc.length,
        })
      }

      sermonsRes.data?.forEach(s => analyze(s, "sermon", "خطبة", "/khutba", "description", "thumbnail_path"))
      lessonsRes.data?.forEach(l => analyze(l, "lesson", "درس", "/dars", "description", "thumbnail_path"))
      articlesRes.data?.forEach(a => analyze(a, "article", "مقال", "/articles", "excerpt", ["featured_image", "thumbnail"]))
      booksRes.data?.forEach(b => analyze(b, "book", "كتاب", "/books", "description", "cover_image"))
      mediaRes.data?.forEach(m => analyze(m, "media", "مرئيات", "/videos", "description", "thumbnail"))

      results.sort((a, b) => a.score - b.score)
      setAuditResults(results)
    } catch (err) {
      setMessage("حدث خطأ أثناء فحص المحتوى")
    }
    setAuditLoading(false)
  }

  // === REDIRECT FUNCTIONS ===
  async function loadRedirects() {
    setRedirectsLoading(true)
    try {
      const res = await fetch("/api/redirects")
      const json = await res.json()
      setRedirects(json.data || [])
    } catch {
      setMessage("حدث خطأ في تحميل التحويلات")
    }
    setRedirectsLoading(false)
  }

  async function saveRedirect() {
    if (!redirectForm.source_path || !redirectForm.destination_path) {
      setMessage("يرجى ملء المسار المصدر والوجهة")
      return
    }
    try {
      if (editingRedirectId) {
        await fetch("/api/redirects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingRedirectId, ...redirectForm }),
        })
        setMessage("تم تحديث التحويلة بنجاح")
      } else {
        await fetch("/api/redirects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(redirectForm),
        })
        setMessage("تم إضافة التحويلة بنجاح")
      }
      resetRedirectForm()
      loadRedirects()
    } catch {
      setMessage("حدث خطأ أثناء الحفظ")
    }
  }

  async function deleteRedirect(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه التحويلة؟")) return
    await fetch(`/api/redirects?id=${id}`, { method: "DELETE" })
    setMessage("تم حذف التحويلة")
    loadRedirects()
  }

  async function toggleRedirect(id: string, is_active: boolean) {
    await fetch("/api/redirects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    loadRedirects()
  }

  function startEditRedirect(r: Redirect) {
    setRedirectForm({ source_path: r.source_path, destination_path: r.destination_path, redirect_type: r.redirect_type, is_active: r.is_active })
    setEditingRedirectId(r.id)
    setIsAddingRedirect(true)
  }

  function resetRedirectForm() {
    setRedirectForm({ source_path: "", destination_path: "", redirect_type: 301, is_active: true })
    setEditingRedirectId(null)
    setIsAddingRedirect(false)
  }

  // === INDEXING FUNCTIONS ===
  async function loadIndexingUrls() {
    setIndexingLoading(true)
    setPingResults([])
    setPingSummary(null)
    try {
      // Match sitemap & canonical URL rules exactly: prefer slug, fall back to id.
      // Previous version always used id, which caused 301 redirects on every
      // crawl and wasted Google's crawl budget.
      const [sermonsRes, lessonsRes, articlesRes, booksRes, mediaRes] = await Promise.all([
        supabase.from("sermons").select("id, slug, title").eq("publish_status", "published"),
        supabase.from("lessons").select("id, slug, title").eq("publish_status", "published"),
        supabase.from("articles").select("id, slug, title").eq("publish_status", "published"),
        supabase.from("books").select("id, slug, title").eq("publish_status", "published"),
        supabase.from("media").select("id, title").eq("publish_status", "published"),
      ])

      const urls: { url: string; type: string }[] = [
        { url: "/", type: "صفحة رئيسية" },
        { url: "/about", type: "عن الشيخ" },
        { url: "/khutba", type: "الخطب" },
        { url: "/dars", type: "الدروس" },
        { url: "/articles", type: "المقالات" },
        { url: "/books", type: "الكتب" },
        { url: "/videos", type: "المرئيات" },
      ]
      const toIdent = (row: { slug?: string | null; id: string }) =>
        row.slug ? encodeURI(row.slug) : row.id
      sermonsRes.data?.forEach((s: any) => urls.push({ url: `/khutba/${toIdent(s)}`, type: `خطبة: ${s.title?.slice(0, 30) || ''}` }))
      lessonsRes.data?.forEach((l: any) => urls.push({ url: `/dars/${toIdent(l)}`, type: `درس: ${l.title?.slice(0, 30) || ''}` }))
      articlesRes.data?.forEach((a: any) => urls.push({ url: `/articles/${toIdent(a)}`, type: `مقال: ${a.title?.slice(0, 30) || ''}` }))
      booksRes.data?.forEach((b: any) => urls.push({ url: `/books/${toIdent(b)}`, type: `كتاب: ${b.title?.slice(0, 30) || ''}` }))
      mediaRes.data?.forEach((m: any) => urls.push({ url: `/videos/${m.id}`, type: `فيديو: ${m.title?.slice(0, 30) || ''}` }))

      setIndexingUrls(urls)
    } catch {
      setMessage("حدث خطأ في تحميل الروابط")
    }
    setIndexingLoading(false)
  }

  async function runDiagnostic() {
    setDiagnosticLoading(true)
    try {
      const res = await fetch("/api/seo/ping", { method: "GET" })
      const json = await res.json()
      setDiagnostic(json)

      // Also verify the key file is reachable
      try {
        const keyRes = await fetch(json.keyLocation)
        if (!keyRes.ok) {
          setMessage(`تحذير: مفتاح IndexNow غير قابل للوصول عبر ${json.keyLocation}`)
        } else {
          setMessage("تم التحقق: IndexNow مهيأ بشكل صحيح ومفتاح التحقق متاح")
        }
      } catch {
        setMessage("تحذير: تعذّر التحقق من مفتاح IndexNow")
      }
    } catch {
      setMessage("فشل الاتصال بخدمة IndexNow")
    }
    setDiagnosticLoading(false)
  }

  async function pingSelectedUrls() {
    if (selectedUrls.size === 0) {
      setMessage("يرجى تحديد روابط للإرسال")
      return
    }
    setIndexingLoading(true)
    setPingResults([])
    setPingSummary(null)
    try {
      const res = await fetch("/api/seo/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: Array.from(selectedUrls) }),
      })
      const json = await res.json()
      setPingResults(json.results || [])
      setPingSummary(
        json.indexnow
          ? { status: json.indexnow.status, submitted: json.indexnow.submitted, body: json.indexnow.body }
          : null
      )
      setMessage(json.message || (json.success ? "تم الإرسال" : "فشل الإرسال"))
    } catch {
      setMessage("حدث خطأ أثناء الإرسال")
    }
    setIndexingLoading(false)
  }

  function toggleUrl(url: string) {
    setSelectedUrls(prev => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url); else next.add(url)
      return next
    })
  }

  function selectAllUrls() {
    if (selectedUrls.size === indexingUrls.length) {
      setSelectedUrls(new Set())
    } else {
      setSelectedUrls(new Set(indexingUrls.map(u => u.url)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-3">
          تحسين محركات البحث المتقدم
        </span>
        <h1 className="text-4xl font-bold mb-4">
          إعدادات <span className="text-primary">SEO</span>
          الاحترافية
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          تحسين شامل لظهور موقعك في محركات البحث وشبكات التواصل الاجتماعي مع أدوات تحليل متقدمة
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-center ${message.includes("خطأ") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
        >
          {message}
        </div>
      )}

      <div className="flex gap-2 justify-center flex-wrap">
        <Button
          variant={activeTab === "general" ? "default" : "outline"}
          onClick={() => setActiveTab("general")}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          البيانات الوصفية
        </Button>
        <Button
          variant={activeTab === "social" ? "default" : "outline"}
          onClick={() => setActiveTab("social")}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          الشبكات الاجتماعية
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "outline"}
          onClick={() => setActiveTab("analytics")}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          التحليلات
        </Button>
        <Button
          variant={activeTab === "verification" ? "default" : "outline"}
          onClick={() => setActiveTab("verification")}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          التحقق من الملكية
        </Button>
        <Button
          variant={activeTab === "pages" ? "default" : "outline"}
          onClick={() => setActiveTab("pages")}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          SEO الصفحات
        </Button>
        <Button
          variant={activeTab === "advanced" ? "default" : "outline"}
          onClick={() => setActiveTab("advanced")}
          className="gap-2"
        >
          <Code className="h-4 w-4" />
          إعدادات متقدمة
        </Button>
        <Button
          variant={activeTab === "audit" ? "default" : "outline"}
          onClick={() => { setActiveTab("audit"); if (auditResults.length === 0) runAudit() }}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          تدقيق المحتوى
        </Button>
        <Button
          variant={activeTab === "redirects" ? "default" : "outline"}
          onClick={() => { setActiveTab("redirects"); if (redirects.length === 0) loadRedirects() }}
          className="gap-2"
        >
          <ArrowRightLeft className="h-4 w-4" />
          التحويلات
        </Button>
        <Button
          variant={activeTab === "indexing" ? "default" : "outline"}
          onClick={() => { setActiveTab("indexing"); if (indexingUrls.length === 0) loadIndexingUrls() }}
          className="gap-2"
        >
          <Radar className="h-4 w-4" />
          الفهرسة
        </Button>
        <Button
          variant={activeTab === "cache" ? "default" : "outline"}
          onClick={() => setActiveTab("cache")}
          className="gap-2"
        >
          <Trash className="h-4 w-4" />
          الكاش والخرائط
        </Button>
      </div>

      {/* Content */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border">
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              البيانات الوصفية الأساسية
            </h2>
            <div className="space-y-2">
              <Label>عنوان الموقع (Meta Title)</Label>
              <Input
                value={settings.meta_title}
                onChange={(e) =>
                  setSettings({ ...settings, meta_title: e.target.value })}
                placeholder="الشيخ السيد مراد - العلم الشرعي"
                className="bg-muted"
                disabled={isVisitor}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  يظهر في نتائج البحث - يفضل 50-60 حرفاً
                </span>
                <span
                  className={
                    settings.meta_title.length > 60
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {settings.meta_title.length}/60
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>وصف الموقع (Meta Description)</Label>
              <Textarea
                value={settings.meta_description}
                onChange={(e) =>
                  setSettings({ ...settings, meta_description: e.target.value })}
                placeholder="الموقع الرسمي للشيخ السيد مراد - دروس وخطب ومقالات في العلوم الشرعية"
                rows={3}
                className="bg-muted resize-none"
                disabled={isVisitor}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  يظهر في نتائج البحث - يفضل 150-160 حرفاً
                </span>
                <span
                  className={
                    settings.meta_description.length > 160
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {settings.meta_description.length}/160
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الكلمات المفتاحية (Meta Keywords)</Label>
              <Input
                value={settings.meta_keywords}
                onChange={(e) =>
                  setSettings({ ...settings, meta_keywords: e.target.value })}
                placeholder="إسلام، فقه، عقيدة، خطب، دروس، الشيخ السيد مراد"
                className="bg-muted"
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                افصل بين الكلمات بفواصل
              </p>
            </div>

            <div className="space-y-2">
              <Label>الرابط الأساسي (Canonical URL)</Label>
              <Input
                value={settings.canonical_url}
                onChange={(e) =>
                  setSettings({ ...settings, canonical_url: e.target.value })}
                placeholder="https://example.com"
                dir="ltr"
                className="bg-muted"
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                الرابط الرسمي للموقع لتجنب المحتوى المكرر
              </p>
            </div>

            {/* SEO Preview */}
            <div className="bg-muted/50 rounded-xl p-6 mt-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                معاينة نتائج البحث
              </h3>
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {settings.meta_title || "عنوان الموقع"}
                </p>
                <p className="text-green-700 text-sm" dir="ltr">
                  {settings.canonical_url || "https://example.com"}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {settings.meta_description || "وصف الموقع يظهر هنا..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-8">
            {/* Open Graph */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Open Graph (Facebook, WhatsApp, Telegram)
              </h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>عنوان OG</Label>
                  <Input
                    value={settings.og_title}
                    onChange={(e) =>
                      setSettings({ ...settings, og_title: e.target.value })}
                    placeholder="اتركه فارغاً لاستخدام عنوان الصفحة"
                    className="bg-muted"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف OG</Label>
                  <Textarea
                    value={settings.og_description}
                    onChange={(e) =>
                      setSettings({ ...settings, og_description: e.target.value })}
                    rows={2}
                    className="bg-muted resize-none"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>صورة OG</Label>
                  <FileUpload
                    accept="image/*"
                    folder="seo"
                    label="رفع صورة OG"
                    onUploadComplete={(path) =>
                      setSettings({ ...settings, og_image: path })}
                    currentFile={settings.og_image}
                    disabled={isVisitor}
                  />
                  <p className="text-xs text-muted-foreground">
                    الأبعاد المثالية: 1200x630 بكسل
                  </p>
                </div>
              </div>
            </div>

            {/* Twitter */}
            <div className="space-y-6 pt-6 border-t">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-sky-500" />
                Twitter Cards
              </h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>حساب Twitter</Label>
                  <Input
                    value={settings.twitter_handle}
                    onChange={(e) =>
                      setSettings({ ...settings, twitter_handle: e.target.value })}
                    placeholder="@username"
                    dir="ltr"
                    className="bg-muted"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>عنوان Twitter</Label>
                  <Input
                    value={settings.twitter_title}
                    onChange={(e) =>
                      setSettings({ ...settings, twitter_title: e.target.value })}
                    className="bg-muted"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف Twitter</Label>
                  <Textarea
                    value={settings.twitter_description}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        twitter_description: e.target.value,
                      })}
                    rows={2}
                    className="bg-muted resize-none"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>صورة Twitter</Label>
                  <FileUpload
                    accept="image/*"
                    folder="seo"
                    label="رفع صورة Twitter"
                    onUploadComplete={(path) =>
                      setSettings({ ...settings, twitter_image: path })}
                    currentFile={settings.twitter_image}
                    disabled={isVisitor}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              أدوات التحليلات والتتبع
            </h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  value={settings.google_analytics_id}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      google_analytics_id: e.target.value,
                    })}
                  placeholder="G-XXXXXXXXXX أو UA-XXXXXXXX-X"
                  dir="ltr"
                  className="bg-muted"
                  disabled={isVisitor}
                />
                <p className="text-xs text-muted-foreground">
                  معرف Google Analytics لتتبع زيارات الموقع
                </p>
              </div>

              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input
                  value={settings.facebook_pixel_id}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      facebook_pixel_id: e.target.value,
                    })}
                  placeholder="XXXXXXXXXXXXXXXX"
                  dir="ltr"
                  className="bg-muted"
                  disabled={isVisitor}
                />
                <p className="text-xs text-muted-foreground">
                  معرف Facebook Pixel للتتبع والإعلانات
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">نصائح التحليلات</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>
                    استخدم Google Analytics 4 (GA4) للحصول على تحليلات أفضل
                  </li>
                  <li>راجع تقارير الزيارات أسبوعياً لفهم سلوك الزوار</li>
                  <li>تتبع الصفحات الأكثر زيارة وحسّن محتواها</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              التحقق من ملكية الموقع
            </h2>
            <div className="space-y-2">
              <Label>Google Search Console</Label>
              <Input
                value={settings.google_verification}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    google_verification: e.target.value,
                  })}
                placeholder="رمز التحقق من Google"
                dir="ltr"
                className="bg-muted"
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                احصل على الرمز من{" "}
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline"
                >
                  Google Search Console
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Bing Webmaster</Label>
              <Input
                value={settings.bing_verification}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bing_verification: e.target.value,
                  })}
                placeholder="رمز التحقق من Bing"
                dir="ltr"
                className="bg-muted"
                disabled={isVisitor}
              />
            </div>
          </div>
        )}

        {activeTab === "pages" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                إعدادات SEO لكل صفحة
              </h2>
              <Button
                onClick={() => setIsAddingPage(true)}
                disabled={isAddingPage || isVisitor}
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة صفحة
              </Button>
            </div>

            {/* Add/Edit Page SEO Form */}
            {isAddingPage && (
              <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">
                    {editingPageId ? "تعديل SEO الصفحة" : "إضافة SEO لصفحة جديدة"}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={resetPageForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>مسار الصفحة *</Label>
                    <Input
                      value={pageFormData.page_path}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          page_path: e.target.value,
                        })}
                      placeholder="/khutba"
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان الصفحة *</Label>
                    <Input
                      value={pageFormData.page_title}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          page_title: e.target.value,
                        })}
                      placeholder="الخطب - الشيخ السيد مراد"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>الوصف</Label>
                    <Textarea
                      value={pageFormData.meta_description}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          meta_description: e.target.value,
                        })}
                      rows={2}
                      className="bg-background resize-none"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الكلمات المفتاحية</Label>
                    <Input
                      value={pageFormData.meta_keywords}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          meta_keywords: e.target.value,
                        })}
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Robots</Label>
                    <Input
                      value={pageFormData.robots}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          robots: e.target.value,
                        })}
                      placeholder="index, follow"
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Canonical URL</Label>
                    <Input
                      value={pageFormData.canonical_url}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          canonical_url: e.target.value,
                        })}
                      placeholder="https://..."
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الأولوية في خريطة الموقع (0-1)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={pageFormData.priority}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          priority: parseFloat(e.target.value) || 0.5,
                        })}
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetPageForm}>
                    إلغاء
                  </Button>
                  <Button onClick={savePageSEO} disabled={isVisitor}>
                    <Save className="h-4 w-4 ml-2" />
                    {editingPageId ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </div>
            )}

            {/* Pages List */}
            <div className="space-y-3">
              {pageSEOList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد إعدادات SEO مخصصة للصفحات
                </div>
              ) : (
                pageSEOList.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded" dir="ltr">
                          {page.page_path}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          الأولوية: {page.priority || 0.5}
                        </span>
                      </div>

                      <h4 className="font-medium mt-1 truncate">
                        {page.page_title}
                      </h4>

                      {page.meta_description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {page.meta_description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditPage(page)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePageSEO(page.id)}
                        disabled={isVisitor}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              إعدادات SEO المتقدمة
            </h2>
            <div className="space-y-2">
              <Label>Robots.txt (إضافات مخصصة)</Label>
              <Textarea
                value={settings.robots_txt}
                onChange={(e) =>
                  setSettings({ ...settings, robots_txt: e.target.value })}
                rows={8}
                dir="ltr"
                className="bg-muted font-mono text-sm resize-none"
                placeholder={`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://example.com/sitemap.xml`}
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                تحكم في كيفية فهرسة محركات البحث لموقعك
              </p>
            </div>

            <div className="space-y-2">
              <Label>البيانات المنظمة (Structured Data / JSON-LD)</Label>
              <Textarea
                value={settings.structured_data}
                onChange={(e) =>
                  setSettings({ ...settings, structured_data: e.target.value })}
                rows={10}
                dir="ltr"
                className="bg-muted font-mono text-sm resize-none"
                placeholder={`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "الشيخ السيد مراد",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}`}
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                أضف بيانات منظمة لتحسين ظهورك في نتائج البحث
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <h3 className="font-bold">خريطة الموقع التلقائية</h3>
                  <p className="text-sm text-muted-foreground">
                    إنشاء sitemap.xml تلقائياً
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <UiverseToggle
                    checked={settings.sitemap_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, sitemap_enabled: checked })}
                    disabled={isVisitor}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <h3 className="font-bold">توليد Meta تلقائي</h3>
                  <p className="text-sm text-muted-foreground">
                    إنشاء وصف تلقائي للصفحات
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <UiverseToggle
                    checked={settings.auto_generate_meta}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, auto_generate_meta: checked })}
                    disabled={isVisitor}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cache" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trash className="h-5 w-5 text-primary" />
              مسح الكاش وخريطة الموقع
            </h2>
            <div className="grid gap-6">
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  مسح كاش جميع الصفحات
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  سيتم إعادة تحميل جميع الصفحات الرئيسية. استخدم هذا إذا لم تظهر التغييرات.
                </p>
                <Button
                  onClick={clearCache}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                  disabled={isVisitor}
                >
                  <Trash className="h-4 w-4 ml-2" />
                  مسح الكاش الآن
                </Button>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  إنشاء خريطة الموقع
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  إنشاء ملف sitemap.xml جديد يحتوي على جميع صفحات الموقع.
                </p>
                <Button onClick={generateSitemap} disabled={isVisitor}>
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء خريطة الموقع
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* === AUDIT TAB === */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                تدقيق SEO للمحتوى
              </h2>
              <Button onClick={runAudit} disabled={auditLoading}>
                <RefreshCw className={`h-4 w-4 ml-2 ${auditLoading ? "animate-spin" : ""}`} />
                {auditLoading ? "جاري الفحص..." : "إعادة الفحص"}
              </Button>
            </div>

            {auditResults.length > 0 && (
              <>
                {/* Overall Score */}
                {(() => {
                  const avgScore = Math.round(auditResults.reduce((acc, r) => acc + r.score, 0) / auditResults.length)
                  const color = avgScore >= 80 ? "text-green-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600"
                  const bgColor = avgScore >= 80 ? "bg-green-50 border-green-200" : avgScore >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
                  return (
                    <div className={`rounded-2xl p-6 border ${bgColor} text-center`}>
                      <div className={`text-5xl font-bold ${color} mb-2`}>{avgScore}%</div>
                      <p className="text-sm text-muted-foreground">النتيجة العامة لـ SEO ({auditResults.length} عنصر)</p>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{auditResults.filter(r => r.score >= 80).length}</div>
                          <div className="text-xs text-muted-foreground">ممتاز</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{auditResults.filter(r => r.score >= 40 && r.score < 80).length}</div>
                          <div className="text-xs text-muted-foreground">يحتاج تحسين</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{auditResults.filter(r => r.score < 40).length}</div>
                          <div className="text-xs text-muted-foreground">ضعيف</div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                  {["all", "sermon", "lesson", "article", "book", "media"].map(f => (
                    <Button key={f} variant={auditFilter === f ? "default" : "outline"} size="sm" onClick={() => setAuditFilter(f)}>
                      {f === "all" ? "الكل" : f === "sermon" ? "خطب" : f === "lesson" ? "دروس" : f === "article" ? "مقالات" : f === "book" ? "كتب" : "مرئيات"}
                      {f !== "all" && ` (${auditResults.filter(r => r.type === f).length})`}
                    </Button>
                  ))}
                </div>

                {/* Results */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {auditResults
                    .filter(r => auditFilter === "all" || r.type === auditFilter)
                    .map(item => (
                      <div key={item.id} className={`p-4 rounded-xl border ${item.score >= 80 ? "bg-green-50/50 border-green-200" :
                          item.score >= 40 ? "bg-yellow-50/50 border-yellow-200" :
                            "bg-red-50/50 border-red-200"
                        }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.score >= 80 ? "bg-green-100 text-green-700" :
                                  item.score >= 40 ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                }`}>
                                {item.score}%
                              </span>
                              <code className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{item.typeName}</code>
                            </div>
                            <h4 className="font-medium truncate">{item.title || "بدون عنوان"}</h4>
                            {item.issues.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.issues.map((issue, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                    <XCircle className="h-3 w-3" />
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.issues.length === 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                                <CheckCircle2 className="h-3 w-3" />
                                لا توجد مشاكل
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{item.titleLength} حرف</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}

            {!auditLoading && auditResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>اضغط "إعادة الفحص" لفحص محتوى الموقع</p>
              </div>
            )}
          </div>
        )}

        {/* === REDIRECTS TAB === */}
        {activeTab === "redirects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                إدارة التحويلات (Redirects)
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadRedirects} disabled={redirectsLoading}>
                  <RefreshCw className={`h-4 w-4 ml-2 ${redirectsLoading ? "animate-spin" : ""}`} />
                  تحديث
                </Button>
                <Button onClick={() => setIsAddingRedirect(true)} disabled={isAddingRedirect || isVisitor}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة تحويلة
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">ما هي التحويلات؟</h3>
              <p className="text-sm text-blue-700">
                تحويل 301 يعيد توجيه الزوار ومحركات البحث تلقائياً من رابط قديم إلى رابط جديد.<br />
                هذا يمنع فقدان ترتيب الصفحات عند تغيير الروابط.
              </p>
            </div>

            {/* Add/Edit Form */}
            {isAddingRedirect && (
              <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{editingRedirectId ? "تعديل التحويلة" : "إضافة تحويلة جديدة"}</h3>
                  <Button variant="ghost" size="icon" onClick={resetRedirectForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المسار القديم (المصدر) *</Label>
                    <Input
                      value={redirectForm.source_path}
                      onChange={(e) => setRedirectForm({ ...redirectForm, source_path: e.target.value })}
                      placeholder="/old-page"
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المسار الجديد (الوجهة) *</Label>
                    <Input
                      value={redirectForm.destination_path}
                      onChange={(e) => setRedirectForm({ ...redirectForm, destination_path: e.target.value })}
                      placeholder="/new-page أو https://..."
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع التحويل</Label>
                    <select
                      value={redirectForm.redirect_type}
                      onChange={(e) => setRedirectForm({ ...redirectForm, redirect_type: parseInt(e.target.value) })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      disabled={isVisitor}
                    >
                      <option value={301}>301 - تحويل دائم (يحافظ على SEO)</option>
                      <option value={302}>302 - تحويل مؤقت</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetRedirectForm}>إلغاء</Button>
                  <Button onClick={saveRedirect} disabled={isVisitor}>
                    <Save className="h-4 w-4 ml-2" />
                    {editingRedirectId ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </div>
            )}

            {/* Redirects List */}
            <div className="space-y-3">
              {redirectsLoading ? (
                <div className="text-center py-8"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
              ) : redirects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>لا توجد تحويلات بعد</p>
                </div>
              ) : (
                redirects.map(r => (
                  <div key={r.id} className={`flex items-center gap-4 p-4 rounded-lg border ${r.is_active ? "bg-muted/30" : "bg-muted/10 opacity-60"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded" dir="ltr">{r.source_path}</code>
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                        <code className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded" dir="ltr">{r.destination_path}</code>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.redirect_type === 301 ? "bg-blue-100 text-blue-600" : "bg-yellow-100 text-yellow-600"}`}>{r.redirect_type}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>الزيارات: {r.hits_count || 0}</span>
                        <span>{r.is_active ? "مفعّلة" : "معطّلة"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleRedirect(r.id, r.is_active)} title={r.is_active ? "تعطيل" : "تفعيل"}>
                        {r.is_active ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startEditRedirect(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteRedirect(r.id)} disabled={isVisitor}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* === INDEXING TAB === */}
        {activeTab === "indexing" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Radar className="h-5 w-5 text-primary" />
                مراقب الفهرسة
              </h2>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={runDiagnostic} disabled={diagnosticLoading}>
                  <Shield className={`h-4 w-4 ml-2 ${diagnosticLoading ? "animate-spin" : ""}`} />
                  فحص التهيئة
                </Button>
                <Button variant="outline" onClick={loadIndexingUrls} disabled={indexingLoading}>
                  <RefreshCw className={`h-4 w-4 ml-2 ${indexingLoading ? "animate-spin" : ""}`} />
                  تحديث القائمة
                </Button>
                <Button onClick={pingSelectedUrls} disabled={indexingLoading || selectedUrls.size === 0 || isVisitor}>
                  <Radar className="h-4 w-4 ml-2" />
                  إرسال ({selectedUrls.size}) رابط
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                كيف تعمل الفهرسة فعلياً؟
              </h3>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>
                  <strong>IndexNow:</strong> يتم إرسال الروابط مباشرةً إلى Bing و Yandex و Seznam و Yep و Naver عبر بروتوكول <code dir="ltr">IndexNow.org</code> الرسمي.
                </li>
                <li>
                  <strong>Google:</strong> أوقفت Google خدمة <code dir="ltr">/ping?sitemap=</code> عام 2023، ولا توفّر API عام لفهرسة المحتوى العادي. الطريقة الوحيدة المضمونة هي فتح
                  {" "}
                  <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer noopener" className="underline font-bold">Google Search Console</a>
                  {" "}
                  ثم استخدام <em>URL Inspection → Request Indexing</em>، مع الاعتماد على sitemap.xml للزحف التلقائي.
                </li>
                <li>مرة واحدة يومياً كافية — لا ترسل نفس الرابط بشكل متكرر.</li>
              </ul>
            </div>

            {/* Diagnostic info */}
            {diagnostic && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  تهيئة IndexNow
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700 font-semibold block text-xs">Endpoint</span>
                    <code className="text-xs bg-white px-2 py-1 rounded block truncate" dir="ltr">{diagnostic.endpoint}</code>
                  </div>
                  <div>
                    <span className="text-blue-700 font-semibold block text-xs">Host المعلن</span>
                    <code className="text-xs bg-white px-2 py-1 rounded block truncate" dir="ltr">{diagnostic.host}</code>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-blue-700 font-semibold block text-xs">ملف التحقق (keyLocation)</span>
                    <a href={diagnostic.keyLocation} target="_blank" rel="noreferrer noopener" className="text-xs bg-white px-2 py-1 rounded block truncate text-blue-600 hover:underline" dir="ltr">
                      {diagnostic.keyLocation} ↗
                    </a>
                  </div>
                  <div>
                    <span className="text-blue-700 font-semibold block text-xs">المفتاح</span>
                    <code className="text-xs bg-white px-2 py-1 rounded block" dir="ltr">{diagnostic.keyPreview}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Ping Summary */}
            {pingSummary && (
              <div className={`rounded-xl p-4 border ${pingSummary.status === 200 || pingSummary.status === 202
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-bold ${pingSummary.status === 200 || pingSummary.status === 202 ? "text-green-800" : "text-red-800"}`}>
                      استجابة IndexNow
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      HTTP {pingSummary.status || "n/a"} — تم إرسال {pingSummary.submitted} رابط
                    </p>
                  </div>
                  <div className="text-xs">
                    {pingSummary.status === 200 && <span className="text-green-700">OK (مقبول)</span>}
                    {pingSummary.status === 202 && <span className="text-green-700">Accepted (قيد المعالجة)</span>}
                    {pingSummary.status === 400 && <span className="text-red-700">Bad Request</span>}
                    {pingSummary.status === 403 && <span className="text-red-700">مفتاح غير صالح</span>}
                    {pingSummary.status === 422 && <span className="text-red-700">الروابط لا تطابق النطاق</span>}
                    {pingSummary.status === 429 && <span className="text-red-700">عدد محاولات مرتفع</span>}
                  </div>
                </div>
                {pingSummary.body && pingSummary.body.length > 0 && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-muted-foreground">تفاصيل الاستجابة</summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto" dir="ltr">{pingSummary.body}</pre>
                  </details>
                )}
              </div>
            )}

            {/* Ping Results */}
            {pingResults.length > 0 && (
              <div className="bg-muted/30 rounded-xl p-4 border">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  نتائج الإرسال ({pingResults.length} رابط)
                </h3>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {pingResults.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm p-2 rounded bg-background">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        IndexNow:
                        {r.indexnow === "success" ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600" title="Google لا تدعم الإرسال المباشر">
                        Google:
                        <AlertTriangle className="h-3 w-3" />
                      </span>
                      <span className="truncate flex-1 text-xs" dir="ltr">{r.url}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  ⓘ Google لا توفّر API عام للفهرسة — استخدم Search Console للفهرسة اليدوية.
                </p>
              </div>
            )}

            {/* URL Selection */}
            {indexingLoading ? (
              <div className="text-center py-8"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : indexingUrls.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={selectAllUrls}>
                    {selectedUrls.size === indexingUrls.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  </Button>
                  <span className="text-sm text-muted-foreground">{indexingUrls.length} رابط متاح</span>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {indexingUrls.map((item, i) => (
                    <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedUrls.has(item.url) ? "bg-primary/5 border-primary/30" : "bg-muted/20 border-border hover:bg-muted/40"
                      }`}>
                      <input
                        type="checkbox"
                        checked={selectedUrls.has(item.url)}
                        onChange={() => toggleUrl(item.url)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded block truncate" dir="ltr">{item.url}</code>
                        <span className="text-xs text-muted-foreground">{item.type}</span>
                      </div>
                      <a
                        href={`${(settings.canonical_url || "https://elsayed-mourad.online").replace(/\/$/, "")}${item.url}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Radar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>اضغط "تحديث القائمة" لتحميل الروابط</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {activeTab !== "pages" && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة تحميل
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving || isVisitor}
            className="bg-primary hover:bg-primary-hover text-white"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
