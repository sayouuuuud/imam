import type { Metadata } from "next"
import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen, Search, ChevronRight, ChevronLeft, FileText, Eye } from "lucide-react"
import { BookCoverImage } from "@/components/book-cover-image"

export const metadata: Metadata = {
  title: "الكتب والمؤلفات",
  description: "مجموعة مختارة من مؤلفات الشيخ السيد مراد في الفقه والعقيدة والسيرة النبوية متاحة للقراءة والتحميل",
  keywords: ["كتب إسلامية", "مؤلفات", "فقه", "عقيدة", "تحميل كتب"],
  openGraph: {
    title: "الكتب والمؤلفات",
    description: "مؤلفات الشيخ السيد مراد المتخصصة في العلوم الشرعية",
    type: "website",
  },
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    category?: string
    search?: string
  }>
}) {
  const params = await searchParams
  const supabase = createPublicClient()
  const currentPage = Number(params.page) || 1
  const itemsPerPage = 12
  const offset = (currentPage - 1) * itemsPerPage

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("type", "book")
    .order("name", { ascending: true })

  // Helper function to get cover image URL
  const getCoverImageUrl = (book: any) => {
    console.log('📚 [BOOKS PAGE] getCoverImageUrl Input:', {
      bookId: book.id,
      cover_image_path: book.cover_image_path,
      startsWithUploads: book.cover_image_path?.startsWith("uploads/"),
      startsWithHttp: book.cover_image_path?.startsWith("http"),
      startsWithApi: book.cover_image_path?.startsWith("/api/")
    })

    // If it's a malformed URL containing API path, extract the real key
    if (book.cover_image_path?.includes('/api/download?key=')) {
      console.log('🔧 Found malformed API URL, extracting key...')
      try {
        const url = new URL(book.cover_image_path, 'http://localhost:3000')
        const encodedKey = url.searchParams.get('key')
        if (encodedKey) {
          const realKey = decodeURIComponent(encodedKey)
          console.log('✅ Extracted real key:', realKey)
          return `/api/download?key=${encodeURIComponent(realKey)}`
        }
      } catch (e) {
        console.error('❌ Failed to extract key from malformed URL:', e.message)
      }
    }

    // If it's already a full URL from B2 (signed URL), extract the path
    if (book.cover_image_path?.startsWith("http") && book.cover_image_path?.includes('backblazeb2.com')) {
      console.log('🔄 Found B2 signed URL, extracting path...')
      try {
        const url = new URL(book.cover_image_path)
        const pathParts = url.pathname.split('/')
        const uploadsIndex = pathParts.findIndex(part => part === 'uploads')
        if (uploadsIndex !== -1) {
          const realPath = pathParts.slice(uploadsIndex).join('/')
          console.log('✅ Extracted path from B2 URL:', realPath)
          return `/api/download?key=${encodeURIComponent(realPath)}`
        }
      } catch (e) {
        console.error('❌ Failed to extract path from B2 URL:', e.message)
      }
    }

    // If it's already a full URL (not B2), use it directly
    if (book.cover_image_path?.startsWith("http")) {
      console.log('🌐 Using direct HTTP URL:', book.cover_image_path)
      return book.cover_image_path
    }

    // If it's already an API URL, use it directly
    if (book.cover_image_path?.startsWith("/api/")) {
      console.log('🔗 Using existing API URL:', book.cover_image_path)
      return book.cover_image_path
    }

    // If it's a B2 path (starts with uploads/), return the path directly for useSignedUrl to handle
    if (book.cover_image_path?.startsWith("uploads/")) {
      console.log('📁 Returning uploads path directly:', book.cover_image_path)
      return book.cover_image_path
    }

    // Fallback to empty string
    console.log('📄 No valid cover image path')
    return ""
  }

  let query = supabase
    .from("books")
    .select("*", { count: "exact" })
    .eq("publish_status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + itemsPerPage - 1)

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,author.ilike.%${params.search}%`)
  }

  if (params.category && params.category !== "الكل") {
    query = query.eq("category", params.category)
  }

const { data: books, count } = await query
  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  // Debug logging for books data
  console.log('📚 Books Debug:', {
    totalBooks: count,
    fetchedBooks: books?.length,
    sampleBook: books?.[0] ? {
      id: books[0].id,
      title: books[0].title,
      cover_image_path: books[0].cover_image_path,
      cover_image: books[0].cover_image,
      hasCoverPath: !!books[0].cover_image_path,
      pathStartsWithUploads: books[0].cover_image_path?.startsWith('uploads/')
    } : 'No books'
  }) 
  return (
    <>
      {/* Hero Section */}
      <section className="bg-slate-900 py-12">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
 <span className="inline-block bg-surface text-secondary px-3 py-1 rounded-full text-sm mb-4 border border-secondary/20 shadow-sm">
 المكتبة العلمية </span>
<h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 font-serif">
 الكتب والمؤلفات </h1>
<p className="text-text-muted max-w-2xl mx-auto text-lg leading-relaxed">
 مجموعة مختارة من المؤلفات في الفقه والعقيدة والسيرة النبوية، متاحة للقراءة والتحميل مجاناً. </p>
</div>

 </section>

 {/* Search and Filters */} <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
<div className="bg-surface p-4 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-border">
 <div className="flex items-center gap-2 w-full md:w-auto">
<BookOpen className="h-5 w-5 text-primary" />
 <span className="font-bold text-foreground">
تصفية الكتب:</span>
</div>

 <form className="flex flex-wrap items-center gap-3 w-full md:w-auto">
<div className="relative">
 <input type="search" name="search" defaultValue={params.search}
placeholder = "ابحث عن كتاب..." className="appearance-none bg-background border border-border text-foreground py-2 pr-10 pl-4 rounded-lg focus:outline-none focus:border-primary w-full md:w-64" />
<Search className="absolute right-3 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
 </div>
<button type="submit" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition" >
 بحث </button>
</form>

 </div>

 {/* Category Pills */} {categories && categories.length > 0 && ( <div className="flex flex-wrap gap-2 mb-8">
<Link href="/books" className={`px-4 py-2 rounded-full text-sm font-medium transition ${ !params.category || params.category === "الكل" ? "bg-secondary text-white" : "bg-secondary/10 text-secondary hover:bg-secondary/20" }`} >
 جميع الكتب </Link>

 {categories.map((cat) => ( <Link key={cat.id}
href={`/books?category=${encodeURIComponent(cat.name)}`}
className={`px-4 py-2 rounded-full text-sm font-medium transition ${ params.category === cat.name ? "bg-secondary text-white" : "bg-secondary/10 text-secondary hover:bg-secondary/20" }`} >
 {cat.name} </Link>

 ))} </div>

 )} {/* Books Grid - Improved shadow and border visibility for book cards */} {!books || books.length === 0 ? ( <div className="text-center py-16 text-text-muted">
<BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
 <p className="text-lg">
لا توجد كتب منشورة حالياً</p>
</div>

 ) : ( <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
 {books.map((book) => ( <article key={book.id}
className="bg-surface dark:bg-card rounded-lg shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl transition-all duration-300 border-2 border-border dark:border-border/80 flex flex-col h-full group" >
<BookCoverImage coverImagePath={getCoverImageUrl(book)}
title = {book.title}
variant = "card" hoverEffect={true} />
 {book.pdf_file_path && ( <div className="absolute top-2 right-2">
<span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
 <FileText className="h-3 w-3" />
 PDF </span>
</div>

 )} <div className="p-4 flex flex-col flex-grow">
<h3 className="text-sm font-bold text-primary mb-1 line-clamp-2 hover:text-secondary transition-colors">
 {book.title} </h3>
<p className="text-xs text-text-muted mb-3">
{book.author}</p>
<div className="mt-auto flex items-center gap-2">
          <Link
            href={`/books/${book.id}`}
className="flex-1 text-center bg-primary hover:bg-primary-hover text-white py-1.5 px-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
          >
<Eye className="h-3 w-3" />
 التفاصيل </Link>

 {book.pdf_file_path && ( <Dialog>
<DialogTrigger asChild>
 <Button size="sm" variant="outline" className="w-8 h-8 p-0 flex items-center justify-center bg-transparent" title="قراءة" >
<BookOpen className="h-4 w-4" />
 </Button>
</DialogTrigger>

 <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0" >
<DialogHeader className="p-4 pb-2">
 <DialogTitle>
{book.title}</DialogTitle>
</DialogHeader>

 <div className="flex-1 px-4 pb-4 h-[calc(85vh-80px)]">
<iframe src={`/api/books/${book.id}/pdf#toolbar=1&navpanes=1&scrollbar=1`}
className="w-full h-full rounded-lg border border-border" title={book.title}
style = {{ minHeight: "500px" }} />
 </div>
</DialogContent>

 </Dialog>

 )} </div>
</div>

 </article>

 ))} </div>

 )} {/* Pagination */} {totalPages > 1 && ( <div className="flex justify-center mt-12">
<nav className="flex items-center gap-2">
        {currentPage > 1 && (
          <Link
            href={`/books?page=${currentPage - 1}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-background"
          >
<ChevronRight className="h-5 w-5" />
 </Link>

        )}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 5) {
            pageNum = i + 1
          } else if (currentPage <= 3) {
            pageNum = i + 1
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i
          } else {
            pageNum = currentPage - 2 + i
          } 
          return (
            <Link
              key={pageNum}
href={`/books?page=${pageNum}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium ${
                currentPage === pageNum
                  ? "bg-primary text-white"
                  : "border border-border text-text-muted hover:bg-background"
              }`}
            >
 {pageNum} </Link>

 ) }        )}
        {currentPage < totalPages && (
          <Link
            href={`/books?page=${currentPage + 1}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-background"
          >
<ChevronLeft className="h-5 w-5" />
 </Link>

 )} </nav>
</div>

 )} </main>
</>
 ) }
