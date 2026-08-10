import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { ArrowLeft, Clock, Scroll } from "lucide-react"

interface Sermon {
    id: string
    title: string
    description?: string
    created_at: string
}

interface LatestSermonsProps {
    sermons: Sermon[]
}

// Helper function to strip HTML tags from text
function stripHtml(html: string | undefined): string {
    if (!html) return ""
    // Remove HTML tags and decode HTML entities
    return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, '') // Remove numeric HTML entities
        .trim()
}

export function LatestSermons({ sermons }: LatestSermonsProps) {
    return (
        <section className="py-16 lg:py-20 bg-muted relative">
            {/* Smooth gradient blend overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 from-background via-muted/30 to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
                    <div>
                        <span className="text-xs font-bold text-secondary-foreground bg-secondary/20 border border-secondary/30 px-3 py-1 rounded-full mb-3 inline-block">
                            خطب الجمعة
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight">أحدث الخطب</h2>
                    </div>
                    <Link
                        href="/khutba"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary bg-card px-4 py-2 rounded-lg text-sm border border-border transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                    >
                        عرض كل الخطب
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </div>

                {sermons.length === 0 ? (
                    <p className="text-muted-foreground text-center py-16">لا توجد خطب حالياً</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
                        {sermons.map((sermon) => (
                            <Link href={`/khutba/${sermon.id}`} key={sermon.id} className="group block h-full">
                                <article className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40">
                                    {/* Header */}
                                    <div className="aspect-[16/10] bg-primary relative overflow-hidden flex items-center justify-center">
                                        <Scroll className="absolute -left-4 -bottom-6 h-28 w-28 text-primary-foreground/10 rotate-12" strokeWidth={1.2} />
                                        <div className="relative w-16 h-16 rounded-full bg-secondary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                            <Scroll className="h-7 w-7 text-secondary-foreground" strokeWidth={1.6} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col flex-1 p-5">
                                        <h3 className="text-base lg:text-lg font-bold mb-2 text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                            {sermon.title}
                                        </h3>

                                        {sermon.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {stripHtml(sermon.description)}
                                            </p>
                                        )}

                                        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDistanceToNow(new Date(sermon.created_at), { addSuffix: true, locale: ar })}
                                            </span>
                                            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
