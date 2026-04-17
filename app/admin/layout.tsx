import type React from "react"
import type { Metadata } from "next"
import AdminShell from "./admin-shell"

// Belt-and-braces: robots.txt already Disallow /admin/, but we emit
// noindex/nofollow on the HTML too so any admin URL accidentally discovered
// (e.g. leaked in a referer or copied share link) won't be indexed.
export const metadata: Metadata = {
  title: "لوحة التحكم",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
