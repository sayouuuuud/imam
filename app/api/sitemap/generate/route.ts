import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

/**
 * The old implementation built an XML string in memory and threw it away.
 * The real sitemap is produced by `app/sitemap.ts`, cached by Next.js with
 * `export const revalidate = 3600`. The only meaningful thing an admin
 * "regenerate" action can do is invalidate that cache + robots.txt so the
 * next crawl gets fresh data.
 */
export async function POST() {
    try {
        revalidatePath("/sitemap.xml")
        revalidatePath("/robots.txt")
        return NextResponse.json({
            success: true,
            message:
                "تم تحديث خريطة الموقع — ستظهر التغييرات فور تحميل /sitemap.xml في المرة القادمة",
            sitemap: "/sitemap.xml",
            robots: "/robots.txt",
        })
    } catch (error: any) {
        console.error("[v0] Sitemap revalidation error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || "حدث خطأ في تحديث خريطة الموقع",
            },
            { status: 500 }
        )
    }
}

export async function GET() {
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        "https://elsayed-mourad.online"
    return NextResponse.json({
        sitemap: `${baseUrl}/sitemap.xml`,
        robots: `${baseUrl}/robots.txt`,
    })
}
