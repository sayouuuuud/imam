import Link from "next/link"

const sections = [
  {
    title: "الدروس العلمية",
    description: "سلاسل علمية متكاملة في الفقه والعقيدة والسيرة.",
    icon: "school",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-700",
    href: "/dars",
  },
  {
    title: "المقالات والبحوث",
    description: "كتابات دورية تناقش القضايا المعاصرة برؤية شرعية.",
    icon: "article",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-700",
    href: "/articles",
  },
  {
    title: "المكتبة المقروءة",
    description: "مؤلفات الشيخ وكتب مختارة للتحميل بصيغة PDF.",
    icon: "library_books",
    bgColor: "bg-gray-100",
    iconColor: "text-gray-800",
    href: "/books",
  },
  {
    title: "المرئيات",
    description: "مقاطع مرئية قصيرة ومحاضرات مصورة بجودة عالية.",
    icon: "play_circle_filled",
    bgColor: "bg-red-50",
    iconColor: "text-red-700",
    href: "/videos",
  },
]

export function ExploreSections() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
<div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
<div className="inline-block p-3 bg-surface rounded-full shadow-md mb-4 text-primary">
            <span className="material-icons-outlined text-3xl">menu_book</span>
</div>
          <h2 className="text-4xl font-bold mb-4 font-serif">استكشف العلم أكثر</h2>
<p className="text-text-muted max-w-xl mx-auto">تصفح أقسام الموقع المتنوعة للوصول إلى المحتوى.</p>
</div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<Link
            href="/khutba"
            className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden group row-span-2 flex flex-col justify-end min-h-[300px] hover:bg-primary-hover transition-colors"
          >
            <div className="absolute top-0 left-0 p-40 bg-white opacity-5 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2">
</div>
<div className="relative z-10">
<div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <span className="material-icons-outlined text-2xl">record_voice_over</span>
</div>
              <h3 className="text-2xl font-bold mb-2 font-serif">الخطب المنبرية</h3>
<p className="text-white/80 mb-4">خطب الجمعة والأعياد والمناسبات الدينية مع إمكانية الاستماع والتحميل.</p>
<span className="inline-flex items-center gap-2 text-sm font-bold bg-white/20 px-4 py-2 rounded-lg group-hover:bg-white/30 transition-colors">
                استمع الآن
                <span className="material-icons-outlined text-sm rtl-flip">arrow_forward</span>
</span>
            </div>
</Link>

          {sections.map((section, index) => (
            <Link
              key={index}
href={section.href}
className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group"
            >
<div className={`w-12 h-12 ${section.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                <span className={`material-icons-outlined text-2xl ${section.iconColor}`}>{section.icon}</span>
</div>
              <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors font-serif">
                {section.title}
              </h3>
<p className="text-text-muted text-sm">{section.description}</p>
</Link>
          ))}
        </div>
</div>
    </section>
  )
}
