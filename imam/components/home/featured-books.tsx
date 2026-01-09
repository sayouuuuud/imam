"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { stripHtml } from "@/lib/utils/strip-html"
import { BookCoverImage } from "@/components/book-cover-image"

interface Book {
  id: string
  title: string
  author: string
  description: string
  cover_image_path: string | null
  pdf_file_path: string | null
  download_count: number
}

interface FeaturedBooksProps {
  books: Book[]
}

// Book cover colors for visual variety
const bookColors = [
  { bg: "bg-[#1A3337]", border: "border-l-[#15282B]" },
  { bg: "bg-[#5D4E32]", border: "border-l-[#4A3E28]" },
  { bg: "bg-[#2D4A5E]", border: "border-l-[#1D3A4E]" },
  { bg: "bg-[#4A3728]", border: "border-l-[#3A2718]" },
]

export function FeaturedBooks({ books }: FeaturedBooksProps) {
  const handleDownload = async (bookId: string, currentCount: number) => {
    const supabase = createClient()
    await supabase
      .from("books")
      .update({ download_count: currentCount + 1 })
      .eq("id", bookId)
  }

const getExcerpt = (description: string | null, maxLength = 100) => {
    if (!description) {
      return ""
    }

const plainText = stripHtml(description)
    if (plainText.length <= maxLength) {
      return plainText
    }
    return plainText.substring(0, maxLength) + "..."
  } 
  return ( <section className="py-16 bg-surface">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 {/* Header */} <div className="flex justify-between items-end mb-12">
<div>
 <span className="text-xs font-bold text-primary bg-green-50 px-3 py-1 rounded-full mb-3 inline-block">
 المكتبة العلمية </span>
<h2 className="text-4xl font-bold font-serif text-foreground">
مؤلفات الشيخ المختارة</h2>
</div>

 <Link href="/books" className="hidden sm:flex items-center gap-2 text-text-muted hover:text-primary transition bg-background px-4 py-2 rounded-lg text-sm" >
 عرض كل المؤلفات <span className="material-icons-outlined text-sm rtl-flip">
arrow_right_alt</span>
</Link>

 </div>

 {/* Books Grid */} {books.length === 0 ? ( <p className="text-text-muted text-center py-12">
لا توجد كتب حالياً</p>

 ) : ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
 {books.map((book, index) => { const colors = bookColors[index % bookColors.length] 
  return ( <div key={book.id}
className="group">
 {/* Book Cover - Clickable to detail page */} <Link href={`/books/${book.id}`}>
<div className="relative bg-background p-6 rounded-t-2xl flex justify-center items-center h-80 transition group-hover:bg-background-alt cursor-pointer">
 {book.cover_image_path ? ( <BookCoverImage coverImagePath={book.cover_image_path}
title = {book.title}
variant = "admin" className="w-40 h-60 shadow-2xl" />
 ) : ( <div className={`w-40 h-60 ${colors.bg} shadow-2xl relative rounded-sm flex flex-col items-center justify-center text-center p-4 border-l-4 ${colors.border}`} >
<div className="border border-secondary absolute inset-2 opacity-50">
</div>
<span className="text-[8px] text-secondary mb-4">
كتاب</span>
<h4 className="text-white font-serif text-xl mb-1">
{book.title}</h4>
<span className="text-[8px] text-gray-400">
{book.author}</span>
</div>

 )} </div>
</Link>

 {/* Book Info */} <div className="bg-background p-6 rounded-b-2xl border-t border-border">
<Link href={`/books/${book.id}`}>
 <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition cursor-pointer">
 {book.title} </h3>
</Link>

 <p className="text-xs text-text-muted mb-4 line-clamp-2">
 {getExcerpt(book.description)} </p>
<div className="flex items-center justify-between">
 {book.pdf_file_path ? ( <a href={`/api/books/${book.id}/pdf?download=1`} download onClick={() =>
 handleDownload(book.id, book.download_count)}
className="text-primary text-sm flex items-center gap-1 font-medium hover:underline" > <span className="material-icons-outlined text-sm">
download</span>

 تحميل </a>

 ) : ( <Link href={`/books/${book.id}`}
className="text-primary text-sm flex items-center gap-1 font-medium hover:underline" >
<span className="material-icons-outlined text-sm">
visibility</span>

 عرض </Link>

 )} </div>
</div>

 </div>

 ) })} </div>

 )} </div>
</section>

 ) }
