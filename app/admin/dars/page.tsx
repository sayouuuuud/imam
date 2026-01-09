"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { FileUpload } from "@/components/admin/file-upload"
import { Pagination } from "@/components/admin/pagination"
import { BookOpen, Plus, Eye, Search, Edit, Trash2, Loader2, CheckCircle, FileEdit } from "lucide-react"

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  lesson_type: string
  type: string
  media_source: string
  media_url?: string
  thumbnail_path?: string
  duration?: string
  publish_status: string
  is_active: boolean
  views_count: number
  created_at: string
  category_id?: string
}

interface Category {
  id: string
  name: string
  type: string
}

interface LessonFormData {
  title: string
  description: string
  lesson_type: string
  type: string
  media_source: string
  media_url: string
  thumbnail_path: string
  duration: string
  publish_status: string
  is_active: boolean
  category_id: string
}

interface LessonFormProps {
  formData: LessonFormData
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>
  categories: Category[]
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
}

function LessonForm({
  formData,
  setFormData,
  categories,
  submitting,
  onSubmit,
  onCancel,
  isEdit,
}: LessonFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>عنوان الدرس</Label>
        <Input
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              title: e.target.value,
            }))}
          className="w-full"
          placeholder="عنوان الدرس"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>الفئة</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              category_id: value,
            }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">بدون فئة</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>وصف مختصر</Label>
        <RichTextEditor
          content={formData.description}
          onChange={(html) =>
            setFormData((prev) => ({
              ...prev,
              description: html,
            }))}
          placeholder="وصف مختصر للدرس..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>نوع الدرس</Label>
          <Select
            value={formData.lesson_type}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                lesson_type: value,
              }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع الدرس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fiqh">فقه</SelectItem>
              <SelectItem value="aqeedah">عقيدة</SelectItem>
              <SelectItem value="hadith">حديث</SelectItem>
              <SelectItem value="tafseer">تفسير</SelectItem>
              <SelectItem value="seerah">سيرة</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>نوع الوسائط</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                type: value,
              }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع الوسائط" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">فيديو</SelectItem>
              <SelectItem value="audio">صوت</SelectItem>
              <SelectItem value="text">نص</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(formData.type === "video" || formData.type === "audio") && (
        <>
          <div className="space-y-2">
            <Label>مصدر الوسائط</Label>
            <Select
              value={formData.media_source}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  media_source: value,
                }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر مصدر الوسائط" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">يوتيوب</SelectItem>
                <SelectItem value="upload">رفع ملف</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {formData.media_source === "youtube"
                ? "رابط الوسائط"
                : "ملف الوسائط"}
            </Label>

            {formData.media_source === "youtube" ? (
              <Input
                value={formData.media_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    media_url: e.target.value,
                  }))}
                className="w-full"
                placeholder={
                  formData.type === "video"
                    ? "رابط فيديو يوتيوب"
                    : "رابط صوت"
                }
              />
            ) : (
              <FileUpload
                accept={formData.type === "video" ? "video/*" : "audio/*"}
                folder={
                  formData.type === "video"
                    ? "lessons/videos"
                    : "lessons/audios"
                }
                onUploadComplete={(path) =>
                  setFormData((prev) => ({
                    ...prev,
                    media_url: path,
                  }))}
                currentFile={formData.media_url}
                label="رفع ملف"
              />
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <FileUpload
          accept="image/*"
          folder="lessons/thumbnails"
          onUploadComplete={(path) =>
            setFormData((prev) => ({
              ...prev,
              thumbnail_path: path,
            }))}
          currentFile={formData.thumbnail_path}
          label="صورة مصغرة"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>المدة</Label>
          <Input
            value={formData.duration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                duration: e.target.value,
              }))}
            className="w-full"
            placeholder="مثال: 45:30"
          />
        </div>

        <div className="space-y-2">
          <Label>حالة النشر</Label>
          <Select
            value={formData.publish_status}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                publish_status: value,
              }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر حالة النشر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="published">منشور</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              is_active: checked,
            }))}
        />
        <Label>نشط</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" type="button" onClick={onCancel}>
          إلغاء
        </Button>
        <Button
          type="submit"
          className="bg-primary hover:bg-primary-hover text-white"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : isEdit ? (
            "حفظ التغييرات"
          ) : (
            "إضافة الدرس"
          )}
        </Button>
      </div>
    </form>
  )
}

const ITEMS_PER_PAGE = 10

