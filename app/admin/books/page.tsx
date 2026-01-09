"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { FileUpload } from "@/components/admin/file-upload"
import { BookOpen, Plus, Pencil, Trash2, Eye, Loader2, Search, Download, FileText } from "lucide-react"
import { useSignedUrl } from "@/hooks/use-signed-url"

interface Book {
  id: string
  title: string
  author: string
  description: string
  cover_image_path?: string
  pdf_file_path?: string
  publish_status: string
  is_active: boolean
  downloads_count: number
  download_count: number
  created_at: string
}

const ITEMS_PER_PAGE = 10

// Component to display book cover with signed URL
function BookImage({
  coverImagePath,
  alt,
  className
}: {
  coverImagePath?: string
  alt: string
  className?: string
}) {
  const { signedUrl, loading } = useSignedUrl(coverImagePath || null)

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted animate-pulse rounded-lg`}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <img
      src={signedUrl || "/placeholder.svg"}
      alt={alt}
      className={className}
    />
  )
}

const BookForm = ({
  onSubmit,
  isEdit = false,
  formData,
  setFormData,
  onCancel
}: {
  onSubmit: (e: React.FormEvent) => void
  isEdit?: boolean
  formData: any
  setFormData: any
  onCancel: () => void
}) => (
  <form onSubmit={onSubmit} className="space-y-6 mt-4">
    <div className="space-y-2">
      <Label>عنوان الكتاب *</Label>
      <Input
        value={formData.title}
        onChange={(e) =>
          setFormData((prev: any) => ({
            ...prev,
            title: e.target.value,
          }))}
        placeholder="عنوان الكتاب"
        className="bg-muted"
        required
      />
    </div>

    <div className="space-y-2">
      <Label>المؤلف</Label>
      <Input
        value={formData.author}
        onChange={(e) =>
          setFormData((prev: any) => ({
            ...prev,
            author: e.target.value,
          }))}
        placeholder="اسم المؤلف"
        className="bg-muted"
      />
    </div>

    <div className="space-y-2">
      <Label>الوصف</Label>
      <RichTextEditor
        content={formData.description}
        onChange={(html) =>
          setFormData((prev: any) => ({
            ...prev,
            description: html,
          }))}
        placeholder="وصف الكتاب..."
      />
    </div>

    <FileUpload
      accept="image/*"
      folder="books/covers"
      label="صورة الغلاف"
      onUploadComplete={(path) =>
        setFormData((prev: any) => ({
          ...prev,
          cover_image_path: path,
        }))}
      currentFile={formData.cover_image_path}
    />

    <FileUpload
      accept=".pdf"
      folder="books/pdfs"
      label="ملف PDF"
      onUploadComplete={(path) =>
        setFormData((prev: any) => ({
          ...prev,
          pdf_file_path: path,
        }))}
      currentFile={formData.pdf_file_path}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>حالة النشر</Label>
        <Select
          value={formData.publish_status}
          onValueChange={(value) =>
            setFormData((prev: any) => ({
              ...prev,
              publish_status: value,
            }))}
        >
          <SelectTrigger className="bg-muted">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="published">منشور</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-6 pt-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData((prev: any) => ({
                ...prev,
                is_active: checked,
              }))}
          />
          <Label>نشط</Label>
        </div>
      </div>
    </div>

    <div className="flex justify-end gap-3 pt-4 border-t border-border">
      <Button
        variant="outline"
        type="button"
        onClick={() => {
          // This will be handled by the parent
        }}
      >
        إلغاء
      </Button>
      <Button
        type="submit"
        className="bg-primary hover:bg-primary-hover text-white"
        disabled={false}
      >
        {isEdit ? "حفظ التغييرات" : "إضافة"}
      </Button>
    </div>
  </form>
)

export default function ManageBooksPage() {
  const [items, setItems] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Book | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    cover_image_path: "",
    pdf_file_path: "",
    publish_status: "draft",
    is_active: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const supabase = createClient()

  const fetchItems = async () => {
    setLoading(true)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1
    const { data, count, error } = await supabase
      .from("books")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, end)

    if (!error) {
      setItems(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [currentPage])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from("books").insert({
      title: formData.title,
      author: formData.author || null,
      description: formData.description || null,
      cover_image_path: formData.cover_image_path || null,
      pdf_file_path: formData.pdf_file_path || null,
      publish_status: formData.publish_status,
      is_active: formData.is_active,
    })

    if (!error) {
      setIsAddModalOpen(false)
      resetForm()
      fetchItems()
    } else {
      alert("حدث خطأ أثناء الإضافة: " + error.message)
    }
    setSubmitting(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setSubmitting(true)
    const { error } = await supabase
      .from("books")
      .update({
        title: formData.title,
        author: formData.author || null,
        description: formData.description || null,
        cover_image_path: formData.cover_image_path || null,
        pdf_file_path: formData.pdf_file_path || null,
        publish_status: formData.publish_status,
        is_active: formData.is_active,
      })
      .eq("id", editingItem.id)

    if (!error) {
      setIsEditModalOpen(false)
      setEditingItem(null)
      fetchItems()
    } else {
      alert("حدث خطأ أثناء التحديث: " + error.message)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكتاب؟")) return
    const { error } = await supabase.from("books").delete().eq("id", id)
    if (!error) fetchItems()
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase
      .from("books")
      .update({ is_active: !currentStatus })
      .eq("id", id)
    fetchItems()
  }

  const openEditModal = (item: Book) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      author: item.author || "",
      description: item.description || "",
      cover_image_path: item.cover_image_path || "",
      pdf_file_path: item.pdf_file_path || "",
      publish_status: item.publish_status,
      is_active: item.is_active ?? true,
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      description: "",
      cover_image_path: "",
      pdf_file_path: "",
      publish_status: "draft",
      is_active: true,
    })
  }

  // Reset form when opening add modal
  useEffect(() => {
    if (isAddModalOpen) {
      resetForm()
    }
  }, [isAddModalOpen])

  const filteredItems = items.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.author && i.author.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const getDownloadCount = (item: Book) =>
    item.downloads_count || item.download_count || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            إدارة الكتب
          </h1>
          <p className="text-text-muted mt-2">
            إضافة وتعديل الكتب والمؤلفات
          </p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold">
              <Plus className="h-5 w-5 ml-2" />
              إضافة كتاب جديد
            </Button>
          </DialogTrigger>

          <DialogContent
            className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary">
                إضافة كتاب جديد
              </DialogTitle>
            </DialogHeader>

            <BookForm
              onSubmit={handleAdd}
              formData={formData}
              setFormData={setFormData}
              onCancel={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-text-muted">إجمالي الكتب</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalCount}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
            <Eye className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-text-muted">المنشورة</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {items.filter((i) => i.publish_status === "published").length}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-text-muted">المسودات</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {items.filter((i) => i.publish_status === "draft").length}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Download className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-text-muted">إجمالي التحميلات</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {items.reduce((sum, i) => sum + getDownloadCount(i), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-foreground">قائمة الكتب</h3>
          <div className="relative">
            <Search className="absolute top-1/2 right-3 transform -translate-y-1/2 text-text-muted h-5 w-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-muted w-full md:w-64"
              placeholder="بحث..."
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-text-muted">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">
              {searchQuery ? "لا توجد نتائج" : "لا توجد كتب بعد"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-muted/50 text-text-muted text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">الكتاب</th>
                  <th className="px-6 py-4 font-medium">المؤلف</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">التحميلات</th>
                  <th className="px-6 py-4 font-medium">نشط</th>
                  <th className="px-6 py-4 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {item.cover_image_path ? (
                          <BookImage
                            coverImagePath={item.cover_image_path}
                            alt=""
                            className="w-12 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-foreground">{item.title}</p>
                          <p className="text-xs text-text-muted mt-1">
                            {new Date(item.created_at).toLocaleDateString("ar-EG")}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-text-muted">
                        {item.author || "غير محدد"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.publish_status === "published"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {item.publish_status === "published" ? "منشور" : "مسودة"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-text-muted">{getDownloadCount(item)}</span>
                    </td>

                    <td className="px-6 py-5">
                      <Switch
                        checked={item.is_active ?? true}
                        onCheckedChange={() =>
                          toggleActive(item.id, item.is_active ?? true)
                        }
                      />
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/books/${item.id}`, "_blank")}
                          className="p-2 rounded-lg hover:bg-muted text-text-muted hover:text-foreground transition-colors"
                          title="عرض"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg hover:bg-muted text-blue-600 transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg hover:bg-muted text-red-600 transition-colors"
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <span className="text-sm text-text-muted px-4">
              صفحة {currentPage} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              التالي
            </Button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              تعديل الكتاب
            </DialogTitle>
          </DialogHeader>

          <BookForm
            onSubmit={handleEdit}
            isEdit
            formData={formData}
            setFormData={setFormData}
            onCancel={() => {
              setIsEditModalOpen(false)
              setEditingItem(null)
              resetForm()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}