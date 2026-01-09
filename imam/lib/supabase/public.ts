import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Public/anonymous Supabase client for server-side reads that do NOT require
 * request cookies (e.g. public pages, SSG/ISR, generateStaticParams).
 *
 * Using this client avoids Next.js "cookies() outside request scope" errors
 * and helps pages stay cacheable.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}
