"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProgressCharts } from "@/components/dashboard/ProgressCharts";
import { AIInsightsCard } from "@/components/dashboard/AIInsightsCard";

// Types
interface InsightStats {
    completion_rate: number;
    total_meals: number;
    completed_meals: number;
    avg_green_score: number;
    weight_trend: any[];
    meal_type_distribution: any[];
    weekly_adherence: any[];
}

interface AIInsights {
    summary: string;
    recommendations: string[];
    achievements: string[];
    areas_for_improvement: string[];
}

export default function InsightsPage() {
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [stats, setStats] = useState<InsightStats | null>(null);
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [period, setPeriod] = useState("30d");

    // Memoize supabase client
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const abortController = new AbortController();

        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Fetch stats (fast - loads immediately)
                    const statsRes = await fetch(
                        `/api/insights/stats?user_id=${user.id}&period=${period}`,
                        { signal: abortController.signal }
                    );
                    if (statsRes.ok) {
                        const data = await statsRes.json();
                        setStats(data);
                    } else {
                        console.error("Failed to fetch stats");
                    }

                    // Page is ready - stop main loading
                    setLoading(false);

                    // Fetch AI insights in background (slow - can take 3-5 seconds)
                    setAiLoading(true);
                    try {
                        const aiRes = await fetch(
                            `/api/insights/ai-analysis?user_id=${user.id}&period=${period}`,
                            { signal: abortController.signal }
                        );
                        if (aiRes.ok) {
                            const aiData = await aiRes.json();
                            setAiInsights(aiData);
                        } else {
                            console.error("Failed to fetch AI insights");
                        }
                    } catch (aiError) {
                        if (aiError instanceof Error && aiError.name !== 'AbortError') {
                            console.error("Error loading AI insights:", aiError);
                        }
                    } finally {
                        setAiLoading(false);
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error("Error loading insights:", error);
                }
                setLoading(false);
            }
        };

        fetchStats();

        // Cleanup function to abort pending requests when dependencies change
        return () => {
            abortController.abort();
        };
    }, [supabase, period]);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-8 w-8 text-emerald-600" />
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                            Your Progress
                        </h1>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                        Track your journey towards better health and sustainability
                    </p>
                </div>

                {/* Period Selector */}
                <div className="flex rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
                    {["7d", "30d", "90d"].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${period === p
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                                }`}
                        >
                            {p === "7d" ? "Week" : p === "30d" ? "Month" : "3 Months"}
                        </button>
                    ))}
                </div>
            </div>

            {stats && (
                <>
                    <AIInsightsCard insights={aiInsights} loading={aiLoading} />
                    <StatsCards stats={stats} />
                    <ProgressCharts stats={stats} />
                </>
            )}
        </div>
    );
}
