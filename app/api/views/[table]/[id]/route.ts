import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Allow-list of content tables that have a `views_count` column. This route
// only ever executes the `increment_views` RPC (see migration
// add_increment_views_rpc), never a raw update, so there is no injection
// surface even though the table name is user-supplied.
const ALLOWED_TABLES = new Set(["sermons", "articles", "books", "lessons", "media"])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(_request: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  const { table, id } = await params

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "جدول غير مسموح به" }, { status: 400 })
  }

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // A view counter is telemetry, not part of the page contract. Every failure
  // path below returns 200 with `counted: false` so a missing env var, a
  // missing RPC, or a Supabase outage can never surface as a red error in the
  // visitor's console or pollute error monitoring. Details go to server logs
  // only, where they are actionable.
  if (!serviceKey || !supabaseUrl) {
    console.error("[views] SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set")
    return NextResponse.json({ ok: true, counted: false })
  }

  try {
    const supabase = createServiceClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    // Atomic increment via RPC — avoids the read-then-write race of
    // `update({ views_count: current + 1 })` under concurrent requests.
    const { error } = await supabase.rpc("increment_views", { p_table: table, p_id: id })

    if (error) {
      console.error(`[views] increment_views failed for ${table}/${id}:`, error.message)
      return NextResponse.json({ ok: true, counted: false })
    }
  } catch (err) {
    console.error(`[views] unexpected failure for ${table}/${id}:`, err)
    return NextResponse.json({ ok: true, counted: false })
  }

  return NextResponse.json({ ok: true, counted: true })
}
