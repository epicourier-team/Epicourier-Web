"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Apple,
  Beef,
  ChartArea,
  PieChart as PieIcon,
  RefreshCcw,
  Scale,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type {
  DailyNutrient,
  NutrientSummaryResponse,
  WeeklyNutrient,
  MonthlyNutrient,
} from "@/types/data";

type TrendPoint = {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

const formatDateInput = (date: Date) => date.toLocaleDateString("en-CA");

const emptyDaily: DailyNutrient = {
  date: "N/A",
  calories_kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fats_g: 0,
  sugar_g: 0,
  fiber_g: 0,
  sodium_mg: 0,
  meal_count: 0,
  user_id: "",
};

/**
 * Nutrient Dashboard Page
 * Displays daily snapshot plus weekly/monthly trends.
 */
export default function NutrientsPage() {
  const [daily, setDaily] = useState<DailyNutrient | null>(null);
  const [weekly, setWeekly] = useState<WeeklyNutrient[]>([]);
  const [monthly, setMonthly] = useState<MonthlyNutrient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNutrientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = formatDateInput(new Date());
      const [dayRes, weekRes, monthRes] = await Promise.all([
        fetch(`/api/nutrients/daily?period=day&date=${today}`),
        fetch(`/api/nutrients/daily?period=week&date=${today}`),
        fetch(`/api/nutrients/daily?period=month&date=${today}`),
      ]);

      const responses = [dayRes, weekRes, monthRes];
      if (responses.some((r) => !r.ok)) {
        throw new Error("Failed to fetch nutrient data");
      }

      const [dayData, weekData, monthData]: NutrientSummaryResponse[] = await Promise.all(
        responses.map((r) => r.json())
      );

      setDaily(dayData.daily);
      setWeekly(weekData.weekly || []);
      setMonthly(monthData.monthly || []);
    } catch (err) {
      console.error("Error fetching nutrient data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNutrientData();
  }, [fetchNutrientData]);

  const dailyData = daily ?? emptyDaily;

  const dailyPieData = useMemo(
    () => [
      { name: "Protein", value: dailyData.protein_g, color: "#ef4444" },
      { name: "Carbs", value: dailyData.carbs_g, color: "#eab308" },
      { name: "Fats", value: dailyData.fats_g, color: "#22c55e" },
    ],
    [dailyData.carbs_g, dailyData.fats_g, dailyData.protein_g]
  );

  const weeklyTrend: TrendPoint[] = useMemo(
    () =>
      (weekly || []).map((w) => ({
        label: `${w.week_start} → ${w.week_end}`,
        calories: w.calories_kcal,
        protein: w.protein_g,
        carbs: w.carbs_g,
        fats: w.fats_g,
      })),
    [weekly]
  );

  const monthlyTrend: TrendPoint[] = useMemo(
    () =>
      (monthly || []).map((m) => ({
        label: m.month,
        calories: m.calories_kcal,
        protein: m.protein_g,
        carbs: m.carbs_g,
        fats: m.fats_g,
      })),
    [monthly]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="brutalism-card brutalism-shadow-lg p-8">
          <div className="text-center">
            <Activity className="mx-auto mb-4 size-12 animate-pulse" />
            <h2 className="brutalism-text-bold text-xl">Loading Nutrient Data...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="brutalism-card brutalism-shadow-lg border-4 border-red-500 bg-red-50 p-8">
          <div className="text-center">
            <h2 className="brutalism-text-bold mb-2 text-xl text-red-800">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
            <button
              className="brutalism-button mt-4 inline-flex items-center gap-2 rounded-none px-4 py-2"
              onClick={fetchNutrientData}
            >
              <RefreshCcw className="size-4" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-0">
      {/* Page Header */}
      <div className="brutalism-card brutalism-shadow-lg bg-linear-to-r from-emerald-100 to-teal-100 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="brutalism-text-bold mb-2 text-4xl uppercase">Nutrient Tracking</h1>
            <p className="text-lg font-semibold text-gray-700">
              Today&apos;s intake plus weekly &amp; monthly trends
            </p>
          </div>
          <button
            className="brutalism-button inline-flex items-center gap-2 rounded-none px-4 py-2"
            onClick={fetchNutrientData}
            data-testid="refresh-button"
          >
            <RefreshCcw className="size-4" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Macronutrients Section */}
      <div>
        <h2 className="brutalism-text-bold mb-4 text-2xl uppercase">Macronutrients</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Calories</CardTitle>
              <Scale className="size-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">
                {dailyData?.calories_kcal.toFixed(0) || 0}
              </div>
              <p className="text-xs font-semibold text-gray-600">kcal</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Protein</CardTitle>
              <Beef className="size-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">
                {dailyData?.protein_g.toFixed(1) || 0}
              </div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Carbs</CardTitle>
              <Apple className="size-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">
                {dailyData?.carbs_g.toFixed(1) || 0}
              </div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase">Fats</CardTitle>
              <Activity className="size-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="brutalism-text-bold text-3xl">
                {dailyData?.fats_g.toFixed(1) || 0}
              </div>
              <p className="text-xs font-semibold text-gray-600">grams</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Pie */}
      <div
        className="brutalism-card brutalism-shadow-lg bg-white p-4"
        data-testid="daily-pie-chart"
      >
        <div className="mb-3 flex items-center gap-2">
          <PieIcon className="size-5 text-rose-600" />
          <div>
            <h3 className="brutalism-text-bold text-xl uppercase">Today&apos;s Macro Split</h3>
            <p className="text-sm font-semibold text-gray-600">
              Visualize protein, carbs, and fats proportions
            </p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dailyPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {dailyPieData.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={entry.color}
                    stroke="#000"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div
          className="brutalism-card brutalism-shadow-lg bg-white p-4"
          data-testid="weekly-line-chart"
        >
          <div className="mb-3 flex items-center gap-2">
            <ChartArea className="size-5 text-indigo-700" />
            <div>
              <h3 className="brutalism-text-bold text-xl uppercase">Weekly Trend</h3>
              <p className="text-sm font-semibold text-gray-600">Smooth line view of last weeks</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {weeklyTrend && weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weeklyCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="weeklyPro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="weeklyCarb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="weeklyFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="#f97316"
                    fillOpacity={1}
                    fill="url(#weeklyCal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="protein"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#weeklyPro)"
                  />
                  <Area
                    type="monotone"
                    dataKey="carbs"
                    stroke="#eab308"
                    fillOpacity={1}
                    fill="url(#weeklyCarb)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fats"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#weeklyFat)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-600">
                No nutrient data available for this range.
              </div>
            )}
          </div>
        </div>

        <div
          className="brutalism-card brutalism-shadow-lg bg-white p-4"
          data-testid="monthly-line-chart"
        >
          <div className="mb-3 flex items-center gap-2">
            <ChartArea className="size-5 text-emerald-700" />
            <div>
              <h3 className="brutalism-text-bold text-xl uppercase">Monthly Trend</h3>
              <p className="text-sm font-semibold text-gray-600">Month-over-month smooth lines</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {monthlyTrend && monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monthlyCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="monthlyPro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="monthlyCarb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="monthlyFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="#fb7185"
                    fillOpacity={1}
                    fill="url(#monthlyCal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="protein"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#monthlyPro)"
                  />
                  <Area
                    type="monotone"
                    dataKey="carbs"
                    stroke="#eab308"
                    fillOpacity={1}
                    fill="url(#monthlyCarb)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fats"
                    stroke="#0ea5e9"
                    fillOpacity={1}
                    fill="url(#monthlyFat)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-600">
                Add meals to see charts for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Nutrients Section */}
      <div>
        <h2 className="brutalism-text-bold mb-4 text-2xl uppercase">Additional Nutrients</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Other Tracked Values</CardTitle>
              <CardDescription className="font-semibold">
                Additional nutrient information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between border-b-2 border-gray-200 pb-1">
                <span className="font-semibold">Sugars</span>
                <span className="font-bold">{dailyData?.sugar_g?.toFixed(1) || 0} g</span>
              </div>
              <div className="flex justify-between border-b-2 border-gray-200 pb-1">
                <span className="font-semibold">Fiber</span>
                <span className="font-bold">{dailyData?.fiber_g?.toFixed(1) || 0} g</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Sodium</span>
                <span className="font-bold">{dailyData?.sodium_mg?.toFixed(1) || 0} mg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Meal Summary</CardTitle>
              <CardDescription className="font-semibold">Today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="brutalism-text-bold text-5xl text-emerald-600">
                  {dailyData?.meal_count || 0}
                </div>
                <p className="mt-2 font-semibold text-gray-600">Meals logged today</p>
              </div>
            </CardContent>
          </Card>

          <Card className="brutalism-card brutalism-shadow hover:brutalism-shadow-lg bg-amber-50 transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Tips</CardTitle>
              <CardDescription className="font-semibold">
                Keep ranges short for sharper trends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-none border-2 border-dashed border-gray-400 bg-white p-3 text-center">
                <p className="font-semibold text-gray-600">📊 Weekly vs Monthly contrast intake</p>
              </div>
              <div className="rounded-none border-2 border-dashed border-gray-400 bg-white p-3 text-center">
                <p className="font-semibold text-gray-600">📈 Adjust dates to replay past weeks</p>
              </div>
              <div className="rounded-none border-2 border-dashed border-gray-400 bg-white p-3 text-center">
                <p className="font-semibold text-gray-600">🎯 Align with your nutrient goals</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Footer */}
      <div className="brutalism-card brutalism-shadow bg-blue-50 p-6">
        <div className="text-center font-semibold text-gray-700">
          💡 Tip: Your nutrient data is calculated from the meals you&apos;ve logged in your
          calendar
        </div>
      </div>
    </div>
  );
}
