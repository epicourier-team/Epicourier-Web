"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
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
  Target,
  Wand2,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useToast } from "@/hooks/use-toast";

import type {
  DailyNutrient,
  NutrientGoal,
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
  daysTracked?: number;
};

type GoalField = "calories_kcal" | "protein_g" | "carbs_g" | "fats_g" | "sodium_mg" | "fiber_g";

const numericField = (label: string) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || typeof val === "undefined") {
        return 0;
      }
      const num = typeof val === "number" ? val : Number(val);
      return Number.isNaN(num) ? val : num;
    },
    z
      .number()
      .refine((val) => Number.isFinite(val), `${label} must be a number`)
      .nonnegative({ message: `${label} must be 0 or greater` })
  );

const goalSchema = z.object({
  calories_kcal: numericField("Calories"),
  protein_g: numericField("Protein"),
  carbs_g: numericField("Carbs"),
  fats_g: numericField("Fats"),
  sodium_mg: numericField("Sodium"),
  fiber_g: numericField("Fiber"),
});

type GoalFormValues = z.infer<typeof goalSchema>;

const GOAL_FIELD_CONFIG: { key: GoalField; label: string; unit: string }[] = [
  { key: "calories_kcal", label: "Calories", unit: "kcal" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "carbs_g", label: "Carbs", unit: "g" },
  { key: "fats_g", label: "Fats", unit: "g" },
  { key: "sodium_mg", label: "Sodium", unit: "mg" },
  { key: "fiber_g", label: "Fiber", unit: "g" },
];

const RECOMMENDED_GOALS: GoalFormValues = {
  calories_kcal: 2000,
  protein_g: 120,
  carbs_g: 240,
  fats_g: 70,
  sodium_mg: 2000,
  fiber_g: 30,
};

const percentOfGoal = (value: number, goalValue: number | null | undefined) => {
  if (!goalValue || goalValue <= 0) return 0;
  return (value / goalValue) * 100;
};

const toPercentTrend = (
  trend: TrendPoint[],
  goals: GoalFormValues,
  resolvePeriodDays: (point: TrendPoint) => number
): TrendPoint[] =>
  trend.map((t) => {
    const periodDays = resolvePeriodDays(t) || 1;
    return {
      label: t.label,
      calories: percentOfGoal(t.calories, goals.calories_kcal * periodDays),
      protein: percentOfGoal(t.protein, goals.protein_g * periodDays),
      carbs: percentOfGoal(t.carbs, goals.carbs_g * periodDays),
      fats: percentOfGoal(t.fats, goals.fats_g * periodDays),
      daysTracked: periodDays,
    };
  });

const getMonthDaysFromLabel = (label: string) => {
  const [yearStr, monthStr] = label.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return 30;
  return new Date(year, monthIndex + 1, 0).getDate();
};

