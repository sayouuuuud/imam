import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "week"; // week, month, year, all

    const supabase = await createClient();

    // Authentication check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate start date based on period
    let startDate = new Date();
    if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
        startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
        // "all" - just use a very old date
        startDate = new Date(0);
    }

    try {
        // Query analytics_visits for the given period
        const { data: topPagesData, error: analyticsError } = await supabase
            .from("analytics_visits")
            .select("page_path")
            .gte("created_at", startDate.toISOString())
            .not("page_path", "is", null);

        if (analyticsError) throw analyticsError;

        // Aggregate page views manually (since we want counts over a period)
        const pageCounts: Record<string, number> = {};
        (topPagesData || []).forEach((item: any) => {
            pageCounts[item.page_path] = (pageCounts[item.page_path] || 0) + 1;
        });

        // Sort and limit to top 10
        const sortedPages = Object.entries(pageCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([path, views]) => ({ page_path: path, views }));

        // Enrich with titles and dates (similar to admin/page.tsx logic)
        const enrichedData = await Promise.all(sortedPages.map(async (item) => {
            let title = item.page_path;
            let type = 'page';
            let publishedAt = null;

            const cleanPath = item.page_path.replace(/^\/|\/$/g, '');
            const pathParts = cleanPath.split('/');
            const mainSection = pathParts[0];
            const id = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

            // Handle Index Pages
            if (pathParts.length === 1) {
                if (mainSection === "khutba") { title = "الخطب"; type = "page"; }
                else if (mainSection === "dars") { title = "الدروس"; type = "page"; }
                else if (mainSection === "books") { title = "الكتب"; type = "page"; }
                else if (mainSection === "articles") { title = "المقالات"; type = "page"; }
                else if (mainSection === "about") { title = "عن الشيخ"; type = "page"; }
                else if (mainSection === "contact") { title = "تواصل معنا"; type = "page"; }
            }
            // Handle Content Pages
            else if (id && id.length > 20) { // Simple UUID check
                try {
                    const getTitleDate = async (table: string) => {
                        const { data } = await supabase.from(table).select("title, created_at").eq("id", id).single();
                        return data ? { title: data.title, date: data.created_at } : null;
                    };
                    const getTitleDateSermons = async (table: string) => {
                        const { data } = await supabase.from(table).select("title, date").eq("id", id).single();
                        return data ? { title: data.title, date: data.date } : null;
                    };

                    if (mainSection === "khutba") {
                        type = 'khutba';
                        const info = await getTitleDateSermons("sermons");
                        if (info) { title = info.title; publishedAt = info.date; }
                    } else if (mainSection === "dars") {
                        type = 'dars';
                        const info = await getTitleDateSermons("lessons");
                        if (info) { title = info.title; publishedAt = info.date; }
                    } else if (mainSection === "books") {
                        type = 'book';
                        const info = await getTitleDate("books");
                        if (info) { title = info.title; publishedAt = info.date; }
                    } else if (mainSection === "articles") {
                        type = 'article';
                        const info = await getTitleDate("articles");
                        if (info) { title = info.title; publishedAt = info.date; }
                    }
                } catch (e) {
                    // Fallback to path if id is not valid UUID or not found
                }
            }

            if (item.page_path === "/" || item.page_path === "") {
                title = "الرئيسية";
                type = "page";
            }

            return {
                page_path: item.page_path,
                title: title,
                views: item.views,
                type: type,
                publishedAt: publishedAt
            };
        }));

        return NextResponse.json(enrichedData);
    } catch (error: any) {
        console.error("Top content filter error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
