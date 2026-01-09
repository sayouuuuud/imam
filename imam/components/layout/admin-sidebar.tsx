"use client"

 import Link from "next/link" import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils" interface NavItem { href: string label: string icon: string }

const mainNavItems: NavItem[] = [ { href: "/admin", label: "لوحة التحكم", icon: "dashboard" }, { href: "/admin/lessons", label: "الدروس والمحاضرات", icon: "menu_book" }, { href: "/admin/articles", label: "المقالات العلمية", icon: "article" }, { href: "/admin/books", label: "مكتبة الكتب", icon: "library_books" }, { href: "/admin/khutba", label: "الخطب المنبرية", icon: "mic" }, { href: "/admin/media", label: "المرئيات والصوتيات", icon: "video_library" }, ] const managementNavItems: NavItem[] = [ { href: "/admin/categories", label: "التصنيفات", icon: "category" }, { href: "/admin/comments", label: "إدارة التعليقات", icon: "comment" }, { href: "/admin/subscribers", label: "المشتركين", icon: "people" }, { href: "/admin/settings", label: "الإعدادات", icon: "settings" }, ] export 
function AdminSidebar() {
 const pathname = usePathname() 
  return ( <aside className="w-72 bg-primary text-white hidden md:flex flex-col shadow-xl z-20 relative min-h-screen">
 {/* Logo Header */} <div className="p-8 flex items-center gap-3 border-b border-white/10">
<div className="bg-white/10 p-2 rounded-lg">
 <span className="material-icons-outlined text-3xl text-secondary">
mosque</span>
</div>

 <div>
<h1 className="font-bold text-lg leading-tight font-serif">
الشيخ السيد مراد</h1>
<p className="text-xs text-gray-300 opacity-80">
لوحة الإدارة العامة</p>
</div>

 </div>

 {/* Navigation */} <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
<p className="px-4 text-xs font-bold text-gray-400 mb-2 mt-2">
القائمة الرئيسية</p>

 {mainNavItems.map((item) => ( <Link key={item.href}
href={item.href}
className={cn( "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group", pathname === item.href ? "bg-white/10 text-secondary font-medium" : "text-gray-300 hover:bg-white/5 hover:text-white", )} >
<span className={cn( "material-icons-outlined transition-colors", pathname === item.href ? "text-secondary" : "group-hover:text-secondary", )} >
 {item.icon} </span>
<span>
{item.label}</span>
</Link>

 ))} <p className="px-4 text-xs font-bold text-gray-400 mb-2 mt-6">
الإدارة</p>

 {managementNavItems.map((item) => ( <Link key={item.href}
href={item.href}
className={cn( "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group", pathname === item.href ? "bg-white/10 text-secondary font-medium" : "text-gray-300 hover:bg-white/5 hover:text-white", )} >
<span className={cn( "material-icons-outlined transition-colors", pathname === item.href ? "text-secondary" : "group-hover:text-secondary", )} >
 {item.icon} </span>
<span>
{item.label}</span>
</Link>

 ))} </nav>

 {/* User Section */} <div className="p-4 border-t border-white/10 bg-black/10">
<div className="flex items-center gap-3">
 <img src="/admin-avatar-islamic.jpg" alt="Admin" className="w-10 h-10 rounded-full border-2 border-secondary" />
<div className="flex-1">
 <p className="text-sm font-bold">
مدير الموقع</p>
<p className="text-xs text-gray-400">
admin@example.com</p>
</div>

 <button className="text-gray-400 hover:text-white transition-colors">
<span className="material-icons-outlined">
logout</span>
</button>

 </div>
</div>

 </aside>

 ) }

