"use client"

 import { useSignedUrl } from "@/hooks/use-signed-url"
import { LoadingSpinner } from "./loading-spinner" interface PDFViewerProps { fileKey: string title: string className?: string }

export function PDFViewer({ fileKey, title, className="" }: PDFViewerProps) {
 const { signedUrl, loading, error } = useSignedUrl(fileKey) if (loading) { 
  return ( <div className={`flex items-center justify-center h-full ${className}`}>
<LoadingSpinner />
 </div>

 ) } if (error || !signedUrl) { 
  return ( <div className={`flex items-center justify-center h-full ${className}`}>
<div className="text-center text-red-600">
 <p>
فشل في تحميل الملف</p>
<p className="text-sm mt-1">
{error}</p>
</div>

 </div>

 ) } 
  return ( <iframe src={`${signedUrl}#toolbar=1&navpanes=1&scrollbar=1`}
className={`w-full h-full rounded-lg border border-border ${className}`}
title = {title}
style = {{ minHeight: "500px" }} />
 ) }
