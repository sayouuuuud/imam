"use client"

import Link from "next/link"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { ArrowLeft, Play, Clock, Film } from "lucide-react"

interface Video {
    id: string
    title: string
    description?: string
    created_at: string
    duration?: string
    thumbnail?: string
    url?: string
}

interface LatestVideosProps {
    videos: Video[]
}

// Get YouTube thumbnail from URL
function getYouTubeThumbnail(url: string | undefined): string | null {
    if (!url) return null
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/
    )
    if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
    }
    return null
}

function VideoThumbnail({ src, title }: { src: string | null; title: string }) {
    const [failed, setFailed] = useState(false)

    if (!src || failed) {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <Film className="absolute -left-4 -bottom-6 h-28 w-28 text-primary-foreground/10 rotate-12" strokeWidth={1.2} />
                <div className="relative w-16 h-16 rounded-full bg-secondary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <Play className="h-7 w-7 text-secondary-foreground" strokeWidth={1.6} />
                </div>
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setFailed(true)}
        />
    )
}

export function LatestVideos({ videos }: LatestVideosProps) {
    return (
        <section className="py-16 lg:py-20 bg-background relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
                    <div>
                        <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-3 inline-block">
                            المرئيات
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight">أحدث المرئيات</h2>
                    </div>
                    <Link
                        href="/videos"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary bg-card px-4 py-2 rounded-lg text-sm border border-border transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                    >
                        عرض كل المرئيات
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </div>

                {videos.length === 0 ? (
                    <p className="text-muted-foreground text-center py-16">لا توجد مرئيات حالياً</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
                        {videos.map((video) => {
                            const thumbnailUrl = video.thumbnail || getYouTubeThumbnail(video.url)
                            return (
                                <Link href={`/videos/${video.id}`} key={video.id} className="group block h-full">
                                    <article className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40">
                                        {/* Thumbnail */}
                                        <div className="aspect-[16/10] bg-primary relative overflow-hidden">
                                            <VideoThumbnail src={thumbnailUrl} title={video.title} />

                                            {/* Play overlay */}
                                            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shadow-lg">
                                                    <Play className="w-6 h-6 text-secondary-foreground" strokeWidth={1.8} />
                                                </div>
                                            </div>

                                            {video.duration && (
                                                <span className="absolute bottom-2.5 left-2.5 bg-foreground/80 text-background text-xs font-medium px-2 py-1 rounded-md">
                                                    {video.duration}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-col flex-1 p-5">
                                            <h3 className="text-base lg:text-lg font-bold mb-2 text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                                {video.title}
                                            </h3>

                                            <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: ar })}
                                                </span>
                                                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    )
}
