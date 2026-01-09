"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/admin/file-upload"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { Loader2, User, Save, Quote, Link2, Plus, X } from "lucide-react"

interface SocialLink {
  id?: string
  platform: string
  url: string
  icon: string
  is_active: boolean
}

// تعريف واجهة البيانات كما تأتي من قاعدة البيانات
interface DBAboutPage {
  id: string
  sheikh_name: string | null
  image_path: string | null // في الكود نسميها sheikh_photo
  content: string | null // في الكود نسميها biography
  achievements: string | null
  education: string | null
  positions: string | null // في الكود نسميها current_positions
  quote: string | null // في الكود نسميها quote_text
  quote_author: string | null
  stats: any
  social_links: any
}

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [aboutData, setAboutData] = useState({
    id: "",
    sheikh_name: "",
    sheikh_photo: "",
    biography: "",
    achievements: "",
    education: "",
    current_positions: "",
    quote_text: "",
    quote_author: "",
    stats: {
      students: "5000+",
      books: "20+",
      lectures: "1000+",
      years: "25+",
    },
    social_links: [] as Array<{ platform: string; url: string; icon: string }>,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAboutData()
  }, [])

  const fetchAboutData = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("about_page").select("*").single()
    if (data) {
      // تحويل أسماء أعمدة قاعدة البيانات إلى أسماء متغيرات الحالة
      setAboutData({
        id: data.id || "",
        sheikh_name: data.sheikh_name || "",
        sheikh_photo: data.image_path || "", // ربط image_path بـ sheikh_photo
        biography: data.content || "", // ربط content بـ biography
        achievements: data.achievements || "",
        education: data.education || "",
        current_positions: data.positions || "", // ربط positions بـ current_positions
        quote_text: data.quote || "", // ربط quote بـ quote_text
        quote_author: data.quote_author || "- من أقوال الشيخ",
        stats: data.stats || {
          students: "5000+",
          books: "20+",
          lectures: "1000+",
          years: "25+",
        },
        social_links: data.social_links || [],
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
      // نستخدم معرفاً ثابتاً لصفحة "عن الشيخ" لضمان وجود صف واحد فقط
      const fixedId = '00000000-0000-0000-0000-000000000001';
      const payload = {
        id: fixedId, // فرض المعرف الثابت دائماً
        sheikh_name: aboutData.sheikh_name,
        image_path: aboutData.sheikh_photo,
        content: aboutData.biography,
        achievements: aboutData.achievements,
        education: aboutData.education,
        positions: aboutData.current_positions,
        quote: aboutData.quote_text,
        quote_author: aboutData.quote_author,
        stats: aboutData.stats,
        social_links: aboutData.social_links,
        updated_at: new Date().toISOString(),
      }
      // Upsert: يقوم بالتحديث إذا كان المعرف موجوداً، والإنشاء إذا لم يكن
      const { error } = await supabase
        .from("about_page")
        .upsert(payload, { onConflict: 'id' })
      if (error) throw error
      setMessage({ type: "success", text: "تم الحفظ بنجاح!" })
      // تحديث البيانات المعروضة لضمان التزامن
      fetchAboutData()
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      setMessage({ type: "error", text: "حدث خطأ أثناء الحفظ: " + (error.message || JSON.stringify(error)) })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          إدارة صفحة عن الشيخ
        </h1>
        <p className="text-text-muted mt-2">
          تحديث معلومات الشيخ والسيرة الذاتية وروابط التواصل
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-center ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-xl p-6 border border-border space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">
            المعلومات الأساسية
          </h2>
          <div>
            <Label>اسم الشيخ</Label>
            <Input
              value={aboutData.sheikh_name}
              onChange={(e) => setAboutData({ ...aboutData, sheikh_name: e.target.value })}
              className="bg-muted mt-1"
              placeholder="الشيخ السيد مراد"
            />
          </div>
          <div>
            <Label>صورة الشيخ</Label>
            <FileUpload
              accept="image/*"
              folder="about"
              label="صورة الشيخ"
              onUploadComplete={(path) => setAboutData({ ...aboutData, sheikh_photo: path })}
              currentFile={aboutData.sheikh_photo}
            />
          </div>
          <div>
            <Label>السيرة الذاتية</Label>
            <RichTextEditor
              content={aboutData.biography}
              onChange={(html) => setAboutData({ ...aboutData, biography: html })}
              placeholder="اكتب السيرة الذاتية للشيخ..."
            />
          </div>
          <div>
            <Label>الإنجازات</Label>
            <RichTextEditor
              content={aboutData.achievements || ""}
              onChange={(html) => setAboutData({ ...aboutData, achievements: html })}
              placeholder="اكتب إنجازات الشيخ..."
            />
          </div>
          <div>
            <Label>التعليم</Label>
            <RichTextEditor
              content={aboutData.education || ""}
              onChange={(html) => setAboutData({ ...aboutData, education: html })}
              placeholder="اكتب المؤهلات العلمية..."
            />
          </div>
          <div>
            <Label>المناصب الحالية</Label>
            <RichTextEditor
              content={aboutData.current_positions || ""}
              onChange={(html) => setAboutData({ ...aboutData, current_positions: html })}
              placeholder="اكتب المناصب الحالية..."
            />
          </div>
        </div>

        {/* Quote Section */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Quote className="h-5 w-5 text-primary" />
            الاقتباس المميز
          </h2>
          <p className="text-sm text-text-muted">هذا الاقتباس سيظهر في أسفل صفحة عن الشيخ</p>
          <div>
            <Label>نص الاقتباس</Label>
            <Textarea
              value={aboutData.quote_text}
              onChange={(e) => setAboutData({ ...aboutData, quote_text: e.target.value })}
              className="bg-muted mt-1 resize-none"
              rows={3}
              placeholder="إنما العلم خشية، وليس العلم بكثرة الرواية..."
            />
          </div>
          <div>
            <Label>مصدر الاقتباس</Label>
            <Input
              value={aboutData.quote_author}
              onChange={(e) => setAboutData({ ...aboutData, quote_author: e.target.value })}
              className="bg-muted mt-1"
              placeholder="- من أقوال الشيخ"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-xl font-bold text-foreground">الإحصائيات</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>عدد الطلاب</Label>
              <Input
                value={aboutData.stats.students}
                onChange={(e) =>
                  setAboutData({ ...aboutData, stats: { ...aboutData.stats, students: e.target.value } })
                }
                className="bg-muted mt-1"
                placeholder="5000+"
              />
            </div>
            <div>
              <Label>عدد الكتب</Label>
              <Input
                value={aboutData.stats.books}
                onChange={(e) =>
                  setAboutData({ ...aboutData, stats: { ...aboutData.stats, books: e.target.value } })
                }
                className="bg-muted mt-1"
                placeholder="20+"
              />
            </div>
            <div>
              <Label>عدد المحاضرات</Label>
              <Input
                value={aboutData.stats.lectures}
                onChange={(e) =>
                  setAboutData({ ...aboutData, stats: { ...aboutData.stats, lectures: e.target.value } })
                }
                className="bg-muted mt-1"
                placeholder="1000+"
              />
            </div>
            <div>
              <Label>سنوات الدعوة</Label>
              <Input
                value={aboutData.stats.years}
                onChange={(e) =>
                  setAboutData({ ...aboutData, stats: { ...aboutData.stats, years: e.target.value } })
                }
                className="bg-muted mt-1"
                placeholder="25+"
              />
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              روابط التواصل الاجتماعي
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setAboutData({
                  ...aboutData,
                  social_links: [...aboutData.social_links, { platform: "youtube", url: "", icon: "youtube" }],
                })
              }
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة رابط
            </Button>
          </div>

          <p className="text-sm text-text-muted">ستظهر هذه الروابط في صفحة عن الشيخ</p>

          {aboutData.social_links.length > 0 && (
            <div className="space-y-3">
              {aboutData.social_links.map((link, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <select
                    value={link.platform}
                    onChange={(e) =>
                      setAboutData({
                        ...aboutData,
                        social_links: aboutData.social_links.map((l, i) =>
                          i === index
                            ? {
                                ...l,
                                platform: e.target.value,
                                icon: ["youtube", "telegram", "facebook", "twitter", "instagram", "whatsapp"].includes(
                                  e.target.value,
                                )
                                  ? e.target.value
                                  : "link",
                              }
                            : l,
                        ),
                      })
                    }
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="youtube">يوتيوب</option>
                    <option value="telegram">تليجرام</option>
                    <option value="facebook">فيسبوك</option>
                    <option value="twitter">تويتر</option>
                    <option value="instagram">إنستجرام</option>
                    <option value="whatsapp">واتساب</option>
                  </select>

                  <Input
                    value={link.url}
                    onChange={(e) =>
                      setAboutData({
                        ...aboutData,
                        social_links: aboutData.social_links.map((l, i) =>
                          i === index ? { ...l, url: e.target.value } : l,
                        ),
                      })
                    }
                    placeholder="https://..."
                    dir="ltr"
                    className="flex-1 bg-background"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAboutData({
                        ...aboutData,
                        social_links: aboutData.social_links.filter((_, i) => i !== index),
                      })
                    }
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-hover text-white px-8"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