export default function ManageDarsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState<LessonFormData>({
    title: "",
    description: "",
    lesson_type: "fiqh",
    type: "video",
    media_source: "youtube",
    media_url: "",
    thumbnail_path: "",
    duration: "",
    publish_status: "draft",
    is_active: true,
    category_id: "none", // Added category_id
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const supabase = createClient()

  const fetchLessons = async () => {
    setLoading(true)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1
    const { data, count, error } = await supabase
      .from("lessons")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, end)

    if (!error) {
      setLessons(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "lesson")
    if (data) setCategories(data)
  }

  useEffect(() => {
    fetchLessons()
    fetchCategories() // Fetch categories on mount
  }, [currentPage])

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const categoryIdToSend =
      formData.category_id === "none" ? null : formData.category_id
    const { error } = await supabase.from("lessons").insert({
      ...formData,
      media_url: formData.media_url || null,
      thumbnail_path: formData.thumbnail_path || null,
      category_id: categoryIdToSend,
    })

    if (!error) {
      setIsAddModalOpen(false)
      resetForm()
      fetchLessons()
    } else {
      alert("حدث خطأ أثناء الإضافة: " + error.message)
    }
    setSubmitting(false)
  }

  const handleEditLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLesson) return
    setSubmitting(true)
    const categoryIdToSend =
      formData.category_id === "none" ? null : formData.category_id
    const { error } = await supabase
      .from("lessons")
      .update({
        ...formData,
        media_url: formData.media_url || null,
        thumbnail_path: formData.thumbnail_path || null,
        category_id: categoryIdToSend,
      })
      .eq("id", editingLesson.id)

    if (!error) {
      setIsEditModalOpen(false)
      setEditingLesson(null)
      fetchLessons()
    }
    setSubmitting(false)
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الدرس؟")) return
    const { error } = await supabase.from("lessons").delete().eq("id", id)
    if (!error) fetchLessons()
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase
      .from("lessons")
      .update({ is_active: !currentStatus })
      .eq("id", id)
    fetchLessons()
  }

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      lesson_type: lesson.lesson_type,
      type: lesson.type,
      media_source: lesson.media_source,
      media_url: lesson.media_url || "",
      thumbnail_path: lesson.thumbnail_path || "",
      duration: lesson.duration || "",
      publish_status: lesson.publish_status,
      is_active: lesson.is_active ?? true,
      category_id: lesson.category_id || "none", // Handle category_id
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      lesson_type: "fiqh",
      type: "video",
      media_source: "youtube",
      media_url: "",
      thumbnail_path: "",
      duration: "",
      publish_status: "draft",
      is_active: true,
      category_id: "none", // Reset category_id
    })
  }

  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case "fiqh":
        return "فقه"
      case "seerah":
        return "سيرة"
      default:
        return "عام"
    }
  }

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return null
    const category = categories.find((c) => c.id === categoryId)
    return category?.name
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3 font-serif">
            <BookOpen className="h-8 w-8 text-primary" />
            إدارة الدروس العلمية
          </h1>
          <p className="text-text-muted mt-2">
            إضافة وتعديل الدروس والشروحات العلمية
          </p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold">
              <Plus className="h-5 w-5 ml-2" />
              إضافة درس جديد
            </Button>
          </DialogTrigger>

          <DialogContent
            className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary">
                إضافة درس جديد
              </DialogTitle>
            </DialogHeader>

            <LessonForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              submitting={submitting}
              onSubmit={handleAddLesson}
              onCancel={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-text-muted text-sm mb-1">
              إجمالي الدروس
            </span>
            <span className="text-3xl font-bold text-primary">{totalCount}</span>
          </div>

          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-text-muted text-sm mb-1">المنشورة</span>
            <span className="text-3xl font-bold text-green-600">
              {lessons.filter((l) => l.publish_status === "published").length}
            </span>
          </div>

          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-text-muted text-sm mb-1">مسودات</span>
            <span className="text-3xl font-bold text-yellow-600">
              {lessons.filter((l) => l.publish_status === "draft").length}
            </span>
          </div>

          <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
            <FileEdit className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50">
          <h2 className="font-bold text-xl text-primary">
            قائمة الدروس ({totalCount})
          </h2>
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 py-2 rounded-lg w-64 bg-card"
              placeholder="بحث عن درس..."
            />
            <Search className="absolute right-3 top-2.5 text-text-muted h-5 w-5" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            جاري التحميل...
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            {searchQuery ? "لا توجد نتائج" : "لا توجد دروس بعد"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-muted/50 text-xs font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">الدرس</th>
                  <th className="px-6 py-4">النوع</th>
                  <th className="px-6 py-4">التصنيف</th>
                  <th className="px-6 py-4">المشاهدات</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">نشط</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLessons.map((lesson, index) => (
                  <tr
                    key={lesson.id}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-text-muted text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {lesson.thumbnail_path ? (
                          <img
                            src={lesson.thumbnail_path || "/placeholder.svg"}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-foreground text-sm mb-1">
                            {lesson.title}
                          </h3>
                          <span className="text-xs text-text-muted">
                            {new Date(lesson.created_at).toLocaleDateString(
                              "ar-EG"
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        {getLessonTypeLabel(lesson.lesson_type)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {getCategoryName(lesson.category_id) ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {getCategoryName(lesson.category_id)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-muted">
                      {lesson.views_count || 0}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          lesson.publish_status === "published"
                            ? "bg-green-50 text-green-600"
                            : "bg-yellow-50 text-yellow-600"
                        }`}
                      >
                        {lesson.publish_status === "published"
                          ? "منشور"
                          : "مسودة"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Switch
                        checked={lesson.is_active ?? true}
                        onCheckedChange={() =>
                          toggleActive(lesson.id, lesson.is_active ?? true)
                        }
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            window.open(`/dars/${lesson.id}`, "_blank")
                          }
                          className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                          title="عرض"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(lesson)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              تعديل الدرس
            </DialogTitle>
          </DialogHeader>

          <LessonForm
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            submitting={submitting}
            onSubmit={handleEditLesson}
            isEdit={true}
            onCancel={() => {
              setIsEditModalOpen(false)
              resetForm()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}