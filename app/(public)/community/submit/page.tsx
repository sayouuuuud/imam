"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileUpload } from "@/components/admin/file-upload"
import { Loader2, ChevronLeft, Users } from "lucide-react"

export default function CommunitySubmitPage() {
  const [formData, setFormData] = useState({
    author_name: "",
    description: "",
    image_url: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.author_name || !formData.description) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("community_posts").insert({
        author_name: formData.author_name,
        description: formData.description,
        image_url: formData.image_url || null,
        is_approved: false,
      })
      if (error) {
        if (error.code === "42P01") {
          toast.error("جدول المجتمع غير موجود. يرجى تشغيل ملف الترحيل أولاً.")
        } else {
          throw error
        }
        return
      }
      toast.success("تم إرسال مشاركتك بنجاح! سيتم مراجعتها قريباً")
      setFormData({ author_name: "", description: "", image_url: "" })
    } catch (error: any) {
      console.error("[v0] Error submitting:", error)
      toast.error("حدث خطأ أثناء الإرسال: " + (error.message || "يرجى المحاولة مرة أخرى"))
    } finally {
      setSubmitting(false)
    }
  } 
  return ( <div className="min-h-screen bg-background py-12">
<div className="max-w-2xl mx-auto px-4">
 {/* Breadcrumb */} <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
<Link href="/" className="hover:text-primary">
 الرئيسية </Link>
<ChevronLeft className="h-4 w-4 rtl-flip" />
 <Link href="/community" className="hover:text-primary">
 المجتمع </Link>
<ChevronLeft className="h-4 w-4 rtl-flip" />
 <span className="text-primary font-medium">
مشاركة جديدة</span>
</div>

 {/* Hero Section */} <div className="text-center mb-8">
<span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
 <Users className="h-4 w-4 inline ml-1" />
 مشاركة جديدة </span>
<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
شارك معنا</h1>
<p className="text-text-muted">
شاركنا بتجربتك ومساهماتك في مجتمعنا العلمي</p>
</div>

 {/* Submission Form */} <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
<form onSubmit={handleSubmit}
className="space-y-6">
 {/* Image Upload */} <div className="space-y-2">
<Label>
الصورة (اختياري)</Label>
<FileUpload accept="image/*" folder="community" label="رفع صورة" onUploadComplete={(path) =>
 setFormData({ ...formData, image_url: path })}
currentFile = {formData.image_url} /> </div>

 {/* Author Name */} <div className="space-y-2">
<Label>
 الاسم <span className="text-red-500">
*</span>
</Label>

 <Input value={formData.author_name}
onChange = {(e) =>
 setFormData({ ...formData, author_name: e.target.value })}
placeholder = "أدخل اسمك" className="bg-muted" required /> </div>

 {/* Description */} <div className="space-y-2">
<Label>
 المشاركة <span className="text-red-500">
*</span>
</Label>

 <Textarea value={formData.description}
onChange = {(e) =>
 setFormData({ ...formData, description: e.target.value })}
placeholder = "اكتب مشاركتك هنا..." className="bg-muted resize-none" rows={5} required /> </div>
<Button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white" disabled={submitting}>
 {submitting ? ( <> <Loader2 className="h-4 w-4 ml-2 animate-spin" />
 جاري الإرسال... </>
 ) : ( "إرسال المشاركة" )} </Button>
</form>

 </div>

 {/* Info */} <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
<p className="text-blue-800 text-sm text-center">
 <strong>
ملاحظة:</strong>

 سيتم مراجعة مشاركتك قبل نشرها في المجتمع </p>
</div>

 </div>
</div>

 ) }
