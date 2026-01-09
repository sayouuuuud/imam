"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Link2, Plus, Trash2, Save, Youtube, Send, Facebook, MessageCircle, Globe, Music, Video, Twitter, Instagram, LinkIcon } from "lucide-react"

interface SocialLink {
  id?: string
  platform: string
  url: string
  icon: string
  is_active: boolean
}

const platformOptions = [
  { value: "youtube", label: "يوتيوب", icon: "youtube" },
  { value: "telegram", label: "تليجرام", icon: "telegram" },
  { value: "facebook", label: "فيسبوك", icon: "facebook" },
  { value: "twitter", label: "تويتر/إكس", icon: "twitter" },
  { value: "instagram", label: "إنستجرام", icon: "instagram" },
  { value: "whatsapp", label: "واتساب", icon: "whatsapp" },
  { value: "tiktok", label: "تيك توك", icon: "tiktok" },
  { value: "soundcloud", label: "ساوند كلاود", icon: "soundcloud" },
  { value: "website", label: "موقع إلكتروني", icon: "website" },
  { value: "other", label: "آخر", icon: "other" },
]

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "youtube":
      return <Youtube className="h-5 w-5" />
    case "telegram":
      return <Send className="h-5 w-5" />
    case "facebook":
      return <Facebook className="h-5 w-5" />
    case "twitter":
      return <Twitter className="h-5 w-5" />
    case "instagram":
      return <Instagram className="h-5 w-5" />
    case "whatsapp":
      return <MessageCircle className="h-5 w-5" />
    case "tiktok":
      return <Video className="h-5 w-5" />
    case "soundcloud":
      return <Music className="h-5 w-5" />
    case "website":
      return <Globe className="h-5 w-5" />
    default:
      return <LinkIcon className="h-5 w-5" />
  }
}

export default function AdminProfilePage() {
  const [links, setLinks] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const supabase = createClient()

  useEffect(() => {
    fetchLinks()
  }, [])

  async function fetchLinks() {
    setLoading(true)

    // Load from site_settings
    const { data } = await supabase.from("site_settings").select("*")

    if (data) {
      const socialLinks: SocialLink[] = []
      const settingsMap: Record<string, string> = {}

      data.forEach((item: Record<string, unknown>) => {
        const key = (item.key || item.setting_key || "") as string
        const value = (item.value || item.setting_value || "") as string
        if (key) settingsMap[key] = value
      })

      // Convert to array format for editing
      platformOptions.forEach((platform) => {
        const key = `${platform.value}_channel`
        const altKey = `${platform.value}_page`
        const url = settingsMap[key] || settingsMap[altKey] || ""
        if (url) {
          socialLinks.push({
            platform: platform.value,
            url,
            icon: platform.icon,
            is_active: true,
          })
        }
      })

      setLinks(socialLinks)
    }

    setLoading(false)
  }

  function addLink() {
    setLinks([
      ...links,
      { platform: "youtube", url: "", icon: "youtube", is_active: true },
    ])
  }

  function updateLink(index: number, field: string, value: string) {
    const newLinks = [...links]
    if (field === "platform") {
      const platform = platformOptions.find((p) => p.value === value)
      newLinks[index] = {
        ...newLinks[index],
        platform: value as string,
        icon: platform?.icon || "link",
      }
    } else {
      newLinks[index] = { ...newLinks[index], [field]: value }
    }
    setLinks(newLinks)
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index))
  }

  async function saveLinks() {
    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      // Save each link as a site_setting
      for (const link of links) {
        if (link.url) {
          const key = `${link.platform}_channel`
          await supabase.from("site_settings").upsert(
            {
              key,
              value: link.url,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          )
        }
      }

      setMessage({
        type: "success",
        text: "تم حفظ روابط التواصل بنجاح!",
      })
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء الحفظ: " + error.message,
      })
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-serif flex items-center gap-3">
          <Link2 className="h-8 w-8 text-primary" />
          روابط التواصل الاجتماعي
        </h1>
        <p className="text-text-muted mt-2">
          إدارة روابط وسائل التواصل التي تظهر في الموقع
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

      {/* Links Editor */}
      <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">روابط التواصل</h2>
          <Button onClick={addLink} variant="outline" size="sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة رابط
          </Button>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <Link2 className="h-12 w-12 mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">لا توجد روابط تواصل</p>
            <Button
              onClick={addLink}
              variant="outline"
              className="mt-4 bg-transparent"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة رابط جديد
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {getPlatformIcon(link.platform)}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">المنصة</Label>
                    <select
                      value={link.platform}
                      onChange={(e) =>
                        updateLink(index, "platform", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                    >
                      {platformOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">الرابط</Label>
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        updateLink(index, "url", e.target.value)
                      }
                      placeholder="https://..."
                      dir="ltr"
                      className="bg-background"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(index)}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={saveLinks}
            disabled={saving}
            className="bg-primary hover:bg-primary-hover text-white"
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

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          <strong>ملاحظة:</strong> ستظهر روابط التواصل المضافة في أسفل الموقع
          (Footer) بجانب شعار الموقع.
        </p>
      </div>
    </div>
  )
}