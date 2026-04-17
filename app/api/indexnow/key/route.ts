import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Serves the IndexNow key as plain text.
 * IndexNow (api.indexnow.org) fetches this URL to verify that the site owner
 * controls the domain (via `keyLocation` in the submission payload).
 *
 * Response MUST be:
 *  - Content-Type: text/plain
 *  - Body: the exact key string (no whitespace, no quotes, no JSON)
 */
export async function GET() {
    const envKey = process.env.INDEXNOW_KEY
    let key: string | null =
        envKey && /^[a-f0-9]{8,128}$/i.test(envKey) ? envKey : null

    if (!key) {
        try {
            const supabase = createPublicClient()
            const { data } = await supabase
                .from("site_settings")
                .select("value")
                .eq("key", "indexnow_key")
                .maybeSingle()

            if (data?.value && /^[a-f0-9]{8,128}$/i.test(data.value)) {
                key = data.value as string
            } else {
                // Lazily create one so the verification endpoint always works.
                const generated = randomBytes(16).toString("hex")
                await supabase.from("site_settings").upsert(
                    {
                        key: "indexnow_key",
                        value: generated,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "key" }
                )
                key = generated
            }
        } catch {
            // As a last resort so IndexNow can still verify us in the same run
            key = randomBytes(16).toString("hex")
        }
    }

    return new NextResponse(key, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
    })
}
