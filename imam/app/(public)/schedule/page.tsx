import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import type { Metadata } from "next"
import { Calendar, ChevronRight, ChevronLeft, CalendarDays, CalendarRange, Clock, MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "الجدول الزمني",
  description: "الجدول الشهري للدروس والمحاضرات والخطب للشيخ السيد مراد",
}

interface ScheduleEvent {
  id: string
  title: string
  description: string | null
  event_type: string
  type: "weekly" | "one_time"
  day_of_week: string | null
  event_date: string | null
  event_time: string | null
  location: string | null
  is_live: boolean
  is_active: boolean
}

// Helper function to get Arabic day name
function getArabicDayName(dayIndex: number): string {
  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
  return days[dayIndex]
}

// Helper to get Arabic month name
function getArabicMonthName(month: number): string {
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ]
  return months[month]
}

// Get event type styles
function getEventTypeStyles(type: string) {
  switch (type) {
    case "fiqh":
      return { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-600" }
    case "seerah":
      return { bg: "bg-orange-50", border: "border-orange-500", text: "text-orange-600" }
    case "friday":
      return { bg: "bg-primary/10", border: "border-primary", text: "text-primary" }
    case "aqeedah":
      return { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-600" }
    default:
      return { bg: "bg-gray-50", border: "border-gray-500", text: "text-gray-600" }
  }
}

// Get event type label
function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    fiqh: "مجلس الفقه",
    seerah: "دروس السيرة",
    friday: "خطبة الجمعة",
    aqeedah: "عقيدة",
    general: "درس عام",
  }
  return labels[type] || "درس"
}

// Get Arabic day name from English
function getDayNameArabic(day: string | null): string {
  if (!day) return ""
  const dayMap: Record<string, string> = {
    saturday: "السبت",
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
  }
  return dayMap[day.toLowerCase()] || day
}

