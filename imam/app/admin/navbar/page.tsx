"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { revalidateNavbar } from "@/app/actions/revalidate"
import { FileUpload } from "@/components/admin/file-upload"
import { Plus, Pencil, Trash2, Save, X, GripVertical, Menu, Eye, EyeOff, Loader2, ArrowUp, ArrowDown, ImageIcon } from "lucide-react"

interface NavItem {
  id: string
  label: string
  href: string
  order_index: number
  is_active: boolean
  created_at: string
}

export default function NavbarAdminPage() {
  const [items, setItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [activeTab, setActiveTab] = useState<"items" | "logo">("items")
  const [logoUrl, setLogoUrl] = useState("")
  const [savingLogo, setSavingLogo] = useState(false)
  const [formData, setFormData] = useState({
    label: "",
    href: "",
    is_active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    loadItems()
    loadLogo()
  }, [])

  async function loadLogo() {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "site_logo")
      .single()

    if (data) {
      setLogoUrl(data.value || "")
    }
  }

  async function saveLogo() {
    setSavingLogo(true)
    setMessage({ type: "", text: "" })

    try {
      await supabase.from("site_settings").upsert(
        {
          key: "site_logo",
          value: logoUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )

      await revalidateNavbar()
      setMessage({
        type: "success",
        text: "تم حفظ الشعار بنجاح",
      })
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء حفظ الشعار",
      })
    }

    setSavingLogo(false)
  }

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from("navbar_items")
      .select("*")
      .order("order_index", { ascending: true })

    if (error) {
      setItems([])
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!formData.label || !formData.href) {
      setMessage({
        type: "error",
        text: "يرجى ملء جميع الحقول المطلوبة",
      })
      return
    }

    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      if (editingId) {
        const { error } = await supabase
          .from("navbar_items")
          .update({
            label: formData.label,
            href: formData.href,
            is_active: formData.is_active,
          })
          .eq("id", editingId)

        if (error) throw error

        setMessage({
          type: "success",
          text: "تم تحديث العنصر بنجاح",
        })
      } else {
        const maxOrder =
          items.length > 0 ? Math.max(...items.map((item) => item.order_index)) : 0

        const { error } = await supabase.from("navbar_items").insert({
          label: formData.label,
          href: formData.href,
          is_active: formData.is_active,
          order_index: maxOrder + 1,
        })

        if (error) throw error

        setMessage({
          type: "success",
          text: "تم إضافة العنصر بنجاح",
        })
      }

      await revalidateNavbar()
      await loadItems()
      resetForm()
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء حفظ العنصر",
      })
    }

    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا العنصر؟")) return

    try {
      const { error } = await supabase.from("navbar_items").delete().eq("id", id)

      if (error) throw error

      await revalidateNavbar()
      await loadItems()

      setMessage({
        type: "success",
        text: "تم حذف العنصر بنجاح",
      })
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء حذف العنصر",
      })
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("navbar_items")
        .update({ is_active: !currentStatus })
        .eq("id", id)

      if (error) throw error

      await revalidateNavbar()
      await loadItems()
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء تحديث حالة العنصر",
      })
    }
  }

  async function moveItem(id: string, direction: "up" | "down") {
    const currentIndex = items.findIndex((item) => item.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[currentIndex].order_index
    newItems[currentIndex].order_index = newItems[newIndex].order_index
    newItems[newIndex].order_index = temp

    setItems(newItems)

    try {
      await supabase
        .from("navbar_items")
        .update({ order_index: newItems[currentIndex].order_index })
        .eq("id", newItems[currentIndex].id)

      await supabase
        .from("navbar_items")
        .update({ order_index: newItems[newIndex].order_index })
        .eq("id", newItems[newIndex].id)

      await revalidateNavbar()
    } catch (error: any) {
      // Revert on error
      await loadItems()
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء إعادة الترتيب",
      })
    }
  }

  function startEdit(item: NavItem) {
    setEditingId(item.id)
    setFormData({
      label: item.label,
      href: item.href,
      is_active: item.is_active,
    })
    setIsAdding(true)
  }

  function resetForm() {
    setEditingId(null)
    setIsAdding(false)
    setFormData({
      label: "",
      href: "",
      is_active: true,
    })
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Menu className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-primary">إدارة القائمة العلوية</h1>
          </div>

          <p className="text-muted-foreground">
            تحكم في عناصر شريط التنقل الرئيسي وشعار الموقع
          </p>
        </div>
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

      {/* Tab Buttons */}
      <div className="flex gap-2 border-b border-border pb-2 mb-6">
        <Button
          variant={activeTab === "items" ? "default" : "ghost"}
          onClick={() => setActiveTab("items")}
          className={activeTab === "items" ? "bg-primary text-white" : ""}
        >
          <Menu className="h-4 w-4 ml-2" />
          عناصر القائمة
        </Button>

        <Button
          variant={activeTab === "logo" ? "default" : "ghost"}
          onClick={() => setActiveTab("logo")}
          className={activeTab === "logo" ? "bg-primary text-white" : ""}
        >
          <ImageIcon className="h-4 w-4 ml-2" />
          شعار الموقع
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "items" && (
        <>
          {/* Add Button */}
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
              className="bg-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة عنصر جديد
            </Button>
          </div>

          {/* Add/Edit Form */}
          {isAdding && (
            <div className="bg-card rounded-2xl p-6 border shadow-sm mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingId ? "تعديل العنصر" : "إضافة عنصر جديد"}
                </h2>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>اسم العنصر *</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))}
                    placeholder="مثال: الرئيسية، خطب، دروس"
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الرابط *</Label>
                  <Input
                    value={formData.href}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        href: e.target.value,
                      }))}
                    placeholder="مثال: /khutba أو /articles"
                    className="bg-muted"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 p-4 bg-muted/50 rounded-xl">
                <div>
                  <Label className="text-base">نشط في الموقع</Label>
                  <p className="text-sm text-muted-foreground">
                    إظهار العنصر في القائمة العلوية
                  </p>
                </div>

                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: checked,
                    }))}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary hover:bg-primary-hover"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      {editingId ? "تحديث" : "إضافة"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            <div className="p-4 border-b bg-muted/50">
              <h2 className="font-bold text-lg">عناصر القائمة ({items.length})</h2>
              <p className="text-sm text-muted-foreground">
                استخدم أزرار الأسهم لإعادة ترتيب العناصر
              </p>
            </div>

            {items.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Menu className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  لا توجد عناصر في القائمة
                </h3>
                <p className="text-muted-foreground">
                  أضف عناصر جديدة لتظهر في شريط التنقل الرئيسي
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      !item.is_active ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(item.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(item.id, "down")}
                        disabled={index === items.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Menu className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            item.is_active
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.is_active ? "نشط" : "مخفي"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>

                      <h3 className="font-bold">{item.label}</h3>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        {item.href}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(item.id, item.is_active)}
                        title={item.is_active ? "إخفاء" : "إظهار"}
                      >
                        {item.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(item)}
                        title="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">ملاحظات هامة</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>العناصر النشطة فقط ستظهر في شريط التنقل الرئيسي</li>
              <li>يمكنك إعادة ترتيب العناصر باستخدام أزرار الأسهم</li>
              <li>تأكد من أن الروابط صحيحة وتبدأ بـ /</li>
              <li>التغييرات تظهر في الموقع فوراً بعد الحفظ</li>
            </ul>
          </div>
        </>
      )}

      {activeTab === "logo" && (
        <>
          {/* Logo Content */}
          <div className="bg-card rounded-2xl p-6 border shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                شعار الموقع
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                الشعار الذي سيظهر في شريط التنقل العلوي
              </p>
            </div>

            {logoUrl && (
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  معاينة الشعار الحالي:
                </p>
                <img
                  src={logoUrl || "/placeholder.svg"}
                  alt="شعار الموقع"
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}

            <FileUpload
              accept="image/*"
              folder="logo"
              label="رفع شعار جديد"
              onUploadComplete={(path) => setLogoUrl(path)}
              currentFile={logoUrl}
            />

            <div className="space-y-2">
              <Label>أو أدخل رابط الشعار مباشرة</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                dir="ltr"
                className="bg-muted"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={saveLogo}
                disabled={savingLogo}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                {savingLogo ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ الشعار
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Logo Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">ملاحظات هامة</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>الشعار سيظهر في شريط التنقل العلوي</li>
              <li>يفضل استخدام صورة شفافة (PNG) أو مع خلفية بيضاء</li>
              <li>الحجم المثالي: 200x60 بكسل</li>
              <li>التغييرات تظهر في الموقع فوراً بعد الحفظ</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}