"use client"

import { useSignedUrl } from "@/hooks/use-signed-url"
import { useState, useEffect } from "react"

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
  showFallback?: boolean
}

export function BookCoverImage({
  coverImagePath,
  title,
  variant = "detail",
  colors,
  className = "",
  hoverEffect = false,
  showFallback = true
}: BookCoverImageProps) {
  const { signedUrl, loading } = useSignedUrl(coverImagePath || null)
  // استخدام state للـ error بدل DOM manipulation عشان يبقى React-friendly
  // ويشتغل صح في المتصفحات الداخلية اللي فيها querySelector ممكن يتأخر
  // أو onError يتنفذ قبل ما الـ fallback div يكون في الـ DOM.
  const [imgError, setImgError] = useState(false)

  // reset الخطأ لو اتغير الـ URL
  useEffect(() => {
    setImgError(false)
  }, [signedUrl])

  const getContainerClasses = () => {
    switch (variant) {
      case "detail":
        return `w-full ${colors?.bg || ""} rounded-lg shadow-2xl overflow-hidden ${className}`
      case "card":
        return `relative w-full rounded-t-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 ${className}`
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
        return `w-full h-auto object-cover ${hoverEffect ? "group-hover:scale-105 transition-transform duration-500" : ""}`
      case "admin":
        return "w-full h-auto object-contain rounded-lg"
      default:
        return "w-full h-auto object-cover"
    }
  }

  const getFallbackContent = () => {
    // حجم مختلف حسب نوع العرض
    const iconSize = variant === 'detail' ? 'w-24 h-24' : variant === 'card' ? 'w-16 h-16' : 'w-12 h-12'
    const svgSize = variant === 'detail' ? 'w-14 h-14' : variant === 'card' ? 'w-8 h-8' : 'w-6 h-6'
    const textSize = variant === 'detail' ? 'text-lg' : 'text-sm'

    return (
      <div className="w-full h-full min-h-[200px] aspect-[2/3] flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border-2 border-dashed border-primary/20" suppressHydrationWarning>
        <div className="text-center p-4">
          <div className={`${iconSize} rounded-2xl bg-primary/20 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4`}>
            <svg className={`${svgSize} text-primary/60 dark:text-zinc-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <p className={`${textSize} text-primary/50 dark:text-zinc-300 font-medium max-w-[180px] line-clamp-2`}>
            {title}
          </p>
        </div>
      </div>
    )
  }

  // Show loading state only when fetching new signed URL, not when using existing URL
  if (loading && coverImagePath && !coverImagePath.startsWith("http")) {
    return (
      <div className={getContainerClasses()}>
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-primary/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto mb-3"></div>
            <p className="text-xs text-primary/70 font-medium">جاري التحميل...</p>
          </div>
        </div>
      </div>
    )
  }

  // If no cover image path is provided, show a nice placeholder
  if (!coverImagePath) {
    return (
      <div className={getContainerClasses()}>
        {showFallback && getFallbackContent()}
      </div>
    )
  }

  // الحالة اللي فيها نعرض صورة فعلية: عندنا URL شغّال ومفيش error
  const shouldShowImage = signedUrl && signedUrl.trim() !== '' && !imgError

  return (
    <div className={getContainerClasses()} suppressHydrationWarning>
      {shouldShowImage ? (
        <>
          {/* Show loading state when fetching signed URL */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-primary/10 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent mx-auto mb-3"></div>
                <p className="text-xs text-primary/70 font-medium">جاري التحميل...</p>
              </div>
            </div>
          )}

          <img
            src={signedUrl}
            alt={title}
            className={getImageClasses()}
            // referrerPolicy="no-referrer" بيساعد الصور تتحمل في المتصفحات
            // الداخلية (زي فيسبوك) اللي بتحجب الطلبات بسبب سياسات الـ referrer.
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={() => {
              console.warn('Image failed to load:', title)
              // نستخدم React state بدل DOM manipulation عشان يكون
              // الـ fallback مضمون يظهر في كل المتصفحات.
              setImgError(true)
            }}
          />
        </>
      ) : (
        /* عرض الـ fallback لو مفيش URL أو حصل خطأ في تحميل الصورة */
        showFallback && getFallbackContent()
      )}
    </div>
  )
}
