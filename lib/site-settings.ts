import { createPublicClient } from "@/lib/supabase/public"
import { unstable_cache } from "next/cache"

export const getSiteSettings = unstable_cache(
    async () => {
        try {
            const supabase = createPublicClient()
            const { data } = await supabase.from("site_settings").select("*")
            if (!data) {
                return {}
            }

            const settings: Record<string, string> = {}
            data.forEach((item: any) => {
                const key = item.key || item.setting_key
                const value = item.value || item.setting_value
                if (key && value) {
                    settings[key] = value
                }
            })
            return settings
        } catch {
            return {}
        }
    },
    ["site_settings"],
    // Tagged so that `revalidateTag("seo-settings")` from /api/revalidate
    // instantly busts this cache when the admin hits "save".
    { revalidate: 300, tags: ["seo-settings", "site-settings"] }
)
