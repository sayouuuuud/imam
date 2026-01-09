"use client"

 interface PrintButtonProps { title: string content: string }

export function PrintButton({ title, content }: PrintButtonProps) {
 const handlePrint = () => { // Create a new window for printing const printWindow = window.open("", "_blank") if (!printWindow) 
  return // Create print-friendly HTML printWindow.document.write(` <!DOCTYPE html>
<html dir="rtl" lang="ar">
 <head>
<meta charset="UTF-8">
 <title>
${title}</title>
<style>
 @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;
700&display=swap');
 * { margin: 0;
 padding: 0;
 box-sizing: border-box;
 } body { font-family: 'Amiri', serif;
 line-height: 2;
 padding: 40px;
 max-width: 800px;
 margin: 0 auto;
 color: #1a1a1a;
 direction: rtl;
 } h1 { font-size: 28px;
 margin-bottom: 20px;
 color: #0d5c46;
 border-bottom: 2px solid #0d5c46;
 padding-bottom: 15px;
 } .meta { font-size: 14px;
 color: #666;
 margin-bottom: 30px;
 } .content { font-size: 18px;
 text-align: justify;
 white-space: pre-wrap;
 } .footer { margin-top: 40px;
 padding-top: 20px;
 border-top: 1px solid #ddd;
 font-size: 12px;
 color: #999;
 text-align: center;
 } @media print { body { padding: 20px;
 } } </style>
</head>

 <body>
<h1>
${title}</h1>
<div class="meta">
 تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", })} </div>
<div class="content">
${content}</div>
<div class="footer">
 موقع الشيخ السيد مراد - جميع الحقوق محفوظة </div>
</body>

 </html>

 `) printWindow.document.close() printWindow.focus() // Wait for content to load then print setTimeout(() => { printWindow.print() printWindow.close() }, 250) } 
  return ( <button onClick={handlePrint}
className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-lg text-sm text-text-muted hover:text-primary hover:border-primary transition-colors" title="طباعة" >
<span className="material-icons-outlined text-lg">
print</span>

 طباعة </button>

 ) }

