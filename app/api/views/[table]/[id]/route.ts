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

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY غير مضبوط" }, { status: 500 })
  }

  const supabase = createServiceClient(supabaseUrl, serviceKey)

  // Atomic increment via RPC — avoids the read-then-write race of
  // `update({ views_count: current + 1 })` under concurrent requests.
  const { error } = await supabase.rpc("increment_views", { p_table: table, p_id: id })

  if (error) {
    return NextResponse.json({ error: "تعذر تحديث عدد المشاهدات" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
