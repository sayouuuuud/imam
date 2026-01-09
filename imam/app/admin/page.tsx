import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ViewsChart } from "@/components/admin/views-chart";
import {
  PlusCircle,
  Mic,
  GraduationCap,
  FileText,
  BookOpen,
  Users,
  Video,
  Settings,
  User,
  ChevronLeft,
  Eye,
  TrendingUp,
  Calendar,
} from "lucide-react";

const quickActions = [
  { label: "إضافة خطبة", href: "/admin/khutba", icon: PlusCircle },
  { label: "إضافة درس", href: "/admin/dars", icon: PlusCircle },
  { label: "إضافة مقال", href: "/admin/articles", icon: PlusCircle },
  { label: "إضافة كتاب", href: "/admin/books", icon: PlusCircle },
];

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Server-side guard (in addition to client-side AuthProvider checks)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch real stats from database
  const [
    { count: sermonsCount },
    { count: lessonsCount },
    { count: articlesCount },
    { count: booksCount },
    { count: subscribersCount },
    { count: videosCount },
    { data: recentSermons },
    { data: recentLessons },
    { data: recentArticles },
    { data: analyticsData },
  ] = await Promise.all([
    supabase.from("sermons").select("*", { count: "exact" }),
    supabase.from("lessons").select("*", { count: "exact" }),
    supabase.from("articles").select("*", { count: "exact" }),
    supabase.from("books").select("*", { count: "exact" }),
    supabase.from("subscribers").select("*", { count: "exact" }),
    supabase.from("media").select("*", { count: "exact" }),
    supabase
      .from("sermons")
      .select("id, title, publish_status, created_at, views_count")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("lessons")
      .select("id, title, publish_status, created_at, views_count")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("articles")
      .select("id, title, publish_status, created_at, views")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("site_analytics")
      .select("*")
      .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("date", { ascending: true }),
  ]);

  // Calculate total views
  const totalViews = (analyticsData || []).reduce((sum, day) => sum + (day.views_count || 0), 0);

  const stats = [
    {
      label: "الخطب",
      value: sermonsCount?.toString() || "0",
      icon: Mic,
      color: "bg-blue-500",
      href: "/admin/khutba",
    },
    {
      label: "الدروس",
      value: lessonsCount?.toString() || "0",
      icon: GraduationCap,
      color: "bg-green-500",
      href: "/admin/dars",
    },
    {
      label: "المقالات",
      value: articlesCount?.toString() || "0",
      icon: FileText,
      color: "bg-amber-500",
      href: "/admin/articles",
    },
    {
      label: "الكتب",
      value: booksCount?.toString() || "0",
      icon: BookOpen,
      color: "bg-purple-500",
      href: "/admin/books",
    },
    {
      label: "المرئيات",
      value: videosCount?.toString() || "0",
      icon: Video,
      color: "bg-red-500",
      href: "/admin/videos",
    },
    {
      label: "المشتركين",
      value: subscribersCount?.toString() || "0",
      icon: Users,
      color: "bg-teal-500",
      href: "/admin/subscribers",
    },
  ];

  // Combine recent items
  const recentItems = [
    ...(recentSermons || []).map((s: any) => ({ ...s, type: "خطبة", icon: Mic, views: s.views_count || 0 })),
    ...(recentLessons || []).map((l: any) => ({ ...l, type: "درس", icon: GraduationCap, views: l.views_count || 0 })),
    ...(recentArticles || []).map((a: any) => ({ ...a, type: "مقال", icon: FileText, views: a.views || 0 })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const quickLinks = [
    { label: "إدارة الكتب", href: "/admin/books", icon: BookOpen },
    { label: "إدارة المرئيات", href: "/admin/videos", icon: Video },
    { label: "الجدول الزمني", href: "/admin/schedule", icon: Calendar },
    { label: "إعدادات الموقع", href: "/admin/settings", icon: Settings },
    { label: "الأمان والملف الشخصي", href: "/admin/security", icon: User },
  ]; 
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-primary to-primary-hover rounded-xl p-6 text-white relative overflow-hidden">
<div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
<div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">مرحباً بك في لوحة التحكم</h2>
<p className="text-green-100 text-sm mb-4">إدارة محتوى موقع الشيخ السيد مراد بكل سهولة</p>
<div className="flex flex-wrap gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
                >
<Icon className="h-5 w-5" />
                  {action.label}
                </Link>
              );
            })}
          </div>
</div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
<div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
<Eye className="h-6 w-6 text-blue-600" />
          </div>
<div>
            <p className="text-2xl font-bold text-foreground">
              {totalViews.toLocaleString("ar-EG")}
            </p>
<p className="text-sm text-text-muted">زيارة (30 يوم)</p>
</div>
        </div>
<div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
<TrendingUp className="h-6 w-6 text-green-600" />
          </div>
<div>
            <p className="text-2xl font-bold text-foreground">
              {((sermonsCount || 0) + (lessonsCount || 0) + (articlesCount || 0)).toLocaleString("ar-EG")}
            </p>
<p className="text-sm text-text-muted">محتوى منشور</p>
</div>
        </div>
<div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
<BookOpen className="h-6 w-6 text-purple-600" />
          </div>
<div>
            <p className="text-2xl font-bold text-foreground">
              {(booksCount || 0).toLocaleString("ar-EG")}
            </p>
<p className="text-sm text-text-muted">كتاب منشور</p>
</div>
        </div>
<div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
<Users className="h-6 w-6 text-teal-600" />
          </div>
<div>
            <p className="text-2xl font-bold text-foreground">
              {(subscribersCount || 0).toLocaleString("ar-EG")}
            </p>
<p className="text-sm text-text-muted">مشترك</p>
</div>
        </div>
</div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-surface rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
            >
<div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
<Icon className="h-5 w-5" />
                </div>
</div>

              <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
<p className="text-sm text-text-muted">{stat.label}</p>
</Link>
          );
        })}
      </div>

      {/* Views Chart */}
      <ViewsChart data={analyticsData || []} />
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Items */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border">
<div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground">آخر المحتويات</h3>
</div>

          <div className="divide-y divide-border">
            {recentItems.length === 0 ? (
              <div className="px-6 py-8 text-center text-text-muted">لا توجد محتويات بعد</div>
            ) : (
              recentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="px-6 py-4 flex items-center justify-between hover:bg-background transition-colors"
                  >
<div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
<Icon className="h-5 w-5 text-text-muted" />
                      </div>
<div>
                        <h4 className="font-medium text-foreground text-sm line-clamp-1">
                          {item.title}
                        </h4>
<p className="text-xs text-text-muted">
                          {item.type} • {new Date(item.created_at).toLocaleDateString("ar-EG")}
                        </p>
</div>
                    </div>
<div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted flex items-center gap-1">
<Eye className="h-3 w-3" />
                        {item.views}
                      </span>
<span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.publish_status === "published"
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {item.publish_status === "published" ? "منشور" : "مسودة"}
                      </span>
</div>
                  </div>
                );
              })
            )}
          </div>
</div>

        {/* Quick Links */}
        <div className="space-y-6">
<div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">روابط سريعة</h3>
<div className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 p-2 rounded-lg text-text-muted hover:text-foreground hover:bg-background transition-colors"
                  >
<Icon className="h-5 w-5" />
                    <span className="text-sm">{link.label}</span>
<ChevronLeft className="h-4 w-4 mr-auto" />
                  </Link>
                );
              })}
            </div>
</div>
        </div>
</div>
    </div>
  );
}

