import { createBrowserClient } from "@supabase/ssr"

/**
 * Public/anonymous Supabase client for client-side reads that do NOT require
 * authentication (e.g. public pages, static content).
 *
 * Using this client avoids multiple GoTrueClient instances warning
 * and provides consistent behavior with other SSR clients.
 */
export function createPublicClient() {
  return createBrowserClient(
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
