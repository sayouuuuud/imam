"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

interface AdminShellProps {
  children: React.ReactNode
}

const DEVELOPER_EMAIL = "sayedelshazly2006@gmail.com"

export default function AdminShell({ children }: AdminShellProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingAccess, setCheckingAccess] = useState(true)

  const isDeveloperPage = pathname?.startsWith("/admin/developer-sayed")

  useEffect(() => {
    if (loading) return

    if (!user) {
      console.log("[ADMIN] No user, redirecting to login")
      router.push("/login")
      return
    }

    const isDeveloperUser = user.email === DEVELOPER_EMAIL

    if (isDeveloperUser && !isDeveloperPage) {
      console.log("[ADMIN] Developer user, redirecting to developer page")
      router.push("/admin/developer-sayed")
      return
    }

    setCheckingAccess(false)
  }, [user, loading, router, pathname, isDeveloperPage])

  if (isDeveloperPage) {
    return <>{children}</>
  }

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary text-xl">جاري التحميل...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (user.email === DEVELOPER_EMAIL) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 flex flex-col lg:mr-64 w-full min-w-0">
        <AdminHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
