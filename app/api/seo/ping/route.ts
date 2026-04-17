import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"
import { randomBytes } from "crypto"

/**
 * IndexNow integration.
 *
 * Google's and Bing's old `/ping?sitemap=` endpoints were deprecated in 2023
 * and no longer do anything.
 *
 * IndexNow (https://www.indexnow.org) is the current standard and is supported
 * by Bing, Yandex, Seznam, Naver, Yep — and any submission is automatically
 * shared with the rest. Google does NOT support IndexNow and has no public
 * indexing ping API for normal sites (only `Indexing API` for JobPosting /
 * BroadcastEvent). For Google, the real way is Search Console → "Inspect URL"
 * → Request Indexing, or rely on the sitemap + organic crawling.
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow"

function getHost(siteUrl: string): string {
    try {
        return new URL(siteUrl).host
    } catch {
        return siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    }
}

function normalizeBaseUrl(url: string): string {
    return url.replace(/\/$/, "")
}

async function getOrCreateIndexNowKey(): Promise<string> {
    const envKey = process.env.INDEXNOW_KEY
    if (envKey && /^[a-f0-9]{8,128}$/i.test(envKey)) {
        return envKey
    }

    try {
        const supabase = createPublicClient()
        const { data: existing } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "indexnow_key")
            .maybeSingle()

        if (existing?.value && /^[a-f0-9]{8,128}$/i.test(existing.value)) {
            return existing.value as string
        }

        const newKey = randomBytes(16).toString("hex")
        await supabase.from("site_settings").upsert(
            {
                key: "indexnow_key",
                value: newKey,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
        )
        return newKey
    } catch {
        // Fallback deterministic-but-random key (non-persistent)
        return randomBytes(16).toString("hex")
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { urls } = body as { urls?: string[] }

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json(
                { error: "يرجى تحديد الروابط" },
                { status: 400 }
            )
        }

        const baseUrl = normalizeBaseUrl(
            process.env.NEXT_PUBLIC_SITE_URL || "https://elsayed-mourad.online"
        )
        const host = getHost(baseUrl)
        const key = await getOrCreateIndexNowKey()
        const keyLocation = `${baseUrl}/api/indexnow/key`

        // Build absolute, deduped URL list (cap at 10000 per IndexNow spec, but
        // we limit to 50 per batch to keep the request fast & readable).
        const urlList = Array.from(
            new Set(
                urls
                    .map((u) => u?.trim())
                    .filter(Boolean)
                    .map((u) =>
                        u.startsWith("http")
                            ? u
                            : `${baseUrl}${u.startsWith("/") ? "" : "/"}${u}`
                    )
            )
        ).slice(0, 50)

        // Single bulk submission — this is what the IndexNow spec expects.
        let indexnowStatus = 0
        let indexnowBody = ""
        try {
            const res = await fetch(INDEXNOW_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    host,
                    key,
                    keyLocation,
                    urlList,
                }),
            })
            indexnowStatus = res.status
            indexnowBody = await res.text().catch(() => "")
        } catch (err: any) {
            indexnowStatus = 0
            indexnowBody = err?.message || "network error"
        }

        // Per IndexNow docs: 200 = OK, 202 = accepted (processing),
        // 400 = bad request, 403 = key not valid, 422 = urls don't match host,
        // 429 = too many requests.
        const ok = indexnowStatus === 200 || indexnowStatus === 202

        const results = urlList.map((url) => ({
            url,
            indexnow: ok ? "success" : "failed",
            // Google ping is gone — we flag it explicitly so the UI can
            // display the real state instead of a fake "success".
            google: "unsupported" as const,
        }))

        return NextResponse.json({
            success: ok,
            message: ok
                ? `تم إرسال ${urlList.length} رابط إلى IndexNow (Bing / Yandex / Seznam / Yep / Naver)`
                : `فشل الإرسال إلى IndexNow (status: ${indexnowStatus}). راجع الرسالة أدناه.`,
            indexnow: {
                status: indexnowStatus,
                body: indexnowBody.slice(0, 500),
                host,
                keyLocation,
                submitted: urlList.length,
            },
            google: {
                supported: false,
                reason: "Google deprecated the sitemap ping endpoint in 2023. Use Google Search Console → URL Inspection → Request Indexing.",
            },
            results,
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "حدث خطأ" },
            { status: 500 }
        )
    }
}

export async function GET() {
    // Helpful diagnostic endpoint — returns config + key location
    const baseUrl = normalizeBaseUrl(
        process.env.NEXT_PUBLIC_SITE_URL || "https://elsayed-mourad.online"
    )
    const key = await getOrCreateIndexNowKey()
    return NextResponse.json({
        endpoint: INDEXNOW_ENDPOINT,
        host: getHost(baseUrl),
        keyLocation: `${baseUrl}/api/indexnow/key`,
        keyPreview: `${key.slice(0, 4)}…${key.slice(-4)}`,
    })
}
