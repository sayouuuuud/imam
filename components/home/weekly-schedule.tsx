import Link from "next/link"

interface ScheduleItem {
  id: string
  day_name: string
  time_text?: string
  time?: string
  title: string
  description: string | null
  is_active: boolean
  sort_order: number
}

interface WeeklyScheduleProps {
  schedule: ScheduleItem[]
}

export function WeeklySchedule({ schedule }: WeeklyScheduleProps) {
 
  return ( <div>
<div className="flex justify-between items-center mb-6">
 <div className="flex items-center gap-3">
<span className="bg-yellow-100 text-yellow-600 p-2.5 rounded-xl shadow-sm">
 <span className="material-icons-outlined text-xl">
calendar_today</span>
</span>

 <h3 className="text-2xl font-bold font-serif text-foreground">
جدول الدروس الأسبوعية</h3>
</div>

 <span className="text-xs text-text-muted bg-muted px-3 py-1.5 rounded-full flex items-center gap-1">
<span className="material-icons-outlined text-xs">
schedule</span>

 بتوقيت القاهرة </span>
</div>

 <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm space-y-5">
 {schedule.length === 0 ? ( <div className="text-center py-12">
<span className="material-icons-outlined text-5xl text-text-muted mb-4">
event_busy</span>
<p className="text-text-muted">
لا يوجد جدول حالياً</p>
</div>

 ) : ( schedule.map((item, index) => ( <div key={item.id}>
 {index > 0 && <div className="border-t border-border mb-5" />
} <div className="flex items-start gap-4 group">
<div className="bg-card border border-border rounded-xl p-3 text-center min-w-[80px] shadow-sm group-hover:border-primary/30 transition-colors">
 <span className="block text-xs text-text-muted font-medium">
{item.day_name}</span>
<span className="block text-xl font-bold text-primary mt-1">
{item.time_text || item.time || ""}</span>
</div>

 <div className="flex-1">
<h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
 {item.title} </h4>

 {item.description && ( <p className="text-sm text-text-muted mt-1 line-clamp-2">
 {item.description} </p>

 )} </div>
<div className="opacity-0 group-hover:opacity-100 transition-opacity">
 <span className="material-icons-outlined text-primary text-sm">
arrow_back</span>
</div>

 </div>
</div>

 )) )} <div className="pt-4 border-t border-border">
<Link href="/schedule" className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-primary transition-colors py-2 rounded-lg hover:bg-muted" >
 <span className="material-icons-outlined text-sm">
calendar_month</span>

 عرض الجدول الشهري الكامل <span className="material-icons-outlined text-sm rtl-flip">
arrow_back</span>
</Link>

 </div>
</div>

 </div>

 ) }
