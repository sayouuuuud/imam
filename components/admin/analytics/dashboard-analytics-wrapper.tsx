"use client"

import { useState, useEffect } from "react"
import { ViewsChart } from "../views-chart"
import { VisitorStats } from "./visitors-stats"
import { Loader2 } from "lucide-react"

interface AnalyticsData {
    date: string
    views_count: number
    visitors_count: number
}

interface CountryData {
    country: string
    count: number
}

interface DeviceData {
    device_type: string
    count: number
    percentage: number
}

interface DashboardAnalyticsWrapperProps {
    initialDailyStats: AnalyticsData[]
    initialCountryStats: CountryData[]
    initialDeviceStats: DeviceData[]
}

export function DashboardAnalyticsWrapper({
    initialDailyStats,
    initialCountryStats,
    initialDeviceStats
}: DashboardAnalyticsWrapperProps) {
    const [period, setPeriod] = useState("آخر 30 يوم")
    const [dailyStats, setDailyStats] = useState<AnalyticsData[]>(initialDailyStats)
    const [countryStats, setCountryStats] = useState<CountryData[]>(initialCountryStats)
    const [deviceStats, setDeviceStats] = useState<DeviceData[]>(initialDeviceStats)
    const [isLoading, setIsLoading] = useState(false)

    // Only fetch when period changes from the default initial load
    useEffect(() => {
        if (period === "آخر 30 يوم" && dailyStats === initialDailyStats) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Determine days for API
                const days = period === "آخر 7 أيام" ? 7 : period === "آخر 30 يوم" ? 30 : 90
                
                const response = await fetch(`/api/analytics/overview?days=${days}`)
                if (response.ok) {
                    const data = await response.json()
                    setDailyStats(data.dailyStats)
                    setCountryStats(data.countryStats)
                    setDeviceStats(data.deviceStats)
                }
            } catch (error) {
                console.error("Failed to fetch analytics overview:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [period])

    return (
        <div className="space-y-6 relative">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">جاري تحديث البيانات...</span>
                    </div>
                </div>
            )}
            
            {/* Views Chart */}
            <ViewsChart 
                data={dailyStats} 
                period={period} 
                onPeriodChange={setPeriod} 
            />

            {/* Visitor Stats (Countries & Devices) */}
            <VisitorStats
                countryData={countryStats}
                deviceData={deviceStats}
            />
        </div>
    )
}
