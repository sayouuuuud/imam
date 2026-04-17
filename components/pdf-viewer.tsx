"use client"

import { useState, useEffect, useRef } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { LoadingSpinner } from "./loading-spinner"
import { Button } from "./ui/button"
import { useSignedUrl } from "@/hooks/use-signed-url"
import { ZoomIn, ZoomOut, RotateCcw, Download, ExternalLink } from "lucide-react"


// Use local static worker from public folder to ensure Same-Origin (fixes Brave Android)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface PDFViewerProps {
  fileKey: string // Can be a raw URL or a key
  title: string
  className?: string
  bookId?: string
}

/**
 * Detect environments where pdf.js is likely to fail:
 *   - Facebook / Instagram / Messenger / TikTok in-app WebViews
 *     (they often block web workers or ship very old Chromium)
 *   - Very old Android WebView versions
 */
function detectProblematicBrowser(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  const inAppPatterns = [
    /FBA[NV]/i,          // Facebook app
    /Instagram/i,
    /Messenger/i,
    /Line\//i,
    /Twitter/i,
    /TikTok/i, /Bytedance/i,
    /MicroMessenger/i,   // WeChat
    /LinkedInApp/i,
    /Snapchat/i,
    /\bWebView\b/i,
    /; wv\)/i,           // Android WebView marker
  ]
  return inAppPatterns.some((re) => re.test(ua))
}

