import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { ChevronLeft, Clock, Eye, Play, BookOpen, History, School } from "lucide-react"
import { SafeHtml } from "@/components/ui/safe-html"
import { BookCoverImage } from "@/components/book-cover-image"
import { AudioPlayer } from "@/components/audio-player"
import { SheikhProfileCard } from "@/components/sheikh-profile-card"
import { NewsletterCard } from "@/components/newsletter-card"
import { LessonInteractions } from "@/components/lessons/lesson-interactions"
import { ViewTracker } from "@/components/view-tracker"
import { stripHtml } from "@/lib/utils/strip-html"
import { getLessonOgImage } from "@/lib/utils/og-images"
import { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { generateArticleSchema, generateVideoSchema, generateAudioSchema, generateBreadcrumbSchema, formatDurationToISO } from "@/lib/schema-generator"
import { permanentRedirect, notFound } from "next/navigation"

interface PageProps {
    params: Promise<{ slug: string }>
}

// Revalidate the cached page at most once an hour instead of rendering (and
// hitting Supabase) on every request.
export const revalidate = 3600

export async function generateStaticParams() {
    const supabase = createPublicClient()
    const { data } = await supabase
        .from("lessons")
        .select("slug")
        .eq("publish_status", "published")
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(100)

    return (data || []).filter((l) => l.slug).map((l) => ({ slug: l.slug as string }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const supabase = createPublicClient()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const query = supabase.from("lessons").select("title, description, thumbnail, thumbnail_path")
    if (isUuid) {
        query.eq("id", slug)
    } else {
        query.eq("slug", decodeURIComponent(slug))
    }

    const { data: lesson } = await query.single()

    if (!lesson) return { title: "الدرس غير موجود", robots: { index: false, follow: false } }

    const ogImage = getLessonOgImage(lesson)
    const canonicalPath = `/dars/${lesson.slug || slug}`

    return {
        title: `${lesson.title} | الشيخ السيد مراد سلامة`,
        description: lesson.description ? lesson.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title: lesson.title,
            description: lesson.description ? lesson.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
            images: [ogImage],
            type: "article",
            url: canonicalPath,
        },
        twitter: {
            card: "summary_large_image",
            title: lesson.title,
            description: lesson.description ? lesson.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
            images: [ogImage.url],
        },
    }
}

// Helper functions
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

const getLessonTypeIcon = (type: string) => {
    switch (type) {
        case "fiqh":
            return <BookOpen className="h-3.5 w-3.5" />
        case "seerah":
            return <History className="h-3.5 w-3.5" />
        default:
            return <School className="h-3.5 w-3.5" />
    }
}

const getLessonTypeName = (type: string) => {
    switch (type) {
        case "fiqh":
            return "درس فقه"
        case "seerah":
            return "درس سيرة"
        default:
            return "درس علمي"
    }
}

const getAudioUrl = (lesson: any) => {
    if (lesson.media_url?.startsWith("uploads/")) {
        return lesson.media_url
    }
    return lesson.media_url || lesson.audio_url || lesson.audio_file_path
}

const getThumbnailPath = (lesson: any) => {
    if (lesson.thumbnail_path?.startsWith("uploads/")) {
        return lesson.thumbnail_path
    }
    if (lesson.thumbnail?.startsWith("uploads/")) {
        return lesson.thumbnail
    }
    if (lesson.thumbnail_path?.startsWith("http")) {
        return lesson.thumbnail_path
    }
    if (lesson.thumbnail?.startsWith("http")) {
        return lesson.thumbnail
    }
    return lesson.thumbnail_path || lesson.thumbnail
}

const parseDurationToSeconds = (durationStr: string | null | undefined): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
}

export default async function DarsDetailPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = createPublicClient()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    // Fetch lesson
    const lessonQuery = supabase.from("lessons").select("*").eq("publish_status", "published");
    if (isUuid) {
        lessonQuery.eq("id", slug);
    } else {
        lessonQuery.eq("slug", decodeURIComponent(slug));
    }
    const { data: lesson } = await lessonQuery.single();

    if (!lesson) {
        notFound()
    }

    if (isUuid && lesson.slug) {
        // 308 permanent so Google consolidates the UUID URL onto the slug URL.
        permanentRedirect(`/dars/${encodeURI(lesson.slug)}`);
    }

    // Fetch related lessons
    const { data: relatedLessonsData } = await supabase.from("lessons")
        .select("id, slug, title, thumbnail_path, created_at, views_count, lesson_type")
        .eq("publish_status", "published")
        .neq("id", lesson.id)
        .order("created_at", { ascending: false })
        .limit(4);

    const relatedLessons = relatedLessonsData || []
    const audioUrl = getAudioUrl(lesson)
    const thumbnailPath = getThumbnailPath(lesson)

    const articleSchema = await generateArticleSchema({
        title: lesson.title,
        description: lesson.description ? stripHtml(lesson.description) : undefined,
        url: `/dars/${lesson.slug || lesson.id}`,
        image: thumbnailPath,
        datePublished: lesson.created_at,
        dateModified: lesson.created_at,
    })

    const isVideo = lesson.youtube_url || (lesson.type === 'video' && audioUrl);

    const mediaSchema = isVideo ? await generateVideoSchema({
        title: lesson.title,
        description: lesson.description ? stripHtml(lesson.description) : lesson.title,
        url: `/dars/${lesson.slug || lesson.id}`,
        uploadDate: lesson.created_at,
        thumbnail: thumbnailPath ? (thumbnailPath.startsWith('http') ? thumbnailPath : `https://elsayedmourad.com${thumbnailPath}`) : 'https://elsayedmourad.com/video-thumbnail.png',
        contentUrl: !lesson.youtube_url && audioUrl ? (audioUrl.startsWith('http') ? audioUrl : `https://elsayedmourad.com${audioUrl}`) : undefined,
        embedUrl: lesson.youtube_url ? `https://www.youtube.com/embed/${lesson.youtube_url.split("v=")[1]?.split("&")[0] || lesson.youtube_url.split("/").pop()}` : undefined,
        duration: formatDurationToISO(lesson.duration),
    }) : (audioUrl ? await generateAudioSchema({
        title: lesson.title,
        description: lesson.description ? stripHtml(lesson.description) : undefined,
        url: `/dars/${lesson.slug || lesson.id}`,
        uploadDate: lesson.created_at,
        contentUrl: audioUrl.startsWith('http') ? audioUrl : `https://elsayedmourad.com${audioUrl}`,
        duration: formatDurationToISO(lesson.duration),
    }) : null);

    const breadcrumbSchema = await generateBreadcrumbSchema([
        { name: 'الرئيسية', item: '/' },
        { name: 'الدروس العلمية', item: '/dars' },
        { name: lesson.title, item: `/dars/${lesson.slug || lesson.id}` },
    ])

    return (
        <div className="min-h-screen bg-[#fdfbf7] dark:bg-background bg-pattern text-foreground antialiased transition-colors duration-300">
            <style>{`
          @media print {
            body * { visibility: hidden; }
            #lesson-content, #lesson-content * { visibility: visible; }
            #lesson-content {
              position: absolute; left: 0; top: 0; width: 100%; color: #000000 !important;
            }
            #lesson-content * {
              color: #000000 !important; background: #ffffff !important;
            }
            .no-print, header, footer, .lg\\:col-span-4 { display: none !important; }
          }
        `}</style>
            <div className="container mx-auto px-0 md:px-4 lg:px-8 py-10 min-h-screen">
                <JsonLd schema={[articleSchema, breadcrumbSchema, ...(mediaSchema ? [mediaSchema] : [])]} />
                <ViewTracker table="lessons" id={lesson.id} />

                {/* Breadcrumb */}
                <nav className="px-4 md:px-0 flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] print:hidden">
                    <Link href="/" className="hover:text-primary dark:hover:text-secondary">الرئيسية</Link>
                    <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
                    <Link href="/dars" className="hover:text-primary dark:hover:text-secondary">الدروس العلمية</Link>
                    <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
                    <span className="text-primary dark:text-secondary font-medium">{lesson.title}</span>
                </nav>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-0 md:space-y-8">
                        {/* Lesson Header Card */}
                        <div className="bg-card rounded-none md:rounded-2xl p-6 md:p-8 border-b md:border border-border shadow-none md:shadow-sm relative overflow-hidden">
                            <span className="material-icons-outlined absolute -left-10 -top-10 text-9xl text-gray-50 dark:text-gray-800/30 opacity-50 transform rotate-12">school</span>
                            <div className="relative z-10">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 text-xs rounded-full font-medium border flex items-center gap-1" style={{ backgroundColor: '#fdf4dc', color: '#b58842', borderColor: '#d4af37' }}>
                                        {getLessonTypeIcon(lesson.lesson_type)}
                                        {getLessonTypeName(lesson.lesson_type)}
                                    </span>
                                    <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(lesson.created_at)}
                                    </span>
                                    <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        {lesson.views_count || 0} مشاهدة
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-6 leading-tight">
                                    {lesson.title}
                                </h1>
                                {lesson.description && (
                                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                                        {lesson.description.replace(/<[^>]*>/g, '')}
                                    </p>
                                )}

                                {thumbnailPath && (
                                    <div className="rounded-xl overflow-hidden border border-border">
                                        <BookCoverImage
                                            coverImagePath={thumbnailPath}
                                            title={lesson.title}
                                            variant="detail"
                                            showFallback={false}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audio Player */}
                        {audioUrl && lesson.type === "audio" && (
                            <div className="px-4 md:px-0 no-print">
                                <AudioPlayer
                                    src={audioUrl}
                                    title={lesson.title}
                                    initialDuration={parseDurationToSeconds(lesson.duration)}
                                    audioId={lesson.id}
                                    table="lessons"
                                />
                            </div>
                        )}

                        {/* YouTube / Video */}
                        {(lesson.youtube_url || (lesson.type === 'video' && audioUrl)) && (
                            <div className="px-4 md:px-0 no-print">
                                <div className="bg-card rounded-xl p-4 md:p-6 border border-border shadow-sm">
                                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                                        {lesson.youtube_url ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${lesson.youtube_url.split("v=")[1]?.split("&")[0] || lesson.youtube_url.split("/").pop()}`}
                                                title={lesson.title}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <video controls className="w-full h-full">
                                                <source src={audioUrl} type="video/mp4" />
                                                متصفحك لا يدعم تشغيل الفيديوهات
                                            </video>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        {lesson.content && (
                            <article
                                id="lesson-content"
                                className="prose prose-lg dark:prose-invert prose-headings:font-display prose-p:font-serif prose-p:text-foreground max-w-none bg-card p-6 md:p-12 rounded-none md:rounded-2xl border-0 md:border border-border shadow-none md:shadow-sm prose-blockquote:border-r-4 prose-blockquote:border-secondary prose-blockquote:bg-secondary/5 prose-blockquote:text-foreground prose-blockquote:font-serif prose-blockquote:text-xl prose-blockquote:leading-relaxed prose-blockquote:p-4 prose-blockquote:rounded-l-lg prose-blockquote:not-italic prose-blockquote:my-8 prose-strong:text-foreground prose-strong:font-bold prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-li:mb-1 prose-a:text-primary prose-a:underline hover:prose-a:no-underline [&_.quran-verse]:text-foreground [&_.quran-verse_p]:text-foreground [&_.quran-verse_footer]:text-muted-foreground overflow-x-hidden break-words [overflow-wrap:anywhere]"
                            >
                                <SafeHtml html={lesson.content} />
                            </article>
                        )}

                        {/* Transcript */}
                        {lesson.transcript && (
                            <div className="bg-card rounded-none md:rounded-2xl p-6 md:p-12 border-0 md:border border-border shadow-none md:shadow-sm">
                                <h2 className="text-2xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-primary rounded-full"></span>
                                    نص الدرس
                                </h2>
                                <SafeHtml
                                    html={lesson.transcript}
                                    className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-p:font-serif prose-p:text-foreground prose-p:leading-relaxed overflow-x-hidden break-words [overflow-wrap:anywhere]"
                                />
                            </div>
                        )}

                        {/* Interactions (Share/Download) */}
                        <div className="px-4 md:px-0">
                            <LessonInteractions
                                audioUrl={audioUrl}
                                title={lesson.title}
                                description={lesson.description}
                                lessonId={lesson.id}
                                table="lessons"
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 px-4 lg:px-0 space-y-8">
                        <SheikhProfileCard />

                        {/* Related Lessons */}
                        {relatedLessons.length > 0 && (
                            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-lg text-card-foreground flex items-center gap-2">
                                        <span className="w-1 h-6 bg-primary rounded-full"></span>
                                        دروس ذات صلة
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    {relatedLessons.map((relatedLesson) => (
                                        <Link key={relatedLesson.id} href={`/dars/${relatedLesson.slug || relatedLesson.id}`} className="group block">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden relative">
                                                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors flex items-center justify-center z-10">
                                                        <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <BookCoverImage
                                                        coverImagePath={getThumbnailPath(relatedLesson)}
                                                        title={relatedLesson.title}
                                                        variant="card"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-card-foreground group-hover:text-primary transition-colors text-sm leading-snug mb-1">
                                                        {relatedLesson.title}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(relatedLesson.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Link href="/dars" className="block text-center text-primary dark:text-secondary text-sm font-bold mt-6 hover:underline">
                                    عرض المزيد من الدروس
                                </Link>
                            </div>
                        )}

                        <NewsletterCard />
                    </div>
                </div>
            </div>
        </div>
    )
}
