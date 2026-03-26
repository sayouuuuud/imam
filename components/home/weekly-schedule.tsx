import Link from "next/link"
import { Calendar, Clock, CalendarOff, ChevronLeft, CalendarDays, ArrowLeft } from "lucide-react"

interface ScheduleItem {
  id: string
  day_name: string
  time_text?: string
  time?: string
  title: string
  description: string | null
  is_active: boolean
  sort_order: number
  event_date?: string | null
  event_type?: string | null
}

interface WeeklyScheduleProps {
  schedule: ScheduleItem[]
}

const getEventTypeLabel = (type: string | null | undefined) => {
  switch (type?.toLowerCase()) {
    case "lesson": return "درس"
    case "khutba": return "خطبة"
    case "lecture": return "محاضرة"
    case "event": return "فعالية"
    case "fiqh": return "فقه"
    case "seerah": return "سيرة"
    case "aqeedah": return "عقيدة"
    case "tafsir": return "تفسير"
    case "hadith": return "حديث"
    case "arabic": return "لغة عربية"
    case "quran": return "قرآن"
    case "tajweed": return "تجويد"
    default: return type || ""
  }
}

export function WeeklySchedule({ schedule }: WeeklyScheduleProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary p-2.5 rounded-xl border border-primary/20">
            <Calendar className="text-xl w-5 h-5" />
          </span>
          <h3 className="text-2xl font-bold font-serif text-foreground" >جدول الدروس الأسبوعية</h3>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted bg-muted/50 border border-border/50 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Clock className="text-[12px] text-secondary w-3 h-3" />
          بتوقيت القاهرة
        </span>
      </div>

      {/* Card with refined design */}
      <div className="bg-card/50 dark:bg-card/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-border/60 dark:border-border/30 hover:border-primary/30 shadow hover:shadow-lg transition-all duration-500 space-y-4 sm:space-y-5">
        {schedule.length === 0 ? (
          <div className="text-center py-12">
            <CalendarOff className="text-5xl w-12 h-12 text-text-muted/30 mb-4" />
            <p className="text-text-muted">لا يوجد جدول حالياً</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {schedule.map((item, index) => (
              <div key={item.id} className="group relative">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/30 dark:hover:bg-white/5 transition-all duration-300">
                  {/* Day & Time Box */}
                  <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 dark:border-primary/30 rounded-xl p-2 sm:p-3 text-center min-w-[70px] sm:min-w-[85px] group-hover:border-primary/50 transition-all duration-300">
                    <span className="block text-[10px] text-primary/80 font-bold uppercase tracking-tight">{item.day_name}</span>
                    <span className="block text-lg sm:text-xl font-black text-primary mt-0.5">{item.time_text || item.time || ""}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                      {item.event_date && (
                        <span className="flex-shrink-0 text-[10px] font-medium text-text-muted bg-muted px-2 py-0.5 rounded-md">
                          {formatDate(item.event_date)}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-text-muted mt-1.5 line-clamp-2 leading-relaxed opacity-80">{item.description}</p>
                    )}
                    {item.event_type && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-secondary font-bold bg-secondary/10 dark:bg-secondary/20 px-2 py-0.5 rounded-md mt-2.5 border border-secondary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        {getEventTypeLabel(item.event_type)}
                      </span>
                    )}
                  </div>

                  {/* Arrow - Subtle */}
                  <div className="hidden sm:flex items-center self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronLeft className="text-primary/40 w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/schedule"
            className="flex items-center justify-center gap-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 py-3 rounded-xl transition-all duration-300"
          >
            <CalendarDays className="w-4 h-4" />
            عرض الجدول الشهري الكامل
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  )
}

