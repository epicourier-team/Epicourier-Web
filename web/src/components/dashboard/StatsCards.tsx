import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Scale, Leaf } from "lucide-react";

interface StatsCardsProps {
    stats: {
        completion_rate: number;
        total_meals: number;
        completed_meals: number;
        avg_green_score: number;
    };
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.completion_rate}%</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.completed_meals} of {stats.total_meals} meals completed
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    {/* Streak logic can be complex, using placeholder or simple stat for now */}
                    <div className="text-2xl font-bold">Coming Soon</div>
                    <p className="text-xs text-muted-foreground">
                        Keep it up!
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Green Score</CardTitle>
                    <Leaf className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avg_green_score}</div>
                    <p className="text-xs text-muted-foreground">
                        Goal: 8.0+
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
                    <Scale className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total_meals}</div>
                    <p className="text-xs text-muted-foreground">
                        Planned in this period
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