const buildGoalFormDefaults = (goal?: NutrientGoal | null): GoalFormValues => ({
  calories_kcal: goal?.calories_kcal ?? 0,
  protein_g: goal?.protein_g ?? 0,
  carbs_g: goal?.carbs_g ?? 0,
  fats_g: goal?.fats_g ?? 0,
  sodium_mg: goal?.sodium_mg ?? 0,
  fiber_g: goal?.fiber_g ?? 0,
});

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
  const { toast } = useToast();
  const [daily, setDaily] = useState<DailyNutrient | null>(null);
  const [pastSeven, setPastSeven] = useState<TrendPoint[]>([]);
  const [weekly, setWeekly] = useState<WeeklyNutrient[]>([]);
  const [monthly, setMonthly] = useState<MonthlyNutrient[]>([]);
  const [monthRange, setMonthRange] = useState<3 | 6 | 12>(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<NutrientGoal | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as Resolver<GoalFormValues>,
    defaultValues: buildGoalFormDefaults(goal),
  });

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

  const fetchGoal = useCallback(async () => {
    try {
      setGoalLoading(true);
      setGoalError(null);
      const response = await fetch("/api/nutrients/goals");
      if (!response.ok) {
        throw new Error("Failed to fetch nutrient goal");
      }
      const data: { goal: NutrientGoal | null } = await response.json();
      setGoal(data.goal);
      if (data.goal) {
        goalForm.reset(buildGoalFormDefaults(data.goal));
      }
    } catch (err) {
      console.error("Error fetching nutrient goal:", err);
      setGoalError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGoalLoading(false);
    }
  }, [goalForm]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const handleOpenGoalModal = () => {
    setGoalModalOpen(true);
  };

  useEffect(() => {
    if (goalModalOpen) {
      goalForm.reset(buildGoalFormDefaults(goal));
    }
  }, [goal, goalForm, goalModalOpen]);

  const onSubmitGoal = goalForm.handleSubmit(async (values) => {
    try {
      setGoalSaving(true);
      const response = await fetch("/api/nutrients/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save goal");
      }

      setGoal(data.goal ?? null);
      toast({
        title: "Goal saved",
        description: "Daily nutrient target updated",
      });
      setGoalModalOpen(false);
    } catch (err) {
      console.error("Error saving nutrient goal:", err);
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setGoalSaving(false);
    }
  });

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
        daysTracked: w.days_tracked,
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
        daysTracked: m.days_tracked,
      })),
    [monthly]
  );

  const effectiveGoal = useMemo(
    () => (goal ? buildGoalFormDefaults(goal) : RECOMMENDED_GOALS),
    [goal]
  );

  const pastSevenNormalized = useMemo(
    () => toPercentTrend(pastSeven, effectiveGoal, () => 1),
    [effectiveGoal, pastSeven]
  );
  const weeklyTrendNormalized = useMemo(
    () => toPercentTrend(weeklyTrend, effectiveGoal, () => 7),
    [effectiveGoal, weeklyTrend]
  );
  const monthlyTrendNormalized = useMemo(
    () => toPercentTrend(monthlyTrend, effectiveGoal, (point) =>
      getMonthDaysFromLabel(point.label)
    ),
    [effectiveGoal, monthlyTrend]
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="brutalism-button inline-flex items-center gap-2 rounded-none px-4 py-2"
              onClick={handleOpenGoalModal}
              disabled={goalLoading}
            >
              <Target className="size-4" />
              {goal ? "Edit Goal" : "Set Goal"}
            </button>
            <button
              className="brutalism-button inline-flex items-center gap-2 rounded-none px-4 py-2"
              onClick={fetchNutrientData}
              data-testid="refresh-button"
            >
              <RefreshCcw className="size-4" /> Refresh Data
            </button>
          </div>
        </div>
        {goalError && (
          <p className="mt-3 text-sm font-semibold text-red-700">
            Unable to load your goal: {goalError}
          </p>
        )}
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
                <YAxis
                  width={48}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${Math.round(Number(v) || 0)}%`}
                  domain={[0, "dataMax + 20"]}
                />
                <Tooltip formatter={(value) => `${(value as number).toFixed(0)}%`} />
                <ReferenceLine
                  y={100}
                  stroke="#000"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  label={{
                    value: "Goal",
                    position: "insideTopRight",
                    fill: "#000",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
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
                <LineChart
                  data={weeklyTrendNormalized}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  width={48}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${Math.round(Number(v) || 0)}%`}
                  domain={[0, "dataMax + 20"]}
                />
                <Tooltip formatter={(value) => `${(value as number).toFixed(0)}%`} />
                <ReferenceLine
                  y={100}
                  stroke="#000"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  label={{
                    value: "Goal",
                    position: "insideTopRight",
                    fill: "#000",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
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
                <LineChart
                  data={monthlyTrendNormalized}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  width={48}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${Math.round(Number(v) || 0)}%`}
                  domain={[0, "dataMax + 20"]}
                />
                <Tooltip formatter={(value) => `${(value as number).toFixed(0)}%`} />
                <ReferenceLine
                  y={100}
                  stroke="#000"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  label={{
                    value: "Goal",
                    position: "insideTopRight",
                    fill: "#000",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
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

      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent
          className="brutalism-card brutalism-shadow-lg border-4 border-black bg-white p-0 sm:max-w-xl"
          showCloseButton={false}
        >
          <DialogHeader className="border-b-4 border-black bg-yellow-200 p-6">
            <DialogTitle className="brutalism-text-bold flex items-center gap-2 text-2xl uppercase">
              <Target className="size-5" />
              {goal ? "Edit Daily Goals" : "Set Daily Goals"}
            </DialogTitle>
            <DialogDescription className="font-semibold text-gray-800">
              Define how many calories and macros you aim for each day.
            </DialogDescription>
          </DialogHeader>

          <form id="nutrient-goal-form" onSubmit={onSubmitGoal} className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goalForm.reset(RECOMMENDED_GOALS)}
                className="flex items-center gap-2 border-2 border-black bg-amber-200 px-3 py-2 text-sm font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition hover:-translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Wand2 className="size-4" />
                Use Recommended
              </button>
            </div>
            <FieldGroup className="gap-4 md:grid md:grid-cols-2">
              {GOAL_FIELD_CONFIG.map(({ key, label, unit }) => (
                <Controller
                  key={key}
                  name={key}
                  control={goalForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor={`goal-${key}`}
                        className="text-sm font-bold tracking-tight uppercase"
                      >
                        {label}
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id={`goal-${key}`}
                          type="number"
                          inputMode="decimal"
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                          }
                          aria-invalid={fieldState.invalid}
                          className="font-semibold"
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText className="brutalism-text-bold text-xs uppercase">
                            {unit}
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription className="text-xs font-medium text-gray-600">
                        Daily target for {label.toLowerCase()}
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              ))}
            </FieldGroup>
            {goalError && (
              <p className="rounded-none border-2 border-red-600 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {goalError}
              </p>
            )}
          </form>

          <DialogFooter className="border-t-4 border-black bg-gray-100 p-6">
            <div className="flex w-full gap-3">
              <button
                onClick={() => setGoalModalOpen(false)}
                className="flex-1 border-2 border-black bg-white px-4 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
                disabled={goalSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="nutrient-goal-form"
                className="flex-1 border-2 border-black bg-emerald-400 px-4 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-80"
                disabled={goalSaving}
              >
                {goalSaving ? "Saving..." : goal ? "Update Goal" : "Save Goal"}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
