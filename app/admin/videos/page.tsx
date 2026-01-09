"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, Loader2, Video, Play, Search } from "lucide-react"
import { FileUpload } from "@/components/admin/file-upload"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

interface VideoFormData {
  title: string
  description: string
  type: string
  source: string
  url: string
  thumbnail: string
  duration: string
  publish_status: string
  is_active: boolean
}

interface MediaFormProps {
  formData: VideoFormData
  setFormData: React.Dispatch<React.SetStateAction<VideoFormData>>
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
}

function MediaForm({ formData, setFormData, submitting, onSubmit, onCancel, isEdit }: MediaFormProps) {

  return (<form onSubmit={onSubmit}
    className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">
        العنوان</label>
      <Input
        value={formData.title}
        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
      /> </div>
    <div className="space-y-2">
      <label className="text-sm font-medium">
        الوصف</label>
      <RichTextEditor
        content={formData.description}
        onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
        placeholder="وصف مختصر..."
      /> </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          النوع</label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
        > <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video">
              فيديو</SelectItem>
            <SelectItem value="audio">
              صوتي</SelectItem>
          </SelectContent>

        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          المصدر</label>
        <Select
          value={formData.source}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, source: value }))}
        > <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">
              يوتيوب</SelectItem>
            <SelectItem value="direct">
              رابط مباشر</SelectItem>
          </SelectContent>

        </Select>
      </div>

    </div>
    <div className="space-y-2">
      <label className="text-sm font-medium">
        الرابط</label>
      <Input
        value={formData.url}
        onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
      /> </div>
    <div className="space-y-2">
      <FileUpload
        label="صورة مصغرة"
        accept="image/*"
        folder="videos/thumbnails"
        currentFile={formData.thumbnail}
        onUploadComplete={(key) => setFormData((prev) => ({ ...prev, thumbnail: key }))}
      /> </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          المدة (اختياري)</label>
        <Input
          value={formData.duration}
          onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
          placeholder="مثال: 12:34"
        /> </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          الحالة</label>
        <Select
          value={formData.publish_status}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, publish_status: value }))}
        > <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">
              مسودة</SelectItem>
            <SelectItem value="published">
              منشور</SelectItem>
          </SelectContent>

        </Select>
      </div>

    </div>
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <p className="text-sm font-medium">
          تفعيل</p>
        <p className="text-xs text-text-muted">
          إظهار العنصر في الموقع</p>
      </div>

      <Switch
        checked={formData.is_active}
        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
      /> </div>
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        إلغاء </Button>
      <Button type="submit" className="bg-primary hover:bg-primary-hover text-white" disabled={submitting}>
        {submitting ? (<span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري الحفظ... </span>

        ) : isEdit ? ("تعديل") : ("إضافة")} </Button>
    </div>

  </form>

  )
}

