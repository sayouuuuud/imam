"use client"

import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import { ShareButtons } from "@/components/share-buttons"
import { BookCoverImage } from "@/components/book-cover-image"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function BookDetailPage({ params }: PageProps) {
  const [bookData, setBookData] = useState<any>(null)
  const [relatedBooksData, setRelatedBooksData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBook = async () => {
      try {
        const { id } = await params
        const supabase = createPublicClient()

        // Fetch book details
        const { data: book, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .eq("publish_status", "published")
          .single()

        if (error || !book) {
          notFound()
          return
        }

        // Increment views count
        await supabase
          .from("books")
          .update({ views: (book.views || 0) + 1 })
          .eq("id", id)

        // Fetch related books
        const { data: relatedBooks } = await supabase
          .from("books")
          .select("id, title, author, cover_image_path, created_at, views")
          .eq("publish_status", "published")
          .neq("id", id)
          .limit(4)
          .order("created_at", { ascending: false })

        setBookData(book)
        setRelatedBooksData(relatedBooks || [])
        setLoading(false)
      } catch (error) {
        console.error("Error loading book:", error)
        notFound()
      }
    }

    loadBook()
  }, [params])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
    })
  }

  const getCoverImageUrl = (book: any) => {
    if (book.cover_image_path?.startsWith("uploads/")) {
      return `/api/download?key=${encodeURIComponent(book.cover_image_path)}`
    }
    return book.cover_image_path || book.cover_image
  }

  const getPdfUrl = (book: any) => {
    if (book.pdf_file_path?.startsWith("uploads/")) {
      return `/api/download?key=${encodeURIComponent(book.pdf_file_path)}`
    }
    return book.file_url || book.pdf_file_path
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">جاري تحميل الكتاب...</p>
        </div>
      </div>
    )
  }

  if (!bookData) {
    notFound()
    return null
  }

  const book = bookData
  const coverImageUrl = getCoverImageUrl(book)
  const pdfUrl = getPdfUrl(book)

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex text-sm text-text-muted mb-8">
        <ol className="inline-flex items-center space-x-reverse space-x-2">
          <li className="inline-flex items-center">
            <Link
              className="inline-flex items-center hover:text-primary"
              href="/"
            >
              <span className="material-icons-outlined text-base ml-1">home</span>
              الرئيسية
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="material-icons-outlined text-base mx-2 text-gray-400">
                chevron_left
              </span>
              <Link className="hover:text-primary" href="/books">
                الكتب
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <span className="material-icons-outlined text-base mx-2 text-gray-400">
                chevron_left
              </span>
              <span className="text-primary font-medium">{book.title}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Book Detail Section */}
      <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden mb-16 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0 pointer-events-none"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 md:p-10 relative z-10">
          {/* Book Cover */}
          <div className="lg:col-span-4 flex justify-center lg:justify-start">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
              <BookCoverImage
                coverImagePath={coverImageUrl}
                title={book.title}
                variant="detail"
                className="relative w-full max-w-[300px] lg:max-w-full rounded-lg shadow-2xl transform group-hover:-translate-y-2 transition duration-500 object-cover aspect-[2/3]"
              />
              {book.publish_year === new Date().getFullYear().toString() && (
                <div className="absolute top-4 right-4 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  جديد
                </div>
              )}
            </div>
          </div>

          {/* Book Info */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            <div className="mb-2 flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded border border-primary/20">
                كتب ومراجع
              </span>
              {book.publish_year && (
                <span className="text-text-muted text-xs flex items-center gap-1">
                  <span className="material-icons-outlined text-[14px]">
                    calendar_today
                  </span>
                  {book.publish_year} هـ
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 leading-tight">
              {book.title}
            </h1>

            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <span className="material-icons-outlined text-gray-400">
                  person
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-text-muted">المؤلف</span>
                <span className="text-sm font-semibold text-primary">
                  بقلم: {book.author || "الشيخ السيد مراد سلامة"}
                </span>
              </div>
            </div>

            {book.description && (
              <div className="mb-8 prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-bold text-foreground mb-2 border-b-2 border-primary/20 pb-2 inline-block">
                  نبذة عن الكتاب
                </h3>
                <p className="text-text-muted leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[160px] bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-icons-outlined">file_download</span>
                  تحميل الكتاب (PDF)
                </a>
              )}
              <button className="flex-1 min-w-[160px] bg-surface border-2 border-border hover:border-primary text-foreground hover:text-primary px-6 py-3.5 rounded-xl font-bold transition transform active:scale-95 flex items-center justify-center gap-2">
                <span className="material-icons-outlined">menu_book</span>
                قراءة الكتاب
              </button>
            </div>

            {/* Share Section */}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <span className="text-sm font-medium text-text-muted">
                مشاركة الكتاب:
              </span>
              <div className="flex gap-2">
                <a
                  className="w-9 h-9 rounded-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition duration-300"
                  href="#"
                >
                  <span className="material-icons-outlined text-lg">chat</span>
                </a>
                <a
                  className="w-9 h-9 rounded-full bg-[#0088cc]/10 hover:bg-[#0088cc] text-[#0088cc] hover:text-white flex items-center justify-center transition duration-300"
                  href="#"
                >
                  <span className="material-icons-outlined text-lg">send</span>
                </a>
                <a
                  className="w-9 h-9 rounded-full bg-black/5 hover:bg-black text-black hover:text-white flex items-center justify-center transition duration-300"
                  href="#"
                >
                  <span className="font-bold text-sm">X</span>
                </a>
                <a
                  className="w-9 h-9 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white flex items-center justify-center transition duration-300"
                  href="#"
                >
                  <span className="material-icons-outlined text-lg">facebook</span>
                </a>
                <button className="w-9 h-9 rounded-full bg-muted hover:bg-muted-hover text-text-muted flex items-center justify-center transition duration-300">
                  <span className="material-icons-outlined text-lg">link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Books Section */}
      {relatedBooksData && relatedBooksData.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground relative pr-4">
              <span className="absolute top-1 right-0 w-1 h-8 bg-secondary rounded-full"></span>
              كتب ذات صلة
            </h2>
            <Link
              className="text-primary hover:text-secondary font-medium text-sm flex items-center gap-1 transition"
              href="/books"
            >
              عرض المزيد
              <span className="material-icons-outlined text-sm">arrow_back</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedBooksData.map((relatedBook) => (
              <Link
                key={relatedBook.id}
                href={`/books/${relatedBook.id}`}
                className="group bg-surface rounded-xl border border-border p-4 hover:shadow-xl hover:shadow-primary/5 transition duration-300 flex flex-col items-center text-center"
              >
                <BookCoverImage
                  coverImagePath={
                    relatedBook.cover_image_path?.startsWith("uploads/")
                      ? `/api/download?key=${encodeURIComponent(
                          relatedBook.cover_image_path
                        )}`
                      : relatedBook.cover_image_path || ""
                  }
                  title={relatedBook.title}
                  variant="card"
                  className="w-full h-64 rounded-lg mb-4 overflow-hidden relative shadow-md group-hover:shadow-lg transition"
                />
                <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition">
                  {relatedBook.title}
                </h3>
                <p className="text-sm text-text-muted">
                  {relatedBook.author || "الشيخ السيد مراد سلامة"}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                  <span className="flex items-center gap-1">
                    <span className="material-icons-outlined text-[12px]">
                      visibility
                    </span>
                    {relatedBook.views || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}