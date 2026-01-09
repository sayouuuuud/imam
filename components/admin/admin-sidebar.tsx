"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Mic,
  GraduationCap,
  FileText,
  BookOpen,
  Video,
  Users,
  User,
  LinkIcon,
  Star,
  Calendar,
  Menu,
  Mail,
  FolderTree,
  Bell,
  Search,
  Shield,
  Database,
  ExternalLink,
  MoreHorizontal,
  ImageIcon,
  Headphones,
  Zap,
} from "lucide-react"

const sidebarSections = [
  {
    title: "لوحة التحكم",
    items: [{ title: "الرئيسية", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "إدارة المحتوى",
    items: [
      { title: "الخطب", href: "/admin/khutba", icon: Mic },
      { title: "الدروس", href: "/admin/dars", icon: GraduationCap },
      { title: "المقالات", href: "/admin/articles", icon: FileText },
      { title: "الكتب", href: "/admin/books", icon: BookOpen },
      { title: "المرئيات", href: "/admin/videos", icon: Video },
      { title: "المجتمع", href: "/admin/community", icon: Users },
    ],
  },
  {
    title: "إدارة الصفحات",
    items: [
      { title: "عن الشيخ", href: "/admin/about", icon: User },
      { title: "روابط التواصل", href: "/admin/profile", icon: LinkIcon },
      { title: "الصفحة الرئيسية", href: "/admin/hero", icon: Star },
      { title: "الجدول الزمني", href: "/admin/schedule", icon: Calendar },
      { title: "القائمة العلوية", href: "/admin/navbar", icon: Menu },
      { title: "رسائل التواصل", href: "/admin/contact-form", icon: Mail },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      { title: "التصنيفات", href: "/admin/categories", icon: FolderTree },
      { title: "المشتركين", href: "/admin/subscribers", icon: Users },
      { title: "الإشعارات", href: "/admin/notifications", icon: Bell },
      { title: "إعدادات SEO", href: "/admin/seo", icon: Search },
      { title: "الأمان", href: "/admin/security", icon: Shield },
      { title: "النسخ الاحتياطي", href: "/admin/settings", icon: Database },
    ],
  },
]

const mobileItems = [
  { title: "الرئيسية", href: "/admin", icon: LayoutDashboard },
  { title: "الخطب", href: "/admin/khutba", icon: Mic },
  { title: "الدروس", href: "/admin/dars", icon: GraduationCap },
  { title: "المقالات", href: "/admin/articles", icon: FileText },
  { title: "المرئيات", href: "/admin/videos", icon: Video },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 h-full w-64 bg-surface dark:bg-card border-l border-border dark:border-border z-40 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border dark:border-border">
<div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-icons-outlined text-xl">mosque</span>
</div>
          <div>
<h1 className="font-bold text-primary dark:text-white text-sm">لوحة التحكم</h1>
<span className="text-xs text-text-muted dark:text-text-subtext">الشيخ السيد مراد</span>
</div>
        </div>

        {/* Navigation with Sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sidebarSections.map((section, sectionIndex) => (
            <div key={section.title}
className={cn(sectionIndex > 0 && "mt-6")}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-text-muted dark:text-text-subtext uppercase tracking-wider">
                {section.title}
              </h3>
<ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
<Link
                        href={item.href}
className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                          isActive
                            ? "bg-primary text-white"
                            : "text-foreground dark:text-foreground hover:bg-background dark:hover:bg-background-alt",
                        )}
                      >
                        <Icon className="h-5 w-5" />
<span>{item.title}</span>
</Link>
                    </li>
                  )
                })}
              </ul>
</div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border dark:border-border">
<Link
            href="/"
            className="flex items-center gap-2 text-sm text-text-muted dark:text-text-subtext hover:text-primary dark:hover:text-secondary transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
<span>عرض الموقع</span>
</Link>
        </div>
</aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface dark:bg-card border-t border-border dark:border-border z-40 lg:hidden">
<div className="flex items-center justify-around py-2">
          {mobileItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
href={item.href}
className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1",
                  isActive ? "text-primary dark:text-secondary" : "text-text-muted dark:text-text-subtext",
                )}
              >
<Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.title}</span>
</Link>
            )
          })}
          <Link
            href="/admin/settings"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1",
              pathname === "/admin/settings"
                ? "text-primary dark:text-secondary"
                : "text-text-muted dark:text-text-subtext",
            )}
          >
<MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px]">المزيد</span>
</Link>
        </div>
</nav>
    </>
  )
}
