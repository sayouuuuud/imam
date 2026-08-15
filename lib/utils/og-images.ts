/**
 * مساعدات لإدارة صور المعاينة (Open Graph images)
 */

import { getSiteBaseUrl } from "@/lib/utils/site-url"

const DEFAULT_OG_IMAGE = "/og-default.jpg"
// كان يُقرأ من المتغيّر مباشرة، فكانت روابط og:image تحمل نفس القيمة الفاسدة
const SITE_BASE_URL = getSiteBaseUrl()

// الملفات المخزنة على B2 تُقدَّم عبر /api/download الذي يعمل بإعادة توجيه (redirect)،
// وبعض زواحف المشاركة (واتساب/فيسبوك) لا تتبع إعادة التوجيه لصور المعاينة.
// لذلك نبني الرابط المباشر لملف B2 بدلاً من رابط الـ API.
const B2_PUBLIC_BASE_URL = "https://f005.backblazeb2.com/file/sheikh-sayed-public"

/**
 * تحويل أي مسار صورة مخزّن في قاعدة البيانات إلى رابط مطلق صالح للمعاينة
 */
export function resolveOgImageUrl(path?: string | null): string {
  if (!path || typeof path !== "string") return ""

  const value = path.trim()
  if (!value) return ""

  // رابط مطلق (Cloudinary / UploadThing / B2 ...)
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace(/^http:\/\//, "https://")
  }

  // رابط API للتحميل: نستخرج المفتاح ونبني الرابط المباشر
  if (value.includes("/api/download")) {
    try {
      const parsed = new URL(value, SITE_BASE_URL)
      const key = parsed.searchParams.get("key")
      if (key) return resolveOgImageUrl(decodeURIComponent(key))
    } catch {
      // تجاهل
    }
    return ""
  }

  // ملفات B2 / التخزين
  const key = value.replace(/^\/+/, "")
  if (key.startsWith("uploads/")) {
    return `${B2_PUBLIC_BASE_URL}/${key.split("/").map(encodeURIComponent).join("/")}`
  }

  // ملف داخل public/
  return `${SITE_BASE_URL}/${key}`
}

/**
 * الحصول على صورة المعاينة المناسبة للكتاب
 */
export function getBookOgImage(book: any): { url: string; width?: number; height?: number; alt: string } {
  const imageUrl =
    resolveOgImageUrl(book?.cover_image_path) ||
    resolveOgImageUrl(book?.cover_image) ||
    `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${book?.title || "كتاب"} - غلاف الكتاب`
  }
}

/**
 * الحصول على صورة المعاينة المناسبة للخطبة
 */
export function getSermonOgImage(sermon: any): { url: string; width?: number; height?: number; alt: string } {
  // نجرب كل الأعمدة المحتملة للصورة بالترتيب
  const imageUrl =
    resolveOgImageUrl(sermon?.thumbnail_path) ||
    resolveOgImageUrl(sermon?.thumbnail) ||
    resolveOgImageUrl(sermon?.image) ||
    `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${sermon?.title || "خطبة"} - صورة الخطبة`
  }
}

/**
 * الحصول على صورة المعاينة المناسبة للفيديو
 */
export function getVideoOgImage(video: any): { url: string; width?: number; height?: number; alt: string } {
  let imageUrl = resolveOgImageUrl(video?.thumbnail)

  // للفيديوهات من يوتيوب
  if (!imageUrl && video?.source === "youtube" && video?.url) {
    const videoId = video.url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/)?.[1]
    if (videoId) {
      imageUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }
  }

  if (!imageUrl) {
    imageUrl = `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`
  }

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${video?.title || "فيديو"} - صورة الفيديو`
  }
}

/**
 * الحصول على صورة المعاينة المناسبة للدرس
 */
export function getLessonOgImage(lesson: any): { url: string; width?: number; height?: number; alt: string } {
  const imageUrl =
    resolveOgImageUrl(lesson?.thumbnail_path) ||
    resolveOgImageUrl(lesson?.thumbnail) ||
    `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${lesson.title} - صورة الدرس`
  }
}

/**
 * الحصول على صورة المعاينة المناسبة للمقالة
 */
export function getArticleOgImage(article: any): { url: string; width?: number; height?: number; alt: string } {
  const imageUrl =
    resolveOgImageUrl(article?.featured_image) ||
    resolveOgImageUrl(article?.thumbnail) ||
    resolveOgImageUrl(article?.image) ||
    `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${article?.title || "مقالة"} - صورة المقالة`
  }
}

/**
 * الحصول على الصورة الافتراضية للموقع
 */
export function getDefaultOgImage(): { url: string; width?: number; height?: number; alt: string } {
  return {
    url: `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`,
    width: 1200,
    height: 630,
    alt: "الشيخ السيد مراد سلامة - عالم أزهري"
  }
}