export default
  function VideosAdminPage() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, views: 0 })
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "video",
    source: "youtube",
    url: "",
    thumbnail: "",
    duration: "",
    publish_status: "draft",
    is_active: true,
  })
  const resetForm = () => { setFormData({ title: "", description: "", type: "video", source: "youtube", url: "", thumbnail: "", duration: "", publish_status: "draft", is_active: true, }) }

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false })
    if (!error && data) {
      setItems(data)
      setStats({
        total: data.length,
        published: data.filter((i) => i.publish_status === "published").length,
        draft: data.filter((i) => i.publish_status === "draft").length,
        views: data.reduce((sum, i) => sum + (i.views || i.views_count || 0), 0),
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const insertPayload = {
      title: formData.title,
      description: formData.description || null,
      type: formData.type,
      source: formData.source,
      url: formData.url,
      thumbnail: formData.thumbnail || null,
      duration: formData.duration || null,
      publish_status: formData.publish_status,
      is_active: formData.is_active,
    }

    const { error } = await supabase.from("media").insert(insertPayload) 
    if (!error) { setIsAddModalOpen(false) 
      resetForm() 
    fetchItems() } else { alert("حدث خطأ أثناء الإضافة: " + error.message) } setSubmitting(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault() 
    if (!selectedItem)
      return setSubmitting(true) 
    const updatePayload = { title: formData.title, description: formData.description || null, type: formData.type, source: formData.source, url: formData.url, thumbnail: formData.thumbnail || null, duration: formData.duration || null, publish_status: formData.publish_status, is_active: formData.is_active, }

    const { error } = await supabase.from("media").update(updatePayload).eq("id", selectedItem.id) 
    if (!error) { setIsEditModalOpen(false) 
      setSelectedItem(null) 
    resetForm() 
    fetchItems() } else { alert("حدث خطأ أثناء التحديث: " + error.message) } setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟"))
      return 
    const { error } = await supabase.from("media").delete().eq("id", id) 
    if (!error) { fetchItems() } else { alert("حدث خطأ أثناء الحذف: " + error.message) }
  }

  const toggleActive = async (id: string,
    current: boolean) => {
      const { error} = await supabase.from("media").update({ is_active: !current }).eq("id", id) 
      if (!error) fetchItems()
  }

  const openEditModal = (item: any) => { setSelectedItem(item) 
    setFormData({ title: item.title || "", description: item.description || "", type: item.type || "video", source: item.source || "youtube", url: item.url || "", thumbnail: item.thumbnail || "", duration: item.duration || "", publish_status: item.publish_status || "draft", is_active: item.is_active ?? true, }) 
    setIsEditModalOpen(true) }

  const filteredItems = items.filter((item) => item.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  return (<div className="p-6 space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          إدارة المرئيات</h1>
        <p className="text-muted-foreground">
          إضافة وتعديل الفيديوهات والمحتوى المرئي</p>
      </div>

      <Dialog open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold">
            <Plus className="h-5 w-5 ml-2" />
            إضافة فيديو جديد </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) =>
          e.preventDefault()} > <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              إضافة فيديو جديد</DialogTitle>
          </DialogHeader>

          <MediaForm formData={formData}
            setFormData={setFormData}
            submitting={submitting}
            onSubmit={handleAdd}
            onCancel={() => { setIsAddModalOpen(false) 
            resetForm() }} /> </DialogContent>
      </Dialog>

    </div>

    {/* Stats */} <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-card">
        <CardContent className="p-4 text-center">
          <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">
            {stats.total}</div>
          <div className="text-sm text-muted-foreground">
            إجمالي الفيديوهات</div>
        </CardContent>

      </Card>
      <Card className="bg-card">
        <CardContent className="p-4 text-center">
          <Play className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold">
            {stats.published}</div>
          <div className="text-sm text-muted-foreground">
            منشور</div>
        </CardContent>

      </Card>
      <Card className="bg-card">
        <CardContent className="p-4 text-center">
          <Edit className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <div className="text-2xl font-bold">
            {stats.draft}</div>
          <div className="text-sm text-muted-foreground">
            مسودات</div>
        </CardContent>

      </Card>
      <Card className="bg-card">
        <CardContent className="p-4 text-center">
          <Eye className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">
            {stats.views}</div>
          <div className="text-sm text-muted-foreground">
            مشاهدات</div>
        </CardContent>

      </Card>
    </div>

    {/* Search */} <div className="relative max-w-md">
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="بحث في الفيديوهات..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pr-10 bg-muted"
      /> </div>

    {/* Table */} {loading ? (<div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>

    ) : (<Card className="bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">
              العنوان</TableHead>
            <TableHead className="text-right">
              النوع</TableHead>
            <TableHead className="text-right">
              المصدر</TableHead>
            <TableHead className="text-right">
              الحالة</TableHead>
            <TableHead className="text-right">
              المشاهدات</TableHead>
            <TableHead className="text-right">
              الإجراءات</TableHead>
          </TableRow>

        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => (<TableRow key={item.id}>
            <TableCell className="font-medium">
              {item.title}</TableCell>
            <TableCell>
              {item.type === "video" ? "فيديو" : "صوتي"}</TableCell>
            <TableCell>
              {item.source === "youtube" ? "يوتيوب" : "ملف محلي"}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${item.publish_status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`} >
                {item.publish_status === "published" ? "منشور" : "مسودة"} </span>
            </TableCell>

            <TableCell>
              {item.views || item.views_count || 0}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() =>
                  openEditModal(item)}> <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() =>
                  toggleActive(item.id, item.is_active)}> <Eye className={`h-4 w-4 ${item.is_active ? "text-green-500" : "text-gray-400"}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() =>
                  handleDelete(item.id)}> <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </TableCell>
          </TableRow>

          ))} </TableBody>
      </Table>

    </Card>

    )} {/* Edit Modal */} <Dialog open={isEditModalOpen}
      onOpenChange={setIsEditModalOpen}>
      <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) =>
        e.preventDefault()} > <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary">
            تعديل الفيديو</DialogTitle>
        </DialogHeader>

        <MediaForm formData={formData}
          setFormData={setFormData}
          submitting={submitting}
          onSubmit={handleEdit} isEdit onCancel={() => { setIsEditModalOpen(false) 
          setSelectedItem(null) 
          resetForm() }} /> </DialogContent>
    </Dialog>

  </div>

  )
}


