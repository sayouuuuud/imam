"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log("[ADMIN] No user, redirecting to login")
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
<div className="text-primary text-xl">جاري التحميل...</div>
</div>
    )
  }
if (!user) {
    return null
  }
return (
    <div className="min-h-screen bg-background flex" dir="rtl">
<AdminSidebar />
      <div className="flex-1 flex flex-col lg:mr-64">
<AdminHeader user={user} />
        <main className="flex-1 p-6 pb-20 lg:pb-6">{children}</main>
</div>
    </div>
  )
}

