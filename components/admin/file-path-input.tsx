"use client"

 import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" interface FilePathInputProps { label: string value: string onChange: (path: string) => void placeholder?: string helpText?: string accept?: "image" | "audio" | "video" | "pdf" }

export function FilePathInput({ label, value, onChange, placeholder, helpText, accept = "image" }: FilePathInputProps) {
 const getDefaultPlaceholder = () => { switch (accept) { case "image": 
  return "/images/example.jpg" case "audio": 
  return "/audio/example.mp3" case "video": 
  return "/videos/example.mp4" case "pdf": 
  return "/pdfs/example.pdf" default: 
  return "/path/to/file" } }

const getHelpText = () => { switch (accept) { case "image": 
  return "ارفع الصورة يدوياً إلى /public/images/ ثم اكتب المسار هنا" case "audio": 
  return "ارفع الملف الصوتي يدوياً إلى /public/audio/ ثم اكتب المسار هنا" case "video": 
  return "ارفع الفيديو يدوياً إلى /public/videos/ أو اكتب رابط يوتيوب" case "pdf": 
  return "ارفع ملف PDF يدوياً إلى /public/pdfs/ ثم اكتب المسار هنا" default: 
  return "اكتب مسار الملف" } } 
  return ( <div className="space-y-2">
<Label className="text-sm font-medium text-foreground">
{label}</Label>
<Input type="text" placeholder={placeholder || getDefaultPlaceholder()}
value = {value}
onChange = {(e) =>
 onChange(e.target.value)}
className="bg-muted" dir="ltr" /> <p className="text-xs text-muted-foreground mt-1">
{helpText || getHelpText()}</p>

 {/* Preview for images */} {accept === "image" && value && ( <div className="mt-2 p-2 bg-muted rounded-lg">
<img src={value || "/placeholder.svg"}
                alt="معاينة" className="w-20 h-20 object-cover rounded-lg"
 { ;

(e.target as HTMLImageElement).style.display = "none" }} /> </div>

 )} {/* Preview for audio */} {accept === "audio" && value && !value.includes("youtube") && ( <div className="mt-2">
<audio src={value} controls className="w-full" />
 </div>

 )} </div>

 ) }
