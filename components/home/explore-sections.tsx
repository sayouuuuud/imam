import Link from "next/link"
import { MonitorPlay, BookOpen, GraduationCap, FileText, Mic, CalendarDays, ArrowLeft, Compass } from "lucide-react"

const sections = [
    {
        href: "/khutba",
        title: "الخطب المنبرية",
        description: "خطب الجمعة والأعياد والمناسبات، مؤرشفة صوتياً ونصياً للرجوع إليها في أي وقت.",
        icon: Mic,
    },
    {
        href: "/dars",
        title: "الدروس العلمية",
        description: "سلاسل متكاملة في الفقه والعقيدة والسيرة، مرتبة درساً بعد درس.",
        icon: GraduationCap,
    },
    {
        href: "/articles",
        title: "المقالات والبحوث",
        description: "كتابات دورية تناقش القضايا المعاصرة برؤية شرعية مؤصلة.",
        icon: FileText,
    },
    {
        href: "/videos",
        title: "المرئيات",
        description: "مقاطع مرئية قصيرة ولقاءات مصوّرة من الدروس والمحاضرات.",
        icon: MonitorPlay,
    },
    {
        href: "/books",
        title: "المكتبة المقروءة",
        description: "مؤلفات الشيخ وكتبه متاحة للقراءة والتحميل بصيغة PDF.",
        icon: BookOpen,
    },
    {
        href: "/schedule",
        title: "المواعيد والجدول",
        description: "مواعيد الدروس الأسبوعية والفعاليات القادمة في مكان واحد.",
        icon: CalendarDays,
    },
]

export function ExploreSections() {
    return (
        <section className="py-16 lg:py-24 relative overflow-hidden border-y border-border/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="flex items-start gap-4">
                        <span className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Compass className="h-6 w-6" />
                        </span>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight">
                                استكشف العلم أكثر
                            </h2>
                            <p className="text-muted-foreground mt-2 max-w-xl text-pretty">
                                كل أقسام الموقع مرتبة أمامك، اختر بابك وابدأ الطلب.
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:block h-px flex-1 bg-gradient-to-l from-border to-transparent mb-3" />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sections.map((section) => {
                        const Icon = section.icon
                        return (
                            <Link
                                key={section.href}
                                href={section.href}
                                className="group relative flex flex-col bg-card rounded-2xl p-6 border border-border shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                            >
                                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-primary via-secondary to-transparent scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-500" />

                                <span className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-primary mb-5 transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                                    <Icon className="h-6 w-6" />
                                </span>

                                <h3 className="text-xl font-bold font-serif text-card-foreground mb-2 group-hover:text-primary transition-colors">
                                    {section.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                    {section.description}
                                </p>

                                <span className="mt-auto inline-flex items-center gap-2 text-xs font-bold text-primary">
                                    تصفح القسم
                                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
