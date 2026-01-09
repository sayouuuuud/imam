"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Plus, Repeat, CalendarCheck, Radio, Edit, Trash2, Clock, MapPin, CalendarDays, Loader2 } from "lucide-react"

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
  created_at: string
}

const eventTypes = [
  { value: "fiqh", label: "فقه", color: "bg-blue-500" },
  { value: "seerah", label: "سيرة", color: "bg-yellow-500" },
  { value: "friday", label: "خطبة الجمعة", color: "bg-green-500" },
  { value: "aqeedah", label: "عقيدة", color: "bg-purple-500" },
  { value: "general", label: "عام", color: "bg-muted" },
]

const daysOfWeek = [
  { value: "sunday", label: "الأحد" },
  { value: "monday", label: "الاثنين" },
  { value: "tuesday", label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday", label: "الخميس" },
  { value: "friday", label: "الجمعة" },
  { value: "saturday", label: "السبت" },
]

export default function AdminSchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterType, setFilterType] = useState<"all" | "weekly" | "one_time">("all")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "fiqh",
    type: "weekly" as "weekly" | "one_time",
    day_of_week: "friday",
    event_date: "",
    event_time: "",
    location: "",
    is_live: false,
    is_active: true,
  })

  const supabase = createClient()

  const fetchEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("schedule_events")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setEvents(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        type: formData.type,
        day_of_week: formData.type === "weekly" ? formData.day_of_week : null,
        event_date: formData.type === "one_time" ? formData.event_date : null,
        event_time: formData.event_time || null,
        location: formData.location || null,
        is_live: formData.is_live,
        is_active: formData.is_active,
      }

      if (editingEvent) {
        const { error } = await supabase
          .from("schedule_events")
          .update({
            ...eventData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEvent.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("schedule_events")
          .insert(eventData)

        if (error) throw error
      }

      setIsModalOpen(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error("Error saving event:", error)
      alert("حدث خطأ أثناء الحفظ")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحدث؟")) return

    const { error } = await supabase
      .from("schedule_events")
      .delete()
      .eq("id", id)

    if (!error) {
      fetchEvents()
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase
      .from("schedule_events")
      .update({ is_active: !currentStatus })
      .eq("id", id)
    fetchEvents()
  }

  const openEditModal = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      type: event.type || "weekly",
      day_of_week: event.day_of_week || "friday",
      event_date: event.event_date || "",
      event_time: event.event_time || "",
      location: event.location || "",
      is_live: event.is_live,
      is_active: event.is_active,
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_type: "fiqh",
      type: "weekly",
      day_of_week: "friday",
      event_date: "",
      event_time: "",
      location: "",
      is_live: false,
      is_active: true,
    })
    setEditingEvent(null)
  }

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find((t) => t.value === type) || eventTypes[4]
  }

  const getDayLabel = (day: string | null) => {
    return daysOfWeek.find((d) => d.value === day)?.label || day
  }

  const formatTime12h = (time: string | null) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "م" : "ص"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const filteredEvents = events.filter((event) => {
    if (filterType === "all") return true
    return event.type === filterType
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            إدارة الجدول الزمني
          </h1>
          <p className="text-text-muted mt-2">
            إدارة الأحداث الأسبوعية والمناسبات الخاصة
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary-hover text-white"
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة حدث جديد
            </Button>
          </DialogTrigger>

          <DialogContent
            className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary">
                {editingEvent ? "تعديل الحدث" : "إضافة حدث جديد"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان الحدث *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))}
                    placeholder="مثال: شرح كتاب منهاج الطالبين"
                    className="bg-muted"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>نوع الحدث *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        event_type: value,
                      }))}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>تصنيف الحدث *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "weekly" | "one_time") =>
                    setFormData((prev) => ({
                      ...prev,
                      type: value,
                    }))}
                >
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">أسبوعي متكرر</SelectItem>
                    <SelectItem value="one_time">مناسبة خاصة (مرة واحدة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "weekly" ? (
                <div className="space-y-2">
                  <Label>يوم الأسبوع *</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        day_of_week: value,
                      }))}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>التاريخ *</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        event_date: e.target.value,
                      }))}
                    className="bg-muted"
                    required={formData.type === "one_time"}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الوقت</Label>
                  <Input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        event_time: e.target.value,
                      }))}
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>المكان</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))}
                    placeholder="مثال: مسجد الرحمن - مدينة نصر"
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))}
                  placeholder="وصف مختصر للحدث..."
                  className="bg-muted resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_live}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_live: checked,
                      }))}
                  />
                  <Label>بث مباشر</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: checked,
                      }))}
                  />
                  <Label>مفعّل</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : editingEvent ? (
                    "تحديث"
                  ) : (
                    "إضافة"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">إجمالي الأحداث</p>
            <p className="text-2xl font-bold text-foreground">{events.length}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Repeat className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">أسبوعية</p>
            <p className="text-2xl font-bold text-blue-600">
              {events.filter((e) => e.type === "weekly").length}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">مناسبات خاصة</p>
            <p className="text-2xl font-bold text-orange-600">
              {events.filter((e) => e.type === "one_time").length}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">بث مباشر</p>
            <p className="text-2xl font-bold text-red-600">
              {events.filter((e) => e.is_live).length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          onClick={() => setFilterType("all")}
          className={filterType === "all" ? "bg-primary text-white" : ""}
        >
          الكل
        </Button>
        <Button
          variant={filterType === "weekly" ? "default" : "outline"}
          onClick={() => setFilterType("weekly")}
          className={filterType === "weekly" ? "bg-primary text-white" : ""}
        >
          أسبوعية
        </Button>
        <Button
          variant={filterType === "one_time" ? "default" : "outline"}
          onClick={() => setFilterType("one_time")}
          className={filterType === "one_time" ? "bg-primary text-white" : ""}
        >
          مناسبات خاصة
        </Button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12 text-text-muted flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          جاري التحميل...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Calendar className="h-16 w-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-muted">لا توجد أحداث في الجدول</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => {
            const typeInfo = getEventTypeInfo(event.event_type)
            return (
              <div
                key={event.id}
                className={`bg-card rounded-xl p-4 border border-border flex flex-col md:flex-row md:items-center gap-4 ${
                  !event.is_active ? "opacity-50" : ""
                }`}
              >
                <div className={`w-12 h-12 rounded-lg ${typeInfo.color} flex items-center justify-center text-white`}>
                  <CalendarDays className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-text-muted">
                      {typeInfo.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        event.type === "weekly"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {event.type === "weekly" ? "أسبوعي" : "مناسبة خاصة"}
                    </span>

                    {event.is_live && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                        مباشر
                      </span>
                    )}

                    {!event.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        معطّل
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-foreground truncate">
                    {event.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mt-1">
                    {event.type === "weekly" && event.day_of_week && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        كل {getDayLabel(event.day_of_week)}
                      </span>
                    )}

                    {event.type === "one_time" && event.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.event_date).toLocaleDateString("ar-EG")}
                      </span>
                    )}

                    {event.event_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime12h(event.event_time)}
                      </span>
                    )}

                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={event.is_active}
                    onCheckedChange={() =>
                      toggleActive(event.id, event.is_active)
                    }
                  />
                  <button
                    onClick={() => openEditModal(event)}
                    className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-white transition"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}