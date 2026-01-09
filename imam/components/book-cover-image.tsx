"use client"

import { useSignedUrl } from "@/hooks/use-signed-url"

interface BookCoverImageProps {
  coverImagePath?: string
  title: string
  variant?: "detail" | "card" | "admin"
  colors?: {
    bg: string
    border: string
  }
  className?: string
  hoverEffect?: boolean
}

export function BookCoverImage({
  coverImagePath,
  title,
  variant = "detail",
  colors,
  className="",
  hoverEffect = false
}: BookCoverImageProps) {
  const { signedUrl, loading } = useSignedUrl(coverImagePath || null)

  const getContainerClasses = () => {
    switch (variant) {
      case "detail":
        return `w-full aspect-video ${colors?.bg || ""} rounded-lg shadow-2xl overflow-hidden ${className}`
      case "card":
        return `relative aspect-video rounded-t-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 ${className}`
      case "admin":
        return `rounded-lg overflow-hidden ${className}`
      default:
        return className
    }
  }

const getImageClasses = () => {
    switch (variant) {
      case "detail":
        return "w-full h-full object-cover"
      case "card":
        return `w-full h-full object-contain ${hoverEffect ? "group-hover:scale-105 transition-transform duration-500" : ""}`
      case "admin":
        return "w-full h-full object-contain rounded-lg"
      default:
        return "w-full h-full object-cover"
    }
  }

const getFallbackContent = () => {
    switch (variant) {
      case "detail":
        return (
          <div className="w-full h-full flex flex-col justify-center items-center p-8 border-2 border-secondary/30 m-4 rounded-sm">
<span className="text-secondary text-sm mb-3">كتاب</span>
<h3 className="text-white text-2xl font-bold leading-tight mb-4 font-serif text-center">
              {title}
            </h3>
</div>
        )
      case "card":
        return (
          <div className="w-full h-full flex items-center justify-center">
<svg
              className="h-12 w-12 text-primary/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
d = "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
</svg>
</div>
        )
      case "admin":
        return (
          <div className="w-12 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
<svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
d = "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
</svg>
</div>
        )
      default:
        return null
    }
  }

  // Show loading state only when fetching new signed URL, not when using existing URL
  if (loading && coverImagePath && !coverImagePath.startsWith("http")) {
    return (
      <div className={getContainerClasses()}>
<div className="w-full h-full flex items-center justify-center bg-muted animate-pulse rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary">
</div>
</div>
</div>
    )
  }

  return (
    <div className={getContainerClasses()}>
      {signedUrl ? (
        <img
          src={signedUrl}
          alt={title}
          className={getImageClasses()}
        />
      ) : (
        getFallbackContent()
      )}
    </div>
  )
}
