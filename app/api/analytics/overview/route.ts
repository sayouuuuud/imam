import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);
    
    const supabase = await createClient();

    // Authentication check for admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const startDayStr = startDate.split("T")[0];

        // 1. Fetch Daily Stats
        const { data: dailyStats, error: dailyError } = await supabase
            .from("analytics_daily_stats")
            .select("*")
            .gte("date", startDayStr)
            .order("date", { ascending: true });

        if (dailyError) throw dailyError;

        // 2. Fetch Raw Visits for Country & Device aggregation
        const { data: rawVisits, error: visitsError } = await supabase
            .from("analytics_visits")
            .select("country, device_type")
            .gte("created_at", startDate);

        if (visitsError) throw visitsError;

        // Aggregate Country Data
        const countryCounts: Record<string, number> = {};
        const deviceCounts: Record<string, number> = {};
        let totalCountForDevices = 0;

        (rawVisits || []).forEach((visit: any) => {
            // Country
            const c = visit.country || "Unknown";
            countryCounts[c] = (countryCounts[c] || 0) + 1;

            // Device
            const d = visit.device_type || "desktop";
            deviceCounts[d] = (deviceCounts[d] || 0) + 1;
            totalCountForDevices++;
        });

        // Format Country Stats (Top 10)
        const countryStats = Object.entries(countryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([country, count]) => ({ country, count }));

        // Format Device Stats
        const deviceStats = Object.entries(deviceCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([device_type, count]) => ({
                device_type,
                count,
                percentage: totalCountForDevices > 0 ? parseFloat(((count / totalCountForDevices) * 100).toFixed(2)) : 0
            }));

        return NextResponse.json({ 
            dailyStats: dailyStats || [],
            countryStats: countryStats,
            deviceStats: deviceStats
        });

    } catch (error: any) {
        console.error("Analytics Overview Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
