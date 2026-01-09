"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Edit, FolderTree, ChevronLeft } from "lucide-react"

interface Category {
  id: string
  name: string
  type: string
  description?: string
  parent_category_id?: string | null
  created_at: string
}

const CONTENT_TYPES = [
  { value: "sermon", label: "خطبة" },
  { value: "lesson", label: "درس" },
  { value: "article", label: "مقال" },
  { value: "book", label: "كتاب" },
  { value: "media", label: "مرئيات" },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [formData, setFormData] = useState({
    name: "",
    type: "sermon",
    description: "",
    parent_category_id: "none",
  })
  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching categories:", error)
        setMessage({
          type: "error",
          text: "حدث خطأ أثناء جلب التصنيفات: " + error.message,
        })
        setCategories([])
      } else {
        setCategories(data || [])
      }
    } catch (err: any) {
      console.error("[v0] Fetch error:", err)
      setMessage({
        type: "error",
        text: "حدث خطأ غير متوقع",
      })
      setCategories([])
    }
    setLoading(false)
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      parent_category_id: category.parent_category_id || "none",
    })
    setDialogOpen(true)
  }

  function handleNew() {
    setEditingCategory(null)
    setFormData({
      name: "",
      type: "sermon",
      description: "",
      parent_category_id: "none",
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        parent_category_id:
          formData.parent_category_id === "none" ? null : formData.parent_category_id,
      }
      let error
      if (editingCategory) {
        const result = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id)
        error = result.error
      } else {
        const result = await supabase.from("categories").insert([payload])
        error = result.error
      }

      if (error) throw error

      setMessage({
        type: "success",
        text: editingCategory
          ? "تم تحديث التصنيف بنجاح"
          : "تم إضافة التصنيف بنجاح",
      })
      setDialogOpen(false)
      fetchCategories()
    } catch (error: any) {
      console.error("[v0] Error saving category:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء الحفظ: " + error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء الحذف: " + error.message,
      })
    } else {
      setMessage({
        type: "success",
        text: "تم حذف التصنيف بنجاح",
      })
      fetchCategories()
    }
  }

  function getParentCategories(type: string) {
    return categories.filter((c) => c.type === type && !c.parent_category_id)
  }

  function getChildCategories(parentId: string) {
    return categories.filter((c) => c.parent_category_id === parentId)
  }

  function groupCategoriesByType() {
    const grouped: Record<string, Category[]> = {}
    CONTENT_TYPES.forEach((type) => {
      grouped[type.value] = categories.filter((c) => c.type === type.value)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const groupedCategories = groupCategoriesByType()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderTree className="h-8 w-8 text-primary" />
            التصنيفات
          </h1>
          <p className="text-text-muted mt-2">
            إدارة تصنيفات المحتوى مع دعم التصنيفات الفرعية
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleNew}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة تصنيف
            </Button>
          </DialogTrigger>

          <DialogContent
            className="sm:max-w-lg bg-card"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>اسم التصنيف</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))}
                  required
                  placeholder="مثال: فقه العبادات"
                />
              </div>

              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))}
                  rows={2}
                  placeholder="وصف مختصر للتصنيف"
                />
              </div>

              <div>
                <Label>نوع المحتوى</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: value,
                      parent_category_id: "none",
                    }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>التصنيف الأب (اختياري)</Label>
                <Select
                  value={formData.parent_category_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      parent_category_id: value,
                    }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="بدون تصنيف أب (تصنيف رئيسي)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تصنيف أب</SelectItem>
                    {getParentCategories(formData.type)
                      .filter((c) => c.id !== editingCategory?.id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-muted mt-1">
                  اختر تصنيف أب لجعل هذا تصنيفاً فرعياً
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      <div className="space-y-6">
        {CONTENT_TYPES.map((type) => {
          const typeCategories = groupedCategories[type.value] || []
          const parentCats = typeCategories.filter((c) => !c.parent_category_id)

          if (typeCategories.length === 0) return null

          return (
            <div
              key={type.value}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-sm">
                  {type.label}
                </span>
                <span className="text-sm text-text-muted font-normal">
                  ({typeCategories.length} تصنيف)
                </span>
              </h3>

              <div className="space-y-2">
                {parentCats.map((category) => {
                  const children = getChildCategories(category.id)
                  return (
                    <div key={category.id}>
                      {/* Parent Category */}
                      <div className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-lg transition-colors border border-border">
                        <FolderTree className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {category.name}
                            </span>
                            {children.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-text-muted">
                                {children.length} فرعي
                              </span>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-xs text-text-muted mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Child Categories */}
                      {children.length > 0 && (
                        <div className="mr-8 mt-1 space-y-1">
                          {children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors border border-border/50 bg-muted/20"
                            >
                              <ChevronLeft className="h-4 w-4 text-text-muted" />
                              <div className="flex-1">
                                <span className="font-medium text-foreground text-sm">
                                  {child.name}
                                </span>
                                {child.description && (
                                  <p className="text-xs text-text-muted mt-0.5">
                                    {child.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(child)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(child.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Orphan categories (those with parent_category_id but parent doesn't exist) */}
                {typeCategories
                  .filter(
                    (c) =>
                      c.parent_category_id &&
                      !categories.find((p) => p.id === c.parent_category_id)
                  )
                  .map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-lg transition-colors border border-border"
                    >
                      <FolderTree className="h-5 w-5 text-text-muted" />
                      <div className="flex-1">
                        <span className="font-medium text-foreground">
                          {category.name}
                        </span>
                        {category.description && (
                          <p className="text-xs text-text-muted mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-6 text-center py-12">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              لا توجد تصنيفات
            </h3>
            <p className="text-text-muted">ابدأ بإضافة تصنيف جديد</p>
          </div>
        )}
      </div>
    </div>
  )
}