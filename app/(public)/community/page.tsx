import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import { Users, ChevronLeft, Calendar, User } from "lucide-react"

export const revalidate = 60

export default async function CommunityPage() {
  const supabase = createPublicClient()
  const { data: posts, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false }) 
  return ( <main className="min-h-screen py-12">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 {/* Breadcrumb */} <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
<Link href="/" className="hover:text-primary">
 الرئيسية </Link>
<ChevronLeft className="h-4 w-4 rtl-flip" />
 <span className="text-primary font-medium">
المجتمع</span>
</div>

 {/* Page Header */} <div className="text-center mb-12">
<span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
 المجتمع </span>
<h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
 مجتمعنا العلمي </h1>
<p className="text-text-muted max-w-2xl mx-auto">
 شارك تجربتك ومساهماتك مع مجتمعنا من طلاب العلم </p>
</div>

 {/* Posts Grid */} {error ? ( <div className="text-center py-16 bg-card rounded-2xl border border-border">
<Users className="h-16 w-16 mx-auto text-text-muted mb-4" />
 <h3 className="text-xl font-bold text-foreground mb-2">
جدول المجتمع غير موجود</h3>
<p className="text-text-muted mb-4">
يرجى تشغيل ملف الترحيل أولاً لإنشاء الجدول</p>
</div>

 ) : posts && posts.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {posts.map((post: any) => ( <div key={post.id}
className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow" >
 {post.image_url && ( <div className="aspect-video overflow-hidden">
<img src={post.image_url || "/placeholder.svg"}
alt = {post.author_name}
className="w-full h-full object-cover" />
 </div>

 )} <div className="p-6">
<div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
<User className="h-5 w-5 text-primary" />
 </div>
<div>
 <h3 className="font-bold text-foreground">
{post.author_name}</h3>
<p className="text-xs text-text-muted flex items-center gap-1">
 <Calendar className="h-3 w-3" />
 {new Date(post.created_at).toLocaleDateString("ar-EG")} </p>
</div>

 </div>
<p className="text-text-muted line-clamp-4">
{post.description}</p>
</div>

 </div>

 ))} </div>

 ) : ( <div className="text-center py-16 bg-card rounded-2xl border border-border">
<Users className="h-16 w-16 mx-auto text-text-muted mb-4" />
 <h3 className="text-xl font-bold text-foreground mb-2">
لا توجد مشاركات بعد</h3>
<p className="text-text-muted mb-6">
كن أول من يشارك في مجتمعنا</p>
<Link href="/community/submit" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-colors" >
 شارك الآن </Link>
</div>

 )} {/* Submit CTA */} {posts && posts.length > 0 && ( <div className="mt-12 text-center">
<Link href="/community/submit" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-xl" >
 <Users className="h-5 w-5" />
 شارك معنا </Link>
</div>

 )} </div>
</main>

 ) }
