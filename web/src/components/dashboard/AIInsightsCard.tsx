"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Trophy, TrendingUp, Lightbulb } from "lucide-react";

interface AIInsight {
    summary: string;
    recommendations: string[];
    achievements: string[];
    areas_for_improvement: string[];
}

interface AIInsightsCardProps {
    insights: AIInsight | null;
    loading: boolean;
}

export function AIInsightsCard({ insights, loading }: AIInsightsCardProps) {
    if (loading) {
        return (
            <Card className="col-span-full shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                        <CardTitle>AI Coach</CardTitle>
                    </div>
                    <CardDescription>Analyzing your progress...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!insights) {
        return null;
    }

    return (
        <Card className="col-span-full border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950 dark:via-indigo-950 dark:to-purple-950 dark:border-purple-800 shadow-lg">
            <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-purple-600/10 dark:bg-purple-400/10">
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-purple-900 dark:text-purple-100 text-xl">AI Coach Insights</CardTitle>
                </div>
                <CardDescription className="text-purple-700 dark:text-purple-300 ml-14">
                    Personalized feedback powered by AI
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Summary */}
                <div className="p-5 rounded-xl bg-white/60 dark:bg-neutral-900/60 border-2 border-purple-200 dark:border-purple-800 shadow-sm">
                    <p className="text-purple-900 dark:text-purple-100 leading-relaxed text-base">
                        {insights.summary}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Achievements */}
                    <div className="space-y-3 p-4 rounded-xl bg-white/40 dark:bg-neutral-900/40 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold mb-3">
                            <Trophy className="h-5 w-5" />
                            <span className="text-base">Achievements</span>
                        </div>
                        <ul className="space-y-2.5">
                            {insights.achievements.map((achievement, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                    <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">✓</span>
                                    <span>{achievement}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-3 p-4 rounded-xl bg-white/40 dark:bg-neutral-900/40 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-3">
                            <Lightbulb className="h-5 w-5" />
                            <span className="text-base">Recommendations</span>
                        </div>
                        <ul className="space-y-2.5">
                            {insights.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">💡</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Areas for Improvement */}
                    <div className="space-y-3 p-4 rounded-xl bg-white/40 dark:bg-neutral-900/40 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-semibold mb-3">
                            <TrendingUp className="h-5 w-5" />
                            <span className="text-base">Growth Opportunities</span>
                        </div>
                        <ul className="space-y-2.5">
                            {insights.areas_for_improvement.map((area, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                    <span className="text-orange-600 dark:text-orange-400 mt-0.5 font-bold">→</span>
                                    <span>{area}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
