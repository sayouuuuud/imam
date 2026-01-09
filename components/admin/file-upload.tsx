"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, X, FileAudio, FileVideo, FileImage, FileText, CheckCircle } from "lucide-react"

interface FileUploadProps {
  accept: string
  folder: string
  onUploadComplete: (path: string) => void
  currentFile?: string
  label: string
}

export function FileUpload({ accept, folder, onUploadComplete, currentFile, label }: FileUploadProps) {
  const [filePath, setFilePath] = useState(currentFile || "")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep internal state in sync when editing existing items
  useEffect(() => {
    setFilePath(currentFile || "")
  }, [currentFile])

  const isImage = accept.includes("image")
  const isAudio = accept.includes("audio")
  const isVideo = accept.includes("video")
  const isPdf = accept === "application/pdf" || accept.includes("pdf")

  const resolvePreviewSrc = (value: string) => {
    if (!value) return ""
    // External URLs (e.g. YouTube)
    if (/^https?:\/\//i.test(value)) return value
    // Local images (start with / and don't contain uploads/)
    if (value.startsWith('/') && !value.includes('uploads/')) return value
    // Uploaded files (contain uploads/)
    return `/api/download?key=${encodeURIComponent(value)}`
  }

const getIcon = () => {
    if (isImage) return <FileImage className="h-10 w-10 text-primary" />
    if (isAudio) return <FileAudio className="h-10 w-10 text-primary" />
    if (isVideo) return <FileVideo className="h-10 w-10 text-primary" />
    return <FileText className="h-10 w-10 text-primary" />
  }

const getAcceptText = () => {
    if (isImage) return "صور (PNG, JPG, WEBP, GIF)"
    if (isAudio) return "ملفات صوتية (MP3, WAV, OGG)"
    if (isVideo) return "ملفات فيديو (MP4, WEBM)"
    if (isPdf) return "ملفات PDF"
    return "جميع الملفات المدعومة"
  }

const handleFileSelect = async (file: File) => {
    if (!file) return

    setUploading(true)
    setError("")
    setSuccess(false)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "فشل في رفع الملف")
      }

const data = await response.json()

      // Store the file key for long-term storage, not the signed URL which expires
      setFilePath(data.key)
      onUploadComplete(data.key)
      setSuccess(true)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء رفع الملف")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
  }

const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
  }

const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

const handleRemove = () => {
    setFilePath("")
    onUploadComplete("")
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

const handleManualPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value
    setFilePath(path)
    onUploadComplete(path)
  }

  return (
    <div className="space-y-3">
<Label className="text-sm font-medium text-foreground">{label}</Label>

      {filePath && (
        <div className="mb-3 p-4 bg-muted rounded-xl border border-border">
<div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
<div className="p-2 bg-success-bg rounded-lg">
                <CheckCircle className="h-6 w-6 text-success-border" />
</div>
<div>
<p className="font-medium text-foreground">تم اختيار الملف</p>
<p className="text-xs text-muted-foreground">الملف جاهز للاستخدام</p>
</div>
            </div>
<Button type="button" variant="destructive" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4 ml-1" />
              حذف
            </Button>
</div>

          {/* Preview for images only */}
          {isImage && (
            <div className="mt-3 pt-3 border-t border-border">
              <img
                src={filePath ? resolvePreviewSrc(filePath) : "/placeholder.svg"}
                alt="معاينة"
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Preview for PDFs */}
          {isPdf && filePath && (
            <div className="mt-3 pt-3 border-t border-border">
<iframe
                src={resolvePreviewSrc(filePath)}
className="w-full h-32 border border-border rounded-lg"
                title="معاينة PDF"
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!filePath && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
onDrop = {handleDrop}
onDragOver = {handleDragOver}
onDragLeave = {handleDragLeave}
onClick = {() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
type = "file"
            accept={accept}
onChange = {handleInputChange}
className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-4">
<Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="w-full max-w-xs">
<div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>جاري الرفع...</span>
<span>{uploadProgress}%</span>
</div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
<div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {getIcon()}
              <div>
<p className="text-base font-medium text-foreground">اسحب الملف هنا أو اضغط للاختيار</p>
<p className="text-sm text-muted-foreground mt-1">{getAcceptText()}</p>
<p className="text-xs text-muted-foreground mt-1">الحد الأقصى: 50 ميجابايت</p>
</div>
              <Button type="button" variant="outline" size="default" className="mt-2 bg-transparent">
<Upload className="h-4 w-4 ml-2" />
                اختر ملف من جهازك
              </Button>
</div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-error-bg text-error-border rounded-lg">
<X className="h-5 w-5" />
          <span className="text-sm">{error}</span>
</div>
      )}

      {/* Manual Path Input */}
      <details className="mt-3">
<summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors">
          أو أدخل الرابط يدوياً (مثل روابط يوتيوب)
        </summary>
<div className="mt-2 space-y-2">
          <Input
            type="text"
            value={filePath}
onChange = {handleManualPathChange}
placeholder = "رابط ملف (Backblaze/Supabase) أو https://youtube.com/..."
            className="bg-muted font-mono text-sm"
            dir="ltr"
          />
<p className="text-xs text-muted-foreground">يمكنك إدخال مسار ملف محلي أو رابط خارجي مباشرة</p>
</div>
      </details>
</div>
  )
}
