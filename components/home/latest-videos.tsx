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
            <div className="absolute inset-0 flex items-center justify-center bg-primary">
                <Film className="absolute -left-4 -bottom-6 h-28 w-28 text-primary-foreground/10 rotate-12" strokeWidth={1.2} />
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
                                    <article className="relative flex flex-col h-full aspect-[3/4] rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ring-1 ring-border/60 group-hover:ring-primary/40">
                                        {/* Thumbnail fills the whole card */}
                                        <VideoThumbnail src={thumbnailUrl} title={video.title} />

                                        {/* Permanent gradient for text legibility */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/20 to-transparent opacity-90" />

                                        {/* Center play button */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-14 h-14 rounded-full bg-secondary/95 flex items-center justify-center shadow-lg scale-90 opacity-90 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                                                <Play className="w-6 h-6 text-secondary-foreground" strokeWidth={1.8} />
                                            </div>
                                        </div>

                                        {/* Duration badge */}
                                        {video.duration && (
                                            <span className="absolute top-3 left-3 bg-background/90 text-foreground text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {video.duration}
                                            </span>
                                        )}

                                        {/* Category chip */}
                                        <span className="absolute top-3 right-3 bg-secondary text-secondary-foreground text-xs font-bold px-2.5 py-1 rounded-md">
                                            فيديو
                                        </span>

                                        {/* Title + meta over the gradient */}
                                        <div className="relative mt-auto z-10 p-4">
                                            <h3 className="text-background font-bold leading-snug line-clamp-2 mb-2 text-base lg:text-lg">
                                                {video.title}
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-background/80 text-xs flex items-center gap-1.5">
                                                    {formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: ar })}
                                                </span>
                                                <span className="w-7 h-7 rounded-full bg-background/15 flex items-center justify-center group-hover:bg-secondary transition-colors">
                                                    <ArrowLeft className="w-3.5 h-3.5 text-background group-hover:text-secondary-foreground group-hover:-translate-x-0.5 transition-all" />
                                                </span>
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
