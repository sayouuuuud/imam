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
  const [imgLoaded, setImgLoaded] = useState(false)

  // reset الخطأ لو اتغير الـ URL
  useEffect(() => {
    setImgError(false)
    setImgLoaded(false)
  }, [signedUrl])

  // Timer-based fallback: في بعض المتصفحات الداخلية (زي فيسبوك webview)
  // الـ onError event مبيطلقش لما تحميل الصورة يفشل بسبب CORS أو block.
  // لو فات 8 ثواني ومحملتش الصورة، نعتبرها فشلت ونعرض الـ fallback.
  useEffect(() => {
    if (!signedUrl || imgLoaded || imgError) return

    const timer = setTimeout(() => {
      if (!imgLoaded) {
        console.warn('Image load timeout, showing fallback:', title)
        setImgError(true)
      }
    }, 8000)

    return () => clearTimeout(timer)
  }, [signedUrl, imgLoaded, imgError, title])

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

  // في المتصفحات الداخلية (فيسبوك/انستجرام)، الصور الخارجية غالباً بتتحجب
  // بسبب CORS أو referrer policy. الحل: نعرض الـ fallback دائماً،
  // ونحمّل الصورة في الخلفية - لو نجحت تظهر فوق الـ fallback.
  const hasValidUrl = signedUrl && signedUrl.trim() !== ''
  const showImage = hasValidUrl && !imgError && imgLoaded

  return (
    <div className={getContainerClasses()} suppressHydrationWarning style={{ position: 'relative' }}>
      {/* الـ fallback يظهر دائماً كخلفية */}
      {showFallback && (
        <div style={{ 
          position: showImage ? 'absolute' : 'relative',
          inset: 0,
          opacity: showImage ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}>
          {getFallbackContent()}
        </div>
      )}
      
      {/* الصورة الحقيقية - تحمّل في الخلفية وتظهر فوق الـ fallback لو نجحت */}
      {hasValidUrl && !imgError && (
        <img
          src={signedUrl}
          alt={title}
          className={getImageClasses()}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          loading="lazy"
          decoding="async"
          style={{
            position: showFallback ? 'absolute' : 'relative',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}
    </div>
  )
}
