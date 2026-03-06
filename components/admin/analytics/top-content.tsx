import { useState, useEffect } from "react"
import { Eye, Calendar, Filter, Loader2 } from "lucide-react"

interface TopContentProps {
    initialData: any[]
}

export function TopContent({ initialData }: TopContentProps) {
    const [period, setPeriod] = useState("week") // week, month, year
    const [data, setData] = useState(initialData)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Skip first render if it's the default period and we have initial data
        if (period === "week" && data === initialData) return;

        const fetchData = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/analytics/top-content?period=${period}`)
                if (response.ok) {
                    const newData = await response.json()
                    setData(newData)
                }
            } catch (error) {
                console.error("Failed to fetch top content:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [period])

    // Helper to format type
    const formatType = (type: string) => {
        switch (type) {
            case 'khutba': return 'خطبة';
            case 'dars': return 'درس';
            case 'book': return 'كتاب';
            case 'article': return 'مقال';
            default: return 'صفحة';
        }
    }

    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Filter className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-foreground">المحتوى الأكثر مشاهدة</h3>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </div>
                </div>

                <div className="flex bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setPeriod("week")}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === "week"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-text-muted hover:text-foreground disabled:opacity-50"
                            }`}
                    >
                        أسبوع
                    </button>
                    <button
                        onClick={() => setPeriod("month")}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === "month"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-text-muted hover:text-foreground disabled:opacity-50"
                            }`}
                    >
                        شهر
                    </button>
                    <button
                        onClick={() => setPeriod("year")}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === "year"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-text-muted hover:text-foreground disabled:opacity-50"
                            }`}
                    >
                        سنة
                    </button>
                </div>
            </div>

            <div className={`overflow-x-auto transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-text-muted">
                        <tr>
                            <th className="px-4 py-3 text-right font-medium">العنوان</th>
                            <th className="px-4 py-3 text-right font-medium">النوع</th>
                            <th className="px-4 py-3 text-right font-medium">المشاهدات</th>
                            <th className="px-4 py-3 text-right font-medium">تاريخ النشر</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data && data.length > 0 ? (
                            data.map((item, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate" title={item.title}>
                                        {item.title}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">
                                        {formatType(item.type)}
                                    </td>
                                    <td className="px-4 py-3 text-foreground font-bold flex items-center gap-1">
                                        <Eye className="h-3 w-3 text-text-muted" />
                                        {(item.views || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">
                                        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("ar-EG") : "-"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-text-muted">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                                            <p>جاري تحميل البيانات...</p>
                                        </div>
                                    ) : "لا توجد بيانات متاحة لهذه الفترة"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
