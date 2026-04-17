import { getSiteSettings } from "./site-settings"

export type SchemaType = Record<string, unknown>

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elsayed-mourad.online"

// Helper function to get common author data from settings
async function getAuthorData() {
    const settings = await getSiteSettings()
    return {
        name: settings.site_name || settings.site_author || "الشيخ السيد مراد سلامة",
        url: settings.canonical_url || SITE_URL,
        image: settings.og_image || `${SITE_URL}/logo.png`,
        description: settings.meta_description || settings.site_description || "الشيخ السيد مراد عالم أزهري، إمام وخطيب، متخصص في الفقه والعقيدة والسيرة النبوية. يقدم خطبًا ودروسًا ومحاضرات علمية.",
        socials: [
            settings.canonical_url || SITE_URL,
            // we can add other specific ones if we add them to site_settings table later
        ]
    }
}

// ─────────────────────────────────────────────────────────────
// PERSON SCHEMA — full profile for Knowledge Panel eligibility
// ─────────────────────────────────────────────────────────────
export async function generatePersonSchema(): Promise<SchemaType> {
    const author = await getAuthorData()
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: author.name,
        alternateName: ["السيد مراد", "الشيخ السيد مراد", "الشيخ السيد مراد سلامة", "Sayed Mourad"],
        url: author.url,
        image: {
            "@type": "ImageObject",
            url: author.image,
            contentUrl: author.image,
        },
        jobTitle: "عالم أزهري وإمام وخطيب",
        description: author.description,
        nationality: {
            "@type": "Country",
            name: "مصر",
        },
        alumniOf: {
            "@type": "EducationalOrganization",
            name: "جامعة الأزهر الشريف",
            url: "https://www.azhar.edu.eg",
        },
        affiliation: {
            "@type": "Organization",
            name: "الأزهر الشريف",
            url: "https://www.azhar.edu.eg",
        },
        knowsAbout: [
            "الفقه الإسلامي",
            "العقيدة الإسلامية",
            "السيرة النبوية",
            "التفسير القرآني",
            "الحديث النبوي الشريف",
            "الخطابة الدينية",
            "الدروس الشرعية",
        ],
        sameAs: author.socials,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": author.url,
        },
    }
}

// ─────────────────────────────────────────────────────────────
// WEBSITE SCHEMA
// ─────────────────────────────────────────────────────────────
export async function generateWebsiteSchema(): Promise<SchemaType> {
    const author = await getAuthorData()
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: `الموقع الرسمي - ${author.name}`,
        url: SITE_URL,
        description: author.description,
        inLanguage: "ar",
        publisher: {
            "@id": `${SITE_URL}/#person`,
        },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    }
}

// ─────────────────────────────────────────────────────────────
// ITEM LIST — for category/list pages (khutba, dars, articles, books, videos)
// ─────────────────────────────────────────────────────────────
export async function generateItemListSchema(
    name: string,
    url: string,
    description: string,
    items: { id: string; title: string; url: string; image?: string; datePublished?: string }[]
): Promise<SchemaType> {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        description,
        url: `${SITE_URL}${url}`,
        numberOfItems: items.length,
        itemListElement: items.slice(0, 20).map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
                "@type": "CreativeWork",
                "@id": `${SITE_URL}${item.url}`,
                name: item.title,
                url: `${SITE_URL}${item.url}`,
                ...(item.image && { image: item.image }),
                ...(item.datePublished && { datePublished: item.datePublished }),
                author: { "@id": `${SITE_URL}/#person` },
            },
        })),
    }
}

// ─────────────────────────────────────────────────────────────
// BREADCRUMB SCHEMA
// ─────────────────────────────────────────────────────────────
export async function generateBreadcrumbSchema(
    items: { name: string; url?: string; item?: string }[]
): Promise<SchemaType> {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((breadcrumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: breadcrumb.name,
            item: `${SITE_URL}${breadcrumb.url || breadcrumb.item}`,
        })),
    }
}

// ─────────────────────────────────────────────────────────────
// ARTICLE SCHEMA — for مقالات / دروس / خطب
// ─────────────────────────────────────────────────────────────
export async function generateArticleSchema(article: {
    title: string
    description?: string
    content?: string
    image?: string
    url: string
    datePublished?: string
    dateModified?: string
    tags?: string[]
    authorName?: string
}): Promise<SchemaType> {
    // Strip any HTML from the raw body and compute a rough Arabic word count.
    // Google uses `wordCount` + `articleBody` as quality / read-time signals,
    // and without it our long-form posts get miscategorized as thin content.
    const plainBody = article.content
        ? article.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        : ""
    const wordCount = plainBody ? plainBody.split(/\s+/).filter(Boolean).length : undefined

    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description || "",
        url: `${SITE_URL}${article.url}`,
        ...(article.image && {
            image: {
                "@type": "ImageObject",
                url: article.image,
                contentUrl: article.image,
            },
        }),
        datePublished: article.datePublished || new Date().toISOString(),
        dateModified: article.dateModified || article.datePublished || new Date().toISOString(),
        author: {
            "@id": `${SITE_URL}/#person`,
        },
        publisher: {
            "@id": `${SITE_URL}/#person`,
        },
        // Egyptian Arabic region hint helps Google show this in MENA results.
        inLanguage: "ar-EG",
        ...(wordCount && wordCount > 20 && { wordCount }),
        ...(plainBody && { articleBody: plainBody.slice(0, 5000) }),
        ...(article.tags && article.tags.length > 0 && {
            keywords: article.tags.join(", "),
            articleSection: article.tags[0],
        }),
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}${article.url}`,
        },
        isPartOf: {
            "@id": `${SITE_URL}/#website`,
        },
    }
}

