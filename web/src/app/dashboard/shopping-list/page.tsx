"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, ExternalLink, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MissingItem {
    name: string;
    count: number;
    uber_eats_link: string;
}

interface ApiResponse {
    missing_items: MissingItem[];
    meta: {
        planned_meals_count: number;
        date_range: { start: string; end: string };
    };
    error?: string;
    message?: string;
}

export default function ShoppingListPage() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/shopping-list");
                if (!res.ok) throw new Error("Failed to fetch shopping list");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-lg mt-10 p-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-semibold">Error</h3>
                </div>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl p-6">
            {/* Header */}
            <div className="mb-8 border-b border-neutral-800 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <ShoppingCart className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-100">Smart Shopping List</h1>
                        <p className="text-neutral-400 text-sm mt-1">
                            Based on your {data?.meta.planned_meals_count} upcoming meals
                        </p>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {data?.missing_items.length === 0 ? (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                        <Check className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-200 mb-2">You're All Set!</h3>
                    <p className="text-neutral-400">
                        Looks like you have everything you need in your pantry.
                    </p>
                </div>
            ) : (
                /* List */
                <div className="grid gap-4">
                    {data?.missing_items.map((item, idx) => (
                        <div
                            key={idx}
                            className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-all hover:border-emerald-500/50 hover:bg-neutral-800/50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 font-medium text-neutral-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                                    {item.count > 1 ? `${item.count}x` : "1x"}
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg text-emerald-100">{item.name}</h3>
                                    <p className="text-xs text-neutral-500">Missing from pantry</p>
                                </div>
                            </div>

                            <Button
                                asChild
                                className="bg-[#06C167] hover:bg-[#05a357] text-black font-semibold shadow-lg hover:shadow-emerald-900/20 transition-all"
                            >
                                <a
                                    href={item.uber_eats_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                >
                                    <span>Order on Uber Eats</span>
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer / Disclaimer */}
            <div className="mt-8 text-center text-xs text-neutral-600">
                <p>Prices and availability subject to change on third-party platforms.</p>
            </div>
        </div>
    );
}
