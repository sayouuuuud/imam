"use client"

import { useSignedUrl } from "@/hooks/use-signed-url"
import { useState, useEffect, useLayoutEffect } from "react"
import { Loader2 } from "lucide-react"

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
        return `w-full ${colors?.bg || ""} rounded-lg shadow-2xl overflow-hidden ${className}`
      case "card":
        return `relative w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 rounded-t-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 ${className}`
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
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4" suppressHydrationWarning>
        <div className="text-center">
          <p className="text-xs text-primary/70 font-medium line-clamp-2 px-2">
            كتاب إسلامي
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
        {getFallbackContent()}
      </div>
    )
  }

  return (
    <div className={getContainerClasses()} suppressHydrationWarning>
      {signedUrl ? (
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
            onError={(e) => {
              console.error('❌ Image failed to load:', signedUrl, 'for book:', title, 'original path:', coverImagePath)
              // Hide the broken image and show fallback
              const img = e.target as HTMLImageElement
              img.style.display = 'none'
              const container = img.parentElement
              if (container) {
                const fallback = container.querySelector('.image-fallback')
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'block'
                }
              }
            }}
          />

          {/* Always render fallback but hide it when image loads */}
          <div className="image-fallback" style={{ display: loading ? 'none' : 'block' }} suppressHydrationWarning>
            {getFallbackContent()}
          </div>
        </>
      ) : (
        /* Show fallback when no signed URL */
        <div className="image-fallback" style={{ display: 'block' }} suppressHydrationWarning>
          {getFallbackContent()}
        </div>
      )}
    </div>
  )
}