// ─────────────────────────────────────────────────────────────
// BOOK SCHEMA
// ─────────────────────────────────────────────────────────────
export async function generateBookSchema(book: {
    title: string
    description?: string
    image?: string
    url: string
    datePublished?: string
    tags?: string[]
    author?: string
    authorName?: string
}): Promise<SchemaType> {
    return {
        "@context": "https://schema.org",
        "@type": "Book",
        name: book.title,
        description: book.description || "",
        url: `${SITE_URL}${book.url}`,
        ...(book.image && { image: book.image }),
        inLanguage: "ar",
        author: {
            "@id": `${SITE_URL}/#person`,
        },
        publisher: {
            "@id": `${SITE_URL}/#person`,
        },
        ...(book.datePublished && { datePublished: book.datePublished }),
        ...(book.tags && book.tags.length > 0 && { keywords: book.tags.join(", ") }),
        bookFormat: "EBook",
        isPartOf: {
            "@id": `${SITE_URL}/#website`,
        },
    }
}

// ─────────────────────────────────────────────────────────────
// VIDEO SCHEMA
// ─────────────────────────────────────────────────────────────
export async function generateVideoSchema(video: {
    title: string
    description?: string
    thumbnail?: string
    url: string
    contentUrl?: string
    embedUrl?: string
    datePublished?: string
    uploadDate?: string
    duration?: string
}): Promise<SchemaType> {
    return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: video.title,
        description: video.description || "",
        url: `${SITE_URL}${video.url}`,
        ...(video.thumbnail && { thumbnailUrl: video.thumbnail }),
        ...(video.contentUrl && { contentUrl: video.contentUrl }),
        ...(video.embedUrl && { embedUrl: video.embedUrl }),
        uploadDate: video.uploadDate || video.datePublished || new Date().toISOString(),
        ...(video.duration && { duration: video.duration }),
        author: {
            "@id": `${SITE_URL}/#person`,
        },
        publisher: {
            "@id": `${SITE_URL}/#person`,
        },
        inLanguage: "ar",
        isPartOf: {
            "@id": `${SITE_URL}/#website`,
        },
    }
}

// ─────────────────────────────────────────────────────────────
// AUDIO SCHEMA — for خطب صوتية / دروس صوتية
// ─────────────────────────────────────────────────────────────
export async function generateAudioSchema(audio: {
    title: string
    description?: string
    url: string
    contentUrl?: string
    thumbnail?: string
    datePublished?: string
    uploadDate?: string
    duration?: string
}): Promise<SchemaType> {
    return {
        "@context": "https://schema.org",
        "@type": "AudioObject",
        name: audio.title,
        description: audio.description || "",
        url: `${SITE_URL}${audio.url}`,
        ...(audio.contentUrl && { contentUrl: audio.contentUrl }),
        ...(audio.thumbnail && { thumbnailUrl: audio.thumbnail }),
        datePublished: audio.uploadDate || audio.datePublished || new Date().toISOString(),
        ...(audio.duration && { duration: audio.duration }),
        author: {
            "@id": `${SITE_URL}/#person`,
        },
        inLanguage: "ar",
        isPartOf: {
            "@id": `${SITE_URL}/#website`,
        },
    }
}

// ─────────────────────────────────────────────────────────────
// SEARCH RESULTS PAGE SCHEMA
// ─────────────────────────────────────────────────────────────
export async function generateSearchResultsSchema(query: string): Promise<SchemaType> {
    return {
        "@context": "https://schema.org",
        "@type": "SearchResultsPage",
        name: `نتائج البحث عن: ${query}`,
        url: `${SITE_URL}/search?q=${encodeURIComponent(query)}`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
    }
}

// ─────────────────────────────────────────────────────────────
// FAQ SCHEMA — for pages with Q&A content
// ─────────────────────────────────────────────────────────────
export async function generateFaqSchema(
    faqs: { question: string; answer: string }[]
): Promise<SchemaType> {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    }
}

// ─────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function formatDurationToISO(duration?: string): string {
    if (!duration) return "PT0S"

    // Handled formats: "MM:SS", "HH:MM:SS"
    const parts = duration.split(":").map(Number)
    if (parts.length === 2) {
        const [minutes, seconds] = parts
        return `PT${minutes}M${seconds}S`
    }
    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts
        return `PT${hours}H${minutes}M${seconds}S`
    }
    return "PT0S"
}

export function formatDateForSchema(dateStr?: string): string {
    if (!dateStr) return new Date().toISOString()
    try {
        return new Date(dateStr).toISOString()
    } catch (e) {
        return new Date().toISOString()
    }
}
