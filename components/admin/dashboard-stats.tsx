"use client"

 import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client" interface StatData { label: string value: string change: string changeType: "positive" | "neutral" icon: string iconBg: string iconColor: string }

export function DashboardStats() {
 const [stats, setStats] = useState<StatData[]>
([ { label: "إجمالي الدروس", value: "...", change: "جاري التحميل", changeType: "neutral", icon: "mic", iconBg: "bg-primary/10", iconColor: "text-primary", }, { label: "الكتب المنشورة", value: "...", change: "مكتبة شاملة", changeType: "neutral", icon: "menu_book", iconBg: "bg-secondary/10", iconColor: "text-yellow-600", }, { label: "المقالات", value: "...", change: "جاري التحميل", changeType: "neutral", icon: "article", iconBg: "bg-blue-50", iconColor: "text-blue-600", }, { label: "المشتركين", value: "...", change: "جاري التحميل", changeType: "neutral", icon: "group", iconBg: "bg-purple-50", iconColor: "text-purple-600", }, ]) useEffect(() => { async 
function fetchStats() {
 const supabase = createClient() // Fetch counts from database const [lessonsRes, booksRes, articlesRes, subscribersRes] = await Promise.all([ supabase.from("lessons").select("*", { count: "exact", head: true }), supabase.from("books").select("*", { count: "exact", head: true }), supabase.from("articles").select("*", { count: "exact", head: true }), supabase.from("subscribers").select("*", { count: "exact", head: true }), ]) setStats([ { label: "إجمالي الدروس", value: (lessonsRes.count || 0).toLocaleString(), change: "دروس علمية", changeType: "positive", icon: "mic", iconBg: "bg-primary/10", iconColor: "text-primary", }, { label: "الكتب المنشورة", value: (booksRes.count || 0).toLocaleString(), change: "مكتبة شاملة", changeType: "neutral", icon: "menu_book", iconBg: "bg-secondary/10", iconColor: "text-yellow-600", }, { label: "المقالات", value: (articlesRes.count || 0).toLocaleString(), change: "مقالات علمية", changeType: "positive", icon: "article", iconBg: "bg-blue-50", iconColor: "text-blue-600", }, { label: "المشتركين", value: (subscribersRes.count || 0).toLocaleString(), change: "مشترك في القائمة", changeType: "positive", icon: "group", iconBg: "bg-purple-50", iconColor: "text-purple-600", }, ]) } fetchStats() }, []) 
  return ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {stats.map((stat, index) => ( <div key={index}
className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex items-start justify-between" >
<div>
 <p className="text-text-muted text-sm font-medium mb-2">
{stat.label}</p>
<h3 className="text-3xl font-bold text-foreground">
{stat.value}</h3>
<p className={`text-xs mt-2 flex items-center gap-1 ${ stat.changeType === "positive" ? "text-green-600" : "text-text-muted" }`} >
 {stat.changeType === "positive" && <span className="material-icons-outlined text-sm">
trending_up</span>

} {stat.change} </p>
</div>

 <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
<span className="material-icons-outlined">
{stat.icon}</span>
</div>

 </div>

 ))} </div>

 ) }

