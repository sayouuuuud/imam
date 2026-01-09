"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/ui/theme-toggle"

// Helper function to resolve preview src
const resolvePreviewSrc = (value: string) => {
  if (!value) return ""
  // External URLs (e.g. YouTube)
  if (/^https?:\/\//i.test(value)) return value
  // Local images (start with / and don't contain uploads/)
  if (value.startsWith('/') && !value.includes('uploads/')) return value
  // Uploaded files (contain uploads/)
  return `/api/download?key=${encodeURIComponent(value)}`
}

const defaultNavLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/schedule", label: "الجدول" },
  { href: "/khutba", label: "خطب" },
  { href: "/dars", label: "دروس" },
  { href: "/articles", label: "مقالات" },
  { href: "/books", label: "كتب" },
  { href: "/videos", label: "مرئيات" },
]

interface NavItem {
  id: string
  label: string
  href: string
  order_index: number
  is_active?: boolean
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [navLinks, setNavLinks] = useState<{ href: string; label: string }[]>(
    defaultNavLinks
  )
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [darkLogoPath, setDarkLogoPath] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchOpen])

  useEffect(() => {
    // Check dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      setIsDarkMode(isDark)
    }
    
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    // Also listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)

    // Listen to logo changes in localStorage
    const handleLogoChange = () => {
      const newLogo = localStorage.getItem('site_logo_path')
      if (newLogo && newLogo !== logoPath) {
        console.log('🎨 Header: Logo updated from localStorage:', newLogo)
        setLogoPath(newLogo)
        setDarkLogoPath(newLogo)
      }
    }

    window.addEventListener('storage', handleLogoChange)
    
    async function loadNavbarAndSettings() {
      const supabase = createClient()
      const { data: navData } = await supabase
        .from("navbar_items")
        .select("*")
        .order("order_index", { ascending: true })
      if (navData && navData.length > 0) {
        // Filter active items in JavaScript if is_active exists
        const activeItems = navData.filter((item: NavItem) => item.is_active !== false)
        if (activeItems.length > 0) {
          setNavLinks(activeItems.map((item: NavItem) => ({
            href: item.href,
            label: item.label
          })))
        }
      }

      console.log('🎨 Header: Attempting to load appearance_settings...')
      const { data: appearanceData, error: appearanceError } = await supabase
        .from("appearance_settings")
        .select("site_logo_path, site_logo_path_dark")
        .limit(1)

      if (appearanceError) {
        console.error('🎨 Header: Error loading appearance_settings:', appearanceError)
      }
      let logoFromDB = null
      let darkLogoFromDB = null

      console.log('🎨 Header: appearanceData result:', appearanceData)
      console.log('🎨 Header: appearanceData length:', appearanceData?.length)

      if (appearanceData?.[0]) {
        console.log('🎨 Header: Loaded logo from appearance_settings:', appearanceData[0])
        logoFromDB = appearanceData[0].site_logo_path || null
        darkLogoFromDB = appearanceData[0].site_logo_path_dark || null
        // Clear localStorage since we have DB data
        localStorage.removeItem('site_logo_path')
      } else {
        console.log('🎨 Header: No appearance_settings data, trying site_settings')
        // Try site_settings as fallback
        try {
          const { data: siteSettings, error: siteError } = await supabase
            .from("site_settings")
            .select("*")
            .eq("key", "site_logo")
            .single()

          if (siteSettings && !siteError) {
            console.log('🎨 Header: Found logo in site_settings:', siteSettings.value)
            logoFromDB = siteSettings.value || null
            darkLogoFromDB = siteSettings.value || null
          } else {
            console.log('🎨 Header: No logo data in site_settings either')
          }
        } catch (siteError) {
          console.log('🎨 Header: Error reading site_settings:', siteError)
        }
      }

      // Check localStorage only if no DB data (for immediate updates during save)
      const logoFromStorage = logoFromDB ? null : localStorage.getItem('site_logo_path')

      // Use DB data as primary, localStorage as fallback for immediate updates
      const finalLogo = logoFromDB || logoFromStorage || '/placeholder-logo.png'
      const finalDarkLogo = darkLogoFromDB || logoFromStorage || '/placeholder-logo.png'

      // TEMPORARY: Force the correct logo for testing
      const correctLogo = 'uploads/logo/1767922036492-xei7zw-Screenshot_2026-01-08_071838-Photoroom.png'
      const resolvedLogo = resolvePreviewSrc(correctLogo)

      console.log('🎨 Header: Using hardcoded logo for testing:', correctLogo)
      console.log('🎨 Header: Resolved logo URL:', resolvedLogo)

      setLogoPath(resolvedLogo)
      setDarkLogoPath(resolvedLogo)
    }
    loadNavbarAndSettings()
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
      window.removeEventListener('storage', handleLogoChange)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  } 
  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 transition-all duration-200 border-b border-border/50",
          scrolled ? "shadow-md border-b border-border" : "shadow-sm",
        )}
      >
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-1">
 <div className="flex justify-between h-16 items-center">
