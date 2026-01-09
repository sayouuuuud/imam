"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, Users, Eye, EyeOff, Save, X, Loader2 } from "lucide-react"

interface CommunityPost {
  id: string
  title: string
  content: string
  author_name: string
  author_email?: string
  status: string
  is_approved: boolean
  views_count: number
  created_at: string
}

export default function CommunityAdminPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author_name: "",
    author_email: "",
    status: "pending",
    is_approved: false,
  })

  const supabase = createClient()

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading posts:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء تحميل المشاركات: " + error.message,
      })
    } else if (data) {
      setPosts(data)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!formData.title || !formData.content || !formData.author_name) {
      setMessage({
        type: "error",
        text: "يرجى ملء العنوان والمحتوى واسم الكاتب",
      })
      return
    }

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        author_name: formData.author_name,
        author_email: formData.author_email || null,
        status: formData.status,
        is_approved: formData.is_approved,
      }

      let error
      if (editingId) {
        const result = await supabase
          .from("community_posts")
          .update(payload)
          .eq("id", editingId)
        error = result.error
      } else {
        const result = await supabase.from("community_posts").insert(payload)
        error = result.error
      }

      if (error) throw error

      setMessage({
        type: "success",
        text: editingId
          ? "تم تحديث المشاركة بنجاح"
          : "تم إضافة المشاركة بنجاح",
      })
      resetForm()
      loadPosts()
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء الحفظ: " + error.message,
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه المشاركة؟")) return

    const { error } = await supabase.from("community_posts").delete().eq("id", id)

    if (error) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء الحذف: " + error.message,
      })
    } else {
      setMessage({
        type: "success",
        text: "تم حذف المشاركة بنجاح",
      })
      loadPosts()
    }
  }

  async function toggleApproval(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("community_posts")
      .update({
        is_approved: !currentStatus,
        status: !currentStatus ? "approved" : "pending",
      })
      .eq("id", id)

    if (error) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء تغيير الحالة",
      })
    } else {
      loadPosts()
    }
  }

  function startEdit(post: CommunityPost) {
    setFormData({
      title: post.title,
      content: post.content,
      author_name: post.author_name,
      author_email: post.author_email || "",
      status: post.status,
      is_approved: post.is_approved,
    })
    setEditingId(post.id)
    setIsAdding(true)
  }

  function resetForm() {
    setFormData({
      title: "",
      content: "",
      author_name: "",
      author_email: "",
      status: "pending",
      is_approved: false,
    })
    setEditingId(null)
    setIsAdding(false)
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
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              مشاركات المجتمع
            </h1>
          </div>

          <p className="text-text-muted">إدارة مشاركات وأنشطة المجتمع</p>
        </div>

        <Button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="bg-primary hover:bg-primary-hover text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة مشاركة جديدة
        </Button>
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

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {editingId ? "تعديل المشاركة" : "إضافة مشاركة جديدة"}
            </h2>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))}
                placeholder="عنوان المشاركة"
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الكاتب *</Label>
                <Input
                  value={formData.author_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      author_name: e.target.value,
                    }))}
                  placeholder="اسم الكاتب"
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={formData.author_email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      author_email: e.target.value,
                    }))}
                  placeholder="البريد الإلكتروني"
                  className="bg-muted"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>المحتوى *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))}
                rows={8}
                className="bg-muted resize-none"
                placeholder="محتوى المشاركة..."
              />
            </div>

            <div className="flex items-center gap-4">
              <Label>الحالة:</Label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))}
                className="bg-muted rounded-lg px-3 py-2 border border-border"
              >
                <option value="pending">قيد المراجعة</option>
                <option value="approved">موافق عليه</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={resetForm}>
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              <Save className="h-4 w-4 ml-2" />
              {editingId ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="grid gap-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Users className="h-12 w-12 mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">لا توجد مشاركات مجتمعية</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-card rounded-xl p-4 border border-border flex items-center gap-4"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      post.is_approved
                        ? "bg-green-100 text-green-600"
                        : post.status === "rejected"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {post.is_approved
                      ? "موافق عليه"
                      : post.status === "rejected"
                      ? "مرفوض"
                      : "قيد المراجعة"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {post.views_count || 0} مشاهدة
                  </span>
                </div>

                <h3 className="font-bold text-foreground truncate">
                  {post.title}
                </h3>
                <p className="text-sm text-text-muted">
                  بواسطة: {post.author_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleApproval(post.id, post.is_approved)}
                  title={post.is_approved ? "إلغاء الموافقة" : "الموافقة"}
                >
                  {post.is_approved ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEdit(post)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}