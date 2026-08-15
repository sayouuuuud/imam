/**
 * مصدر واحد وموثوق لعنوان الموقع الأساسي.
 *
 * السبب في وجود هذا الملف: قيمة NEXT_PUBLIC_SITE_URL في الإنتاج كانت ملتصقة
 * كرابط ماركداون بالشكل:
 *
 *     [https://elsayedmourad.com](https://elsayedmourad.com)
 *
 * وبما أن كل ملف (sitemap / robots / feed / og-images / schema) كان يقرأ
 * المتغيّر بنفسه بـ `?.replace(/\/$/, "")` فقط — بدون أي تحقق — انتشرت القيمة
 * الفاسدة في كل رابط، فأنتجت 1173 خطأ "عنوان URL غير صالح" في Search Console.
 *
 * الآن كل الروابط تُبنى من هنا، والقيمة تُنظَّف وتُتحقَّق مرة واحدة.
 */

// النطاق الرسمي: elsayedmourad.com بدون www يعمل إعادة توجيه 308 إلى www،
// لذلك www هو النطاق الأساسي (canonical) وليس العكس.
const FALLBACK_BASE_URL = "https://www.elsayedmourad.com"
const CANONICAL_HOST = "www.elsayedmourad.com"
const APEX_HOST = "elsayedmourad.com"

/**
 * استخراج عنوان صالح من قيمة قد تكون مكتوبة بشكل خاطئ
 * تتعامل مع: رابط ماركداون، علامات تنصيص، أقواس زاوية، مسافات، / في النهاية،
 * وغياب البروتوكول.
 */
export function sanitizeBaseUrl(raw: string | undefined | null): string | null {
    if (!raw || typeof raw !== "string") return null

    let value = raw.trim()
    if (!value) return null

    // رابط ماركداون: [نص](رابط) → نأخذ الرابط الموجود بين القوسين
    const markdownMatch = value.match(/\[[^\]]*\]\(\s*([^)\s]+)\s*\)/)
    if (markdownMatch) value = markdownMatch[1]

    // إزالة علامات التنصيص والأقواس الزاوية والفواصل الزائدة
    value = value.replace(/^["'<`\s]+|["'>`\s,;]+$/g, "").trim()
    if (!value) return null

    // إذا بقيت أي أقواس أو مسافات فالقيمة غير صالحة كعنوان
    if (/[\[\]()\s]/.test(value)) return null

    // إضافة البروتوكول إن كان ناقصًا
    if (!/^https?:\/\//i.test(value)) {
        if (value.startsWith("//")) value = `https:${value}`
        else value = `https://${value}`
    }

    try {
        const url = new URL(value)
        if (url.protocol !== "http:" && url.protocol !== "https:") return null
        if (!url.hostname || !url.hostname.includes(".")) return null

        // توحيد النطاق: النطاق المجرّد يعمل redirect إلى www، والروابط التي
        // تعمل redirect تُصنَّف في Search Console كـ "صفحة بها إعادة توجيه"
        const hostname = url.hostname === APEX_HOST ? CANONICAL_HOST : url.hostname

        return `https://${hostname}${url.port ? `:${url.port}` : ""}`
    } catch {
        return null
    }
}

/**
 * عنوان الموقع الأساسي — بدون / في النهاية، ومضمون الصلاحية دائمًا
 */
export function getSiteBaseUrl(): string {
    return sanitizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) || FALLBACK_BASE_URL
}

/**
 * بناء رابط مطلق من مسار داخلي
 */
export function buildSiteUrl(path?: string | null): string {
    const base = getSiteBaseUrl()
    if (!path) return base
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    return `${base}${cleanPath === "/" ? "" : cleanPath}`
}

export const SITE_BASE_URL = getSiteBaseUrl()
