"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function Footer() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [settings, setSettings] = useState({
    youtube_channel: "",
    telegram_channel: "",
    facebook_page: "",
  })

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data } = await supabase.from("site_settings").select("*")
      if (data) {
        const settingsObj: Record<string, string> = {}
        data.forEach((item: Record<string, unknown>) => {
          // Handle both possible column names: 'key' or 'setting_key'
          const key = (item.key || item.setting_key || "") as string
          const value = (item.value || item.setting_value || "") as string
          if (key) {
            settingsObj[key] = value
          }
        })
        setSettings({
          youtube_channel: settingsObj.youtube_channel || "",
          telegram_channel: settingsObj.telegram_channel || "",
          facebook_page: settingsObj.facebook_page || "",
        })
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      return
    }
    setStatus("loading")
    try {
      const supabase = createClient()
      const { error } = await supabase.from("subscribers").insert({
        whatsapp_number: email
      })
      if (error) {
        if (error.code === "23505") {
          setMessage("هذا الرقم مسجل بالفعل")
        } else {
          setMessage("حدث خطأ، يرجى المحاولة مرة أخرى")
        }
        setStatus("error")
        return
      }
      setMessage("تم الاشتراك بنجاح!")
      setStatus("success")
      setEmail("")
    } catch {
      setMessage("حدث خطأ، يرجى المحاولة مرة أخرى")
      setStatus("error")
    }
  } 
  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
 {/* Logo & Description */} <div className="space-y-4">
<div className="flex items-center gap-3">
 <div className="bg-primary text-white p-2 rounded-lg">
<span className="material-icons-outlined text-2xl">
mosque</span>
</div>

 <div className="flex flex-col">
<span className="font-bold text-lg text-primary leading-none font-serif">
 الشيخ السيد مراد </span>
<span className="text-xs text-text-muted">
عالم أزهري</span>
</div>

 </div>
<p className="text-sm text-text-muted leading-relaxed">
 علم نافع للقلب السليم، ومنهج وسطي قويم يجمع بين الأصالة والمعاصرة. نسعى لنشر الوعي الديني الصحيح. </p>
<div className="flex gap-4">
 {settings.facebook_page && ( <a href={settings.facebook_page}
target = "_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" >
<span className="material-icons-outlined text-xl">
facebook</span>
</a>

 )} {settings.youtube_channel && ( <a href={settings.youtube_channel}
target = "_blank" rel="noopener noreferrer" className="text-text-muted hover:text-red-500 transition-colors" >
<span className="material-icons-outlined text-xl">
smart_display</span>
</a>

 )} {settings.telegram_channel && ( <a href={settings.telegram_channel}
target = "_blank" rel="noopener noreferrer" className="text-text-muted hover:text-sky-500 transition-colors" >
<span className="material-icons-outlined text-xl">
send</span>
</a>

 )} </div>
</div>

 {/* Quick Links */} <div>
<h4 className="font-bold text-foreground mb-4">
روابط سريعة</h4>
<ul className="space-y-2 text-sm text-text-muted">
 <li>
<Link href="/about" className="hover:text-primary transition-colors">
 عن الشيخ </Link>
</li>

 <li>
<Link href="/contact" className="hover:text-primary transition-colors">
 اتصل بنا </Link>
</li>

 <li>
<Link href="/schedule" className="hover:text-primary transition-colors">
 جدول الدروس </Link>
</li>

 <li>
<Link href="/privacy" className="hover:text-primary transition-colors">
 سياسة الخصوصية </Link>
</li>

 <li>
<Link href="/terms" className="hover:text-primary transition-colors">
 الشروط والأحكام </Link>
</li>

 </ul>
</div>

 {/* Content Sections */} <div>
<h4 className="font-bold text-foreground mb-4">
أقسام المحتوى</h4>
<ul className="space-y-2 text-sm text-text-muted">
 <li>
<Link href="/khutba" className="hover:text-primary transition-colors">
 الخطب المنبرية </Link>
</li>

 <li>
<Link href="/dars" className="hover:text-primary transition-colors">
 الدروس العلمية </Link>
</li>

 <li>
<Link href="/articles" className="hover:text-primary transition-colors">
 المقالات </Link>
</li>

 <li>
<Link href="/books" className="hover:text-primary transition-colors">
 الكتب </Link>
</li>

 <li>
<Link href="/videos" className="hover:text-primary transition-colors">
 المرئيات </Link>
</li>

 </ul>
</div>

 {/* Newsletter */} <div>
<h4 className="font-bold text-foreground mb-4">
ابق على تواصل</h4>
<p className="text-sm text-text-muted mb-4">
 اشترك في قائمة التواصل للبقاء على اتصال معنا عبر واتساب. </p>
<form onSubmit={handleSubmit}
className="flex flex-col gap-2">
 <input type="tel" value={email}
onChange = {(e) =>
 setEmail(e.target.value)}
placeholder = "رقم واتساب" disabled={status === "loading"}
className="bg-background border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary disabled:opacity-50" /> <button type="submit" disabled={status === "loading"}
className="bg-primary hover:bg-primary-hover text-white text-sm font-bold py-2 rounded-lg transition-colors disabled:opacity-50" >
 {status === "loading" ? "جاري الاشتراك..." : "اشترك الآن"} </button>
</form>

 {message && ( <p className={`text-xs mt-2 ${status === "success" ? "text-green-600" : "text-red-600"}`}>
{message}</p>

 )} </div>
</div>

 {/* Copyright */} <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-muted">
<span>
© 2025 الشيخ السيد مراد. جميع الحقوق محفوظة.</span>
<div className="flex items-center gap-4">
 <span>
صُنع بـ</span>
<span className="material-icons-outlined text-red-500 text-sm">
favorite</span>
<span>
لخدمة الإسلام</span>
</div>

 </div>
</div>

 </footer>

 ) }
