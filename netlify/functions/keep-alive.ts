import type { Config } from "@netlify/functions"
import { createClient } from "@supabase/supabase-js"

export default async (req: Request) => {
  console.log("Running native Netlify scheduled Supabase keep-alive...")
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("Missing Supabase environment variables.")
    return new Response("Missing env vars", { status: 500 })
  }

  try {
    // إنشاء كلاينت للتواصل مع Supabase لمرة واحدة دون حفظ الجلسة
    const supabase = createClient(url, key, { auth: { persistSession: false } })
    
    // إرسال طلب إلى الـ Auth API لضمان تسجيل نشاط
    await supabase.auth.getSession()

    // إرسال طلب إلى الـ Data API
    await supabase.from('_dummy_keep_alive').select('*').limit(1).catch(() => null)

    console.log("Keep-alive successful!")
    
    return new Response("Keep-alive successful", { status: 200 })
  } catch (error) {
    console.error("Keep-alive failed:", error)
    return new Response("Error executing keep-alive", { status: 500 })
  }
}

export const config: Config = {
  // هذا الإعداد يخبر Netlify بتشغيل الوظيفة يومياً
  schedule: "@daily"
}
