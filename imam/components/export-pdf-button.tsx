"use client"

 import { useState } from "react" import { Download, Loader2 } from "lucide-react" import { Button } from "@/components/ui/button" interface ExportPDFButtonProps { title: string content: string type: "sermon" | "article" }

export function ExportPDFButton({ title, content, type }: ExportPDFButtonProps) {
 const [loading, setLoading] = useState(false) const handleExport = async () => { setLoading(true) try { // Dynamic import for client-side only const html2pdf = (await
import('html2pdf.js')).default // Clean and prepare content const cleanContent = content .replace(/<[^>
]*>/g, '') // Remove any remaining HTML tags .replace(/\s+/g, ' ') // Normalize whitespace .trim() console.log("PDF Export - Title:", title) console.log("PDF Export - Content length:", cleanContent.length) console.log("PDF Export - Content preview:", cleanContent.substring(0, 100)) // Create HTML content with proper Arabic RTL support const htmlContent = ` <!DOCTYPE html>
<html dir="rtl" lang="ar">
 <head>
<meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
<style>
 body { font-family: 'Arial', 'Helvetica Neue', 'Helvetica', sans-serif;

 direction: rtl;
 text-align: right;
 margin: 20px;
 padding: 0;
 line-height: 1.8;
 background: white;
 color: black;
 font-size: 14px;
 word-wrap: break-word;
 overflow-wrap: break-word;
 } .title { font-size: 24px;
 font-weight: bold;
 color: #1c5b45;
 text-align: center;
 margin-bottom: 25px;
 border-bottom: 3px solid #1c5b45;
 padding-bottom: 15px;
 page-break-after: avoid;
 } .content { font-size: 16px;
 line-height: 2.0;
 margin-top: 20px;
 white-space: pre-wrap;
 word-wrap: break-word;
 text-align: justify;
 page-break-inside: avoid;
 } .footer { margin-top: 50px;
 text-align: center;
 font-size: 12px;
 color: #666;
 border-top: 2px solid #ddd;
 padding-top: 20px;
 page-break-before: always;
 } @media print { body { margin: 15mm;
 } } </style>
</head>

 <body>
<div class="title">
${title || 'خطبة'}</div>
<div class="content">
${cleanContent || 'لا يوجد محتوى متاح لهذه الخطبة'}</div>
<div class="footer">
 <div style="font-weight: bold;
 margin-bottom: 10px;
">
الشيخ السيد مراد</div>
<div>
${type === "sermon" ? "خطبة جمعة" : "مقال"}</div>
</div>

 </body>
</html>

 ` // Create a temporary div element with proper styling const element = document.createElement('div') element.innerHTML = htmlContent element.style.position = 'absolute' element.style.left = '-9999px' element.style.top = '-9999px' element.style.width = '800px' element.style.minHeight = '600px' element.style.backgroundColor = 'white' element.style.color = 'black' element.style.padding = '20px' element.style.fontFamily = 'Arial, Helvetica, sans-serif' element.style.direction = 'rtl' element.style.textAlign = 'right' element.style.fontSize = '14px' element.style.lineHeight = '1.8' element.style.wordWrap = 'break-word' document.body.appendChild(element) console.log("Element HTML length:", element.innerHTML.length) console.log("Element text content:", element.textContent?.substring(0, 200)) console.log("Element children:", element.children.length) // Configure html2pdf options optimized for Arabic const options = { margin: [15, 15, 15, 15] as [number, number, number, number], filename: `${(title || 'خطبة').replace(/[^\w\s\u0600-\u06FF]/g, '').trim()}.pdf`, image: { type: 'jpeg' as const, quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', letterRendering: true, logging: false, // Disable logging for cleaner output width: 800, height: 600 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const, compress: true } } // Generate PDF with better error handling await html2pdf() .set(options) .from(element) .save() console.log("PDF generated successfully with html2pdf") document.body.removeChild(element) } catch (error) { console.error("Error generating PDF:", error) alert("حدث خطأ في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.") } finally { setLoading(false) } } 
  return ( <button onClick={handleExport}
disabled = {loading}
className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-lg text-sm text-text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="تصدير كملف PDF" >
 {loading ? ( <Loader2 className="h-4 w-4 animate-spin" />
 ) : ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d = "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
 </svg>

 )} {loading ? "جاري التصدير..." : "تصدير PDF"} </button>

 ) }