export function PDFViewer({ fileKey, title, className = "", bookId }: PDFViewerProps) {
  const isUrl = fileKey.startsWith("http") || fileKey.startsWith("/api") || fileKey.startsWith("split:")
  const { signedUrl: hookSignedUrl, loading: hookLoading, error: hookError } = useSignedUrl(!isUrl ? fileKey : "")

  // Determine the final URL to use
  let finalUrl = ""

  if (fileKey.startsWith("split:") || fileKey.startsWith("manifest:")) {
    // Handle split/manifest files via proxy
    finalUrl = `/api/download-pdf?url=${encodeURIComponent(fileKey)}&inline=true`
  } else if (isUrl) {
    // If it is a local API endpoint (starts with /), append inline=true to bypass CORS via proxy
    if (fileKey.startsWith("/") && !fileKey.includes("inline=true")) {
      finalUrl = `${fileKey}${fileKey.includes('?') ? '&' : '?'}inline=true`
    } else if (fileKey.startsWith("http")) {
      // External URL — go direct for UploadThing/R2 to enable Range requests,
      // proxy everything else to dodge CORS / referer tracking.
      if (fileKey.includes('utfs.io') || fileKey.includes('uploadthing') || fileKey.includes('r2.dev')) {
        finalUrl = fileKey
      } else {
        finalUrl = `/api/download-pdf?url=${encodeURIComponent(fileKey)}&inline=true`
      }
    } else {
      finalUrl = fileKey
    }
  } else {
    finalUrl = hookSignedUrl || ""
  }

  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState<number>(1.0)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pdfError, setPdfError] = useState<Error | null>(null)
  // When `useNativeFallback` is true we skip pdf.js entirely and rely on the
  // browser's built-in PDF handling (iframe / object / download link).
  const [useNativeFallback, setUseNativeFallback] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Decide up-front whether we should even try pdf.js. In-app browsers often
  // can't spin up the worker, which causes pdf.js to hang forever — worse UX
  // than just showing a native fallback right away.
  useEffect(() => {
    if (detectProblematicBrowser()) {
      setUseNativeFallback(true)
    }
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  // Handle resize for responsive page width
  useEffect(() => {
    if (!containerRef.current) return
    if (useNativeFallback) return

    // ResizeObserver is supported in every browser that can actually run
    // pdf.js, but guard anyway in case a very old WebView slipped through.
    if (typeof ResizeObserver === "undefined") return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width)
        }
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [useNativeFallback])

  // Track current page based on scroll position (with debounce for performance)
  useEffect(() => {
    const container = containerRef.current
    if (!container || numPages === 0 || useNativeFallback) return

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const containerHeight = container.clientHeight
        const pageElements = container.querySelectorAll('[data-page]')
        for (const el of pageElements) {
          const rect = el.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          const relativeTop = rect.top - containerRect.top
          if (relativeTop >= -rect.height / 2 && relativeTop <= containerHeight / 2) {
            const pageNum = parseInt(el.getAttribute('data-page') || '1', 10)
            setCurrentPage(pageNum)
            break
          }
        }
      }, 100)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [numPages, useNativeFallback])

  // Auto-scale on mobile/desktop based on container width
  const effectiveWidth = containerWidth > 0 ? containerWidth - 32 : 300

  function onDocumentLoadError(error: Error) {
    console.error('[PDFViewer] pdf.js load error, falling back to native viewer:', error)
    setPdfError(error)
    // Auto-fall back: don't leave user stuck on an error screen when a native
    // iframe could very well render the same PDF just fine.
    setUseNativeFallback(true)
  }

  // ========== LOADING / ERROR states for the signed URL resolution ==========
  if ((!isUrl && hookLoading)) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/10 rounded-lg">
        <LoadingSpinner />
      </div>
    )
  }

  if ((!isUrl && hookError)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-600 rounded-lg p-4 text-center">
        <p className="font-bold mb-2">فشل تحميل رابط الملف</p>
        <p className="text-sm mb-4">{hookError}</p>
      </div>
    )
  }

  // ========== NATIVE FALLBACK (in-app browsers / pdf.js failed) ==========
  // We use <object> with an <iframe> fallback which covers:
  //   - Desktop browsers with native PDF handlers
  //   - iOS Safari (inline PDFs)
  //   - Android Chrome (inline PDFs)
  //   - Other WebViews that at least support iframe navigation to a PDF
  // If nothing renders, the inner <div> with the download links shows through.
  if (useNativeFallback && finalUrl) {
    return (
      <div className={`flex flex-col h-full bg-muted ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-card border-b border-border shadow-sm z-10 sticky top-0">
          <span className="text-sm font-medium truncate max-w-[60%]">{title}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(finalUrl, '_blank', 'noopener,noreferrer')}
              title="فتح في نافذة جديدة"
            >
              <ExternalLink className="h-4 w-4 ml-1" />
              <span className="text-xs">فتح</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              title="تحميل الملف"
            >
              <a
                href={bookId ? `/api/download-pdf?url=${encodeURIComponent(fileKey)}&id=${bookId}` : finalUrl}
                download={`${title || 'book'}.pdf`}
              >
                <Download className="h-4 w-4 ml-1" />
                <span className="text-xs">تحميل</span>
              </a>
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-muted relative overflow-hidden">
          {/* <object> lets the browser use its native PDF engine when possible.
              The inner <iframe>+message is the cascading fallback. */}
          <object
            data={finalUrl}
            type="application/pdf"
            className="w-full h-full"
            aria-label={title}
          >
            <iframe
              src={finalUrl}
              title={title}
              className="w-full h-full border-0"
              loading="lazy"
            >
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <p className="text-foreground font-medium mb-2">
                  المتصفح الحالي لا يدعم عرض ملفات PDF داخل الصفحة.
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  يمكنك تحميل الملف وقراءته على جهازك.
                </p>
                <a
                  href={finalUrl}
                  download={`${title || 'book'}.pdf`}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg font-medium"
                >
                  <Download className="h-4 w-4" />
                  تحميل الملف
                </a>
              </div>
            </iframe>
          </object>
        </div>
      </div>
    )
  }

  // ========== Hard pdf.js error (kept for completeness — normally
  // onDocumentLoadError flips us into the native fallback above) ==========
  if (pdfError && !useNativeFallback) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-600 rounded-lg p-4 text-center">
        <p className="font-bold mb-2">حدث خطأ أثناء عرض الملف</p>
        <p className="text-sm mb-4 ltr" dir="ltr">{pdfError.message}</p>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            variant="outline"
            onClick={() => { setPdfError(null); setUseNativeFallback(true); }}
          >
            استخدام العارض البديل
          </Button>
          <Button
            variant="outline"
            onClick={() => { setPdfError(null); window.location.reload(); }}
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-muted ${className}`}>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-card border-b border-border shadow-sm z-10 sticky top-0">

        {/* Page Info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">عدد الصفحات: {numPages}</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            title="تصغير"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale(s => Math.min(3, s + 0.1))}
            title="تكبير"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setScale(1); }}
            title="إعادة تعيين الحجم"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center p-4 bg-muted/50"
        style={{ direction: 'ltr' }}
      >
        <Document
          file={finalUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-10 h-full">
              <LoadingSpinner />
              <span className="mr-2">جاري تحميل المستند...</span>
            </div>
          }
          className="flex flex-col items-center pb-20 w-full"
        >
          {numPages > 0 && Array.from(new Array(numPages), (_, index) => (
            <LazyPDFPage
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={effectiveWidth * scale}
              currentPage={currentPage}
            />
          ))}

        </Document>
      </div>
    </div>
  )
}

// Helper component for lazy loading with a 3-page window (optimized for bandwidth)
function LazyPDFPage({
  pageNumber,
  width,
  currentPage
}: {
  pageNumber: number
  width: number
  currentPage: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Load page if: within 1 page of current OR first page only (preload)
  // Reduced from ±2 to ±1 for bandwidth savings (~40% less data loaded while scrolling)
  const isInWindow = Math.abs(pageNumber - currentPage) <= 1 || pageNumber === 1

  return (
    <div
      ref={ref}
      data-page={pageNumber}
      className="bg-white shadow-lg mb-8 relative transition-all duration-200"
      style={{
        minHeight: width * 1.4, // Approximation to reserve space
        width: width
      }}
    >
      {isInWindow ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="bg-white"
          loading={
            <div className="flex flex-col items-center justify-center animate-pulse text-gray-300 bg-white" style={{ height: width * 1.414, width: '100%' }}>
              <LoadingSpinner size="lg" />
              <span className="mt-4 text-sm">جاري تحميل الصفحة {pageNumber}...</span>
            </div>
          }
        />
      ) : (
        <div style={{ height: width * 1.414, width: '100%' }} className="bg-gray-50 flex flex-col items-center justify-center text-gray-300 border border-dashed border-gray-200">
          <span className="text-sm font-medium">صفحة {pageNumber}</span>
        </div>
      )}
    </div>
  )
}