// Format time to 12-hour format
function formatTime12h(time: string | null): string {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? "م" : "ص"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const supabase = createPublicClient()

  // Get current month/year or from params
  const now = new Date()
  const currentMonth = params.month ? Number.parseInt(params.month) : now.getMonth()
  const currentYear = params.year ? Number.parseInt(params.year) : now.getFullYear()

  // Get first and last day of month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

  const { data: oneTimeEvents } = await supabase
    .from("events")
    .select("*")
    .eq("type", "one_time")
    .eq("is_active", true)
    .gte("event_date", firstDayOfMonth.toISOString().split("T")[0])
    .lte("event_date", lastDayOfMonth.toISOString().split("T")[0])
    .order("event_date", { ascending: true })

  const { data: weeklyEvents } = await supabase
    .from("events")
    .select("*")
    .eq("type", "weekly")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  // Generate calendar grid
  const daysInMonth = lastDayOfMonth.getDate()

  // Adjust for Saturday start (0 = Saturday in our calendar)
  let firstDayIndex = firstDayOfMonth.getDay() + 1
  if (firstDayIndex === 7) firstDayIndex = 0

  // Previous month days
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()

  // Create calendar days array
  const calendarDays: Array<{
    day: number
    isCurrentMonth: boolean
    isFriday: boolean
    events: ScheduleEvent[]
  }> = []

  // Add previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isFriday: false,
      events: [],
    })
  }

  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const dayOfWeek = date.getDay()
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    // Get one-time events for this date
    const dayEvents = (oneTimeEvents || []).filter((e) => e.event_date === dateStr)

    calendarDays.push({
      day,
      isCurrentMonth: true,
      isFriday: dayOfWeek === 5,
      events: dayEvents,
    })
  }

  // Add next month days to complete the grid
  const remainingDays = 42 - calendarDays.length
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      isFriday: false,
      events: [],
    })
  }

  // Calculate navigation months
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear 
  return ( <main className="min-h-screen bg-background">
 {/* Header */} <header className="bg-accent-light py-12 relative overflow-hidden">
<div className="absolute -left-10 -top-10 opacity-5 text-primary pointer-events-none select-none">
 <Calendar className="h-72 w-72" />
</div>
<div className="container mx-auto px-4 relative z-10 text-center">
<span className="inline-block px-3 py-1 bg-white text-secondary text-xs rounded-full mb-4 border border-secondary/20">
 تنظيم الوقت </span>
<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
 الجدول الشهري للدروس والمحاضرات </h1>
<p className="text-text-muted max-w-2xl mx-auto text-sm leading-relaxed">
 تابع مواعيد الدروس العلمية والمحاضرات العامة والخطب، وكن على اطلاع دائم بمجالس العلم والذكر. </p>
</div>

 </header>
<div className="container mx-auto px-4 py-12">
 {weeklyEvents && weeklyEvents.length > 0 && ( <div className="mb-12 bg-card rounded-2xl p-6 border border-border">
<h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
 <CalendarRange className="h-5 w-5 text-primary" />
 الجدول الأسبوعي الثابت </h2>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {weeklyEvents.map((item: ScheduleEvent) => ( <div key={item.id}
className="bg-background rounded-xl p-4 border border-border">
<div className="flex items-center gap-2 mb-2">
 <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
 {getDayNameArabic(item.day_of_week)} </span>
<span className="text-xs text-text-muted">
{formatTime12h(item.event_time)}</span>

 {item.is_live && ( <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
<span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse">
</span>

 مباشر </span>

 )} </div>
<h3 className="font-bold text-foreground">
{item.title}</h3>

 {item.location && ( <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
<MapPin className="h-3 w-3" />
 {item.location} </p>

 )} </div>

 ))} </div>
</div>

 )} {/* Month Navigation */} <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
<div className="flex items-center bg-card rounded-xl shadow-sm p-2 border border-border">
 <Link href={`/schedule?month=${prevMonth}&year=${prevYear}`}
className="p-2 hover:bg-muted rounded-lg text-text-muted transition" >
<ChevronRight className="h-5 w-5" />
 </Link>
<h2 className="px-6 font-bold text-lg text-primary">
 {getArabicMonthName(currentMonth)} {currentYear} </h2>
<Link href={`/schedule?month=${nextMonth}&year=${nextYear}`}
className="p-2 hover:bg-muted rounded-lg text-text-muted transition" >
 <ChevronLeft className="h-5 w-5" />
</Link>
</div>
<div className="flex gap-2">
 <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm shadow-sm flex items-center gap-2">
<CalendarDays className="h-4 w-4" />
 شهر </button>
<button className="px-4 py-2 bg-card text-text-muted border border-border hover:bg-muted rounded-lg text-sm transition flex items-center gap-2">
 <CalendarRange className="h-4 w-4" />
 أسبوع </button>
</div>

 </div>

 {/* Calendar Grid */} <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
 {/* Day Headers */} <div className="grid grid-cols-7 border-b border-border bg-muted/50">
 {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => ( <div key={dayIndex}
className={`py-4 text-center text-sm font-bold ${dayIndex === 6 ? "text-primary" : "text-text-muted"}`} >
 {getArabicDayName(dayIndex)} </div>

 ))} </div>

 {/* Calendar Days */} <div className="grid grid-cols-7 auto-rows-fr bg-border gap-px">
 {calendarDays.map((calDay, index) => ( <div key={index}
className={`min-h-[140px] p-2 relative group transition ${ !calDay.isCurrentMonth ? "bg-card text-text-muted/30" : calDay.isFriday ? "bg-green-50/50 hover:bg-green-50" : "bg-card hover:bg-accent-light" }`} >
<span className={`text-sm ${ calDay.isFriday && calDay.isCurrentMonth ? "font-bold text-primary" : calDay.isCurrentMonth ? "font-medium text-foreground" : "" }`} >
 {calDay.day} </span>

 {/* Events */} <div className="mt-2 space-y-1">
 {calDay.events.map((event) => { const styles = getEventTypeStyles(event.event_type) 
  return ( <div key={event.id}
className={`p-2 rounded-lg ${styles.bg} border-r-2 ${styles.border} cursor-pointer hover:shadow-md transition relative overflow-hidden`} >
<div className={`text-[10px] ${styles.text} font-bold mb-1`}>
 {getEventTypeLabel(event.event_type)} </div>
<div className="text-xs text-foreground font-medium line-clamp-2">
 {event.title} </div>

 {event.event_time && ( <div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted">
<Clock className="h-2.5 w-2.5" />
 {formatTime12h(event.event_time)} </div>

 )} {event.location && ( <div className="flex items-center gap-1 mt-0.5 text-[10px] text-text-muted">
<MapPin className="h-2.5 w-2.5" />
 {event.location} </div>

 )} </div>

 ) })} </div>
</div>

 ))} </div>
</div>

 {/* Legend */} <div className="mt-8 flex flex-wrap justify-center gap-6">
<div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-blue-500 rounded-full">
</div>
<span className="text-sm text-text-muted">
فقه</span>
</div>

 <div className="flex items-center gap-2">
<div className="w-3 h-3 bg-orange-500 rounded-full">
</div>
<span className="text-sm text-text-muted">
سيرة</span>
</div>

 <div className="flex items-center gap-2">
<div className="w-3 h-3 bg-primary rounded-full">
</div>
<span className="text-sm text-text-muted">
خطبة الجمعة</span>
</div>

 <div className="flex items-center gap-2">
<div className="w-3 h-3 bg-purple-500 rounded-full">
</div>
<span className="text-sm text-text-muted">
عقيدة</span>
</div>

 </div>
</div>

 </main>

 ) }
