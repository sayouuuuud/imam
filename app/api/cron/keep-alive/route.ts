import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force Next.js to not cache this route so the request actually hits the database every time
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    console.log('[CRON] Executing database keep-alive ping...')

    // 1. Hit the Supabase Auth API
    await supabase.auth.getSession()

    // 2. Hit the Supabase PostgREST API (Data API)
    // We send a request to a non-existent table just to trigger API activity.
    // Errors are expected if the table doesn't exist, but the HTTP request 
    // will successfully register as activity in Supabase, keeping the project awake!
    await supabase.from('_dummy_keep_alive_ping').select('*').limit(1).catch(() => null)

    console.log('[CRON] Database ping successful!')

    return NextResponse.json({
      success: true,
      message: 'Database keep-alive ping successful.',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[CRON] Database ping failed:', error)
    return NextResponse.json(
      { success: false, error: 'Database ping failed.' },
      { status: 500 }
    )
  }
}
