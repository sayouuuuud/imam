"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { BookCoverImage } from "@/components/book-cover-image"
import { ArrowLeft, Download, Eye, PenLine } from "lucide-react"

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

export function FeaturedBooks({ books }: FeaturedBooksProps) {
  const handleDownload = async (bookId: string, currentCount: number) => {
    const supabase = createClient()
    await supabase
      .from("books")
      .update({ download_count: (currentCount || 0) + 1 })
      .eq("id", bookId)
  }

  return (
    <section className="py-16 lg:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-3 inline-block">
              المكتبة العلمية
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight">أحدث المؤلفات</h2>
          </div>

          <Link
            href="/books"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary bg-card px-4 py-2 rounded-lg text-sm border border-border transition-all duration-300 hover:border-primary/40 hover:shadow-md"
          >
            عرض كل المؤلفات
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {/* Books Grid */}
        {books.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">لا توجد كتب حالياً</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {books.map((book) => (
              <article
                key={book.id}
                className="group flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40"
              >
                {/* Cover */}
                <Link href={`/books/${book.id}`} className="block relative aspect-[3/4] overflow-hidden bg-muted">
                  {/* Default cover shown when no image exists or it fails to load */}
                  <img
                    src="/default-book-cover.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {book.cover_image_path && (
                    <BookCoverImage
                      coverImagePath={book.cover_image_path}
                      title={book.title}
                      variant="detail"
                      showFallback={false}
                      className="absolute inset-0 h-full rounded-none shadow-none"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                  <span className="absolute bottom-3 right-3 left-3 text-background text-xs font-bold line-clamp-2 leading-snug drop-shadow">
                    {book.title}
                  </span>
                </Link>

                {/* Info */}
                <div className="flex flex-col flex-1 p-4 lg:p-5">
                  <Link href={`/books/${book.id}`}>
                    <h3 className="font-bold text-base lg:text-lg text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
                      {book.title}
                    </h3>
                  </Link>

                  {book.author && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
                      <PenLine className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{book.author}</span>
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-t border-border/60 flex items-center gap-2">
                    {book.pdf_file_path ? (
                      <a
                        href={`/api/books/${book.id}/pdf?download=1`}
                        download
                        onClick={() => handleDownload(book.id, book.download_count)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Download className="w-3.5 h-3.5" />
                        تحميل
                      </a>
                    ) : (
                      <Link
                        href={`/books/${book.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        عرض
                      </Link>
                    )}
                    <Link
                      href={`/books/${book.id}`}
                      aria-label={`تفاصيل كتاب ${book.title}`}
                      className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