<Link href="/" className="flex items-center group">
          {logoPath && (
            <img 
              src={resolvePreviewSrc(logoPath)} 
              alt="شعار الموقع" 
              className="h-12 object-contain dark:hidden" 
            />
          )}
          {darkLogoPath && (
            <img
              src={resolvePreviewSrc(darkLogoPath)}
              alt="شعار الموقع"
              className="h-12 object-contain hidden dark:block"
            />
          )}
          {!logoPath && !darkLogoPath && (
            <img
              src="/placeholder-logo.png"
              alt="شعار الموقع"
              className="h-12 object-contain w-max"
            />
          )}
        </Link>

 {/* Navigation - Desktop (Center) */} <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
 {navLinks.map((link) => ( <Link key={link.href}
href={link.href}
className={cn( "hover:text-primary transition-colors py-1", pathname === link.href ? "text-primary font-bold border-b-2 border-primary" : "text-foreground", )} >
 {link.label} </Link>

 ))} </nav>

 {/* Actions (Left) */} <div className="flex items-center gap-2">
<button onClick={() =>
  setSearchOpen(true)}
  className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all" aria-label="بحث" > <span className="material-icons-outlined">
search</span>
</button>

 <ThemeToggle />
<Link href="/subscribe" className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg" >
 <span className="material-icons-outlined text-sm">
notifications</span>

 اشترك </Link>

{/* Mobile menu button */} <button className="lg:hidden text-muted-foreground p-2 hover:bg-muted rounded-lg transition-colors" onClick={() =>
  setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"} > <span className="material-icons-outlined">
{mobileMenuOpen ? "close" : "menu"}</span>
</button>

 </div>
</div>

 {/* Mobile Navigation */} {mobileMenuOpen && ( <nav className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
<div className="flex flex-col gap-1">
 {navLinks.map((link) => ( <Link key={link.href}
href={link.href}
onClick = {() =>
 setMobileMenuOpen(false)}
className={cn( "py-3 px-4 rounded-lg hover:bg-muted transition-colors flex items-center gap-3", pathname === link.href ? "text-primary font-bold bg-primary/5" : "text-foreground", )} > {link.label} </Link>

 ))} <Link href="/subscribe" onClick={() =>
 setMobileMenuOpen(false)}
className="mt-2 text-center bg-primary hover:bg-primary-hover text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors" > اشترك الآن </Link>
</div>

 </nav>

 )} </div>
</header>

 {/* Search Modal */} {searchOpen && ( <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-background/80 dark:bg-background/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() =>
 setSearchOpen(false)} > <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl shadow-2xl p-6 border border-border animate-in slide-in-from-top-4 duration-300" onClick={(e) =>
 e.stopPropagation()}
dir = "rtl" > <form onSubmit={handleSearch}
className="flex gap-3">
<input type="text" value={searchQuery}
onChange = {(e) =>
 setSearchQuery(e.target.value)}
placeholder = "ابحث في الخطب، الدروس، المقالات، والكتب..." className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" autoFocus /> <button type="submit" className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 rounded-xl transition-colors flex items-center gap-2" >
<span className="material-icons-outlined">
search</span>
</button>

 </form>
<div className="mt-4 text-sm text-muted-foreground flex items-center justify-between">
  <span>
  اضغط <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
Enter</kbd>
 
  للبحث </span>
  <span>
  اضغط <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
Esc</kbd>
 
  للإغلاق </span>
</div>

 </div>
</div>

 )} </>
 ) }
