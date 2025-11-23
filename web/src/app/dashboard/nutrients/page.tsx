"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

const normalizeTrend = (trend: TrendPoint[]): TrendPoint[] => {
  if (!trend.length) return [];
  // Log compression to suppress very large values and lift smaller ones
  const compress = (v: number) => Math.log1p(Math.max(0, v));
  const compressed = trend.map((t) => ({
    ...t,
    calories: compress(t.calories),
    protein: compress(t.protein),
    carbs: compress(t.carbs),
    fats: compress(t.fats),
  }));

  const maxVal = Math.max(
    ...compressed.flatMap((t) => [t.calories, t.protein, t.carbs, t.fats].map((v) => Math.abs(v)))
  );
  if (maxVal === 0 || !Number.isFinite(maxVal)) return compressed;

  return compressed.map((t) => ({
    ...t,
    calories: t.calories / maxVal,
    protein: t.protein / maxVal,
    carbs: t.carbs / maxVal,
    fats: t.fats / maxVal,
  }));
};

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
  const [pastSeven, setPastSeven] = useState<TrendPoint[]>([]);
  const [weekly, setWeekly] = useState<WeeklyNutrient[]>([]);
  const [monthly, setMonthly] = useState<MonthlyNutrient[]>([]);
  const [monthRange, setMonthRange] = useState<3 | 6 | 12>(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (period: "day" | "week" | "month", date: string) => {
    const response = await fetch(`/api/nutrients/daily?period=${period}&date=${date}`);
    if (!response.ok) {
      throw new Error("Failed to fetch nutrient data");
    }
    const data: NutrientSummaryResponse = await response.json();
    return data;
  }, []);

  const getPastDates = (count: number, reference: Date): Date[] => {
    const dates: Date[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(reference);
      d.setDate(reference.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  const getCurrentMonthWeeks = (reference: Date): Date[] => {
    const startOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const endOfMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);

    const startMonday = new Date(startOfMonth);
    const day = startMonday.getDay();
    const diff = startMonday.getDate() - day + (day === 0 ? -6 : 1);
    startMonday.setDate(diff);

    const weeks: Date[] = [];
    const cursor = new Date(startMonday);
    while (cursor <= endOfMonth) {
      if (cursor.getMonth() === reference.getMonth()) {
        weeks.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
  };

  const getPastMonths = (count: number, reference: Date): Date[] => {
    const months: Date[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(reference.getFullYear(), reference.getMonth() - i, 15);
      months.push(d);
    }
    return months;
  };

  const fetchNutrientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const todayDate = new Date();
      const todayStr = formatDateInput(todayDate);

      const dailyDates = getPastDates(7, todayDate).map((d) => formatDateInput(d));
      const weeklyDates = getCurrentMonthWeeks(todayDate).map((d) => formatDateInput(d));
      const monthlyDates = getPastMonths(monthRange, todayDate).map((d) => formatDateInput(d));

      const [todaySummary, dailyTrendSummaries, weeklySummaries, monthlySummaries] =
        await Promise.all([
          fetchSummary("day", todayStr),
          Promise.all(dailyDates.map((d) => fetchSummary("day", d))),
          Promise.all(weeklyDates.map((d) => fetchSummary("week", d))),
          Promise.all(monthlyDates.map((d) => fetchSummary("month", d))),
        ]);

      setDaily(todaySummary.daily);

      const sevenTrend: TrendPoint[] = dailyTrendSummaries
        .map((res) => res.daily)
        .filter((d): d is DailyNutrient => Boolean(d))
        .map((d) => ({
          label: d.date,
          calories: d.calories_kcal,
          protein: d.protein_g,
          carbs: d.carbs_g,
          fats: d.fats_g,
        }));
      setPastSeven(sevenTrend);

      const weeklyTrendData: WeeklyNutrient[] = weeklySummaries
        .map((res) => res.weekly?.[0])
        .filter((w): w is WeeklyNutrient => Boolean(w));
      setWeekly(weeklyTrendData);

      const monthlyTrendData: MonthlyNutrient[] = monthlySummaries
        .map((res) => res.monthly?.[0])
        .filter((m): m is MonthlyNutrient => Boolean(m));
      setMonthly(monthlyTrendData);
    } catch (err) {
      console.error("Error fetching nutrient data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, monthRange]);

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

  const pastSevenNormalized = useMemo(() => normalizeTrend(pastSeven), [pastSeven]);
  const weeklyTrendNormalized = useMemo(() => normalizeTrend(weeklyTrend), [weeklyTrend]);
  const monthlyTrendNormalized = useMemo(() => normalizeTrend(monthlyTrend), [monthlyTrend]);

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

      {/* Past 7 Days Trend */}
      <div
        className="brutalism-card brutalism-shadow-lg bg-white p-4"
        data-testid="daily-trend-chart"
      >
        <div className="mb-3 flex items-center gap-2">
          <ChartArea className="size-5 text-blue-700" />
          <div>
            <h3 className="brutalism-text-bold text-xl uppercase">Past 7 Days</h3>
            <p className="text-sm font-semibold text-gray-600">
              Daily macros trend (calories, protein, carbs, fats)
            </p>
          </div>
        </div>
        <div className="h-72 w-full">
          {pastSevenNormalized && pastSevenNormalized.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={pastSevenNormalized}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis width={48} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={3} />
                <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={3} />
                <Line type="monotone" dataKey="carbs" stroke="#eab308" strokeWidth={3} />
                <Line type="monotone" dataKey="fats" stroke="#22c55e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-600">
              No daily trend data yet. Add meals to see the last 7 days.
            </div>
          )}
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
            {weeklyTrendNormalized && weeklyTrendNormalized.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendNormalized} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis width={48} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={3} />
                  <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={3} />
                  <Line type="monotone" dataKey="carbs" stroke="#eab308" strokeWidth={3} />
                  <Line type="monotone" dataKey="fats" stroke="#22c55e" strokeWidth={3} />
                </LineChart>
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
              <p className="text-sm font-semibold text-gray-600">
                Last {monthRange} month{monthRange > 1 ? "s" : ""}
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              {[3, 6, 12].map((range) => (
                <button
                  key={range}
                  onClick={() => setMonthRange(range as 3 | 6 | 12)}
                  className={`rounded-none border-2 px-2 py-1 text-xs font-bold uppercase transition ${
                    monthRange === range
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-yellow-200"
                  }`}
                >
                  {range}m
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 w-full">
            {monthlyTrendNormalized && monthlyTrendNormalized.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendNormalized} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis width={48} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#fb7185" strokeWidth={3} />
                  <Line type="monotone" dataKey="protein" stroke="#22c55e" strokeWidth={3} />
                  <Line type="monotone" dataKey="carbs" stroke="#eab308" strokeWidth={3} />
                  <Line type="monotone" dataKey="fats" stroke="#0ea5e9" strokeWidth={3} />
                </LineChart>
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
