"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useToast } from "@/hooks/use-toast";

import type {
  DailyNutrient,
  MonthlyNutrient,
  NutrientGoal,
  NutrientSummaryResponse,
  WeeklyNutrient,
} from "@/types/data";
import type { GoalField, GoalFormValues, TrendPoint } from "./types";

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

export const GOAL_FIELD_CONFIG: { key: GoalField; label: string; unit: string }[] = [
  { key: "calories_kcal", label: "Calories", unit: "kcal" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "carbs_g", label: "Carbs", unit: "g" },
  { key: "fats_g", label: "Fats", unit: "g" },
  { key: "sodium_mg", label: "Sodium", unit: "mg" },
  { key: "fiber_g", label: "Fiber", unit: "g" },
];

export const RECOMMENDED_GOALS: GoalFormValues = {
  calories_kcal: 2000,
  protein_g: 120,
  carbs_g: 240,
  fats_g: 70,
  sodium_mg: 2000,
  fiber_g: 30,
};

export const MACRO_COLORS = {
  calories: "#0ea5e9",
  protein: "#ff6b6b",
  carbs: "#ffd43b",
  fats: "#20c997",
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

const formatDateInput = (date: Date) => date.toLocaleDateString("en-CA");

const getMonthDaysFromLabel = (label: string) => {
  const [yearStr, monthStr] = label.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return 30;
  return new Date(year, monthIndex + 1, 0).getDate();
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
      rangeLabel: t.rangeLabel,
    };
  });

export function useNutrientDashboard() {
  const { toast } = useToast();
  const [daily, setDaily] = useState<DailyNutrient | null>(null);
  const [pastSeven, setPastSeven] = useState<TrendPoint[]>([]);
  const [weekly, setWeekly] = useState<WeeklyNutrient[]>([]);
  const [monthly, setMonthly] = useState<MonthlyNutrient[]>([]);
  const [monthRange, setMonthRange] = useState<3 | 6 | 12>(3);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<NutrientGoal | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as Resolver<GoalFormValues>,
    defaultValues: RECOMMENDED_GOALS,
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
      setSummaryLoading(true);
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
      setSummaryLoading(false);
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
        goalForm.reset({
          calories_kcal: data.goal.calories_kcal ?? 0,
          protein_g: data.goal.protein_g ?? 0,
          carbs_g: data.goal.carbs_g ?? 0,
          fats_g: data.goal.fats_g ?? 0,
          sodium_mg: data.goal.sodium_mg ?? 0,
          fiber_g: data.goal.fiber_g ?? 0,
        });
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

  useEffect(() => {
    if (goalModalOpen) {
      goalForm.reset({
        calories_kcal: goal?.calories_kcal ?? 0,
        protein_g: goal?.protein_g ?? 0,
        carbs_g: goal?.carbs_g ?? 0,
        fats_g: goal?.fats_g ?? 0,
        sodium_mg: goal?.sodium_mg ?? 0,
        fiber_g: goal?.fiber_g ?? 0,
      });
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
      { name: "Protein", value: dailyData.protein_g, color: MACRO_COLORS.protein },
      { name: "Carbs", value: dailyData.carbs_g, color: MACRO_COLORS.carbs },
      { name: "Fats", value: dailyData.fats_g, color: MACRO_COLORS.fats },
    ],
    [dailyData.carbs_g, dailyData.fats_g, dailyData.protein_g]
  );

  const weeklyTrend: TrendPoint[] = useMemo(() => {
    const total = weekly.length;
    return (weekly || []).map((w, idx) => ({
      label: `W-${total - idx - 1}`,
      rangeLabel: `${w.week_start} → ${w.week_end}`,
      calories: w.calories_kcal,
      protein: w.protein_g,
      carbs: w.carbs_g,
      fats: w.fats_g,
      daysTracked: w.days_tracked,
    }));
  }, [weekly]);

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
    () =>
      goal
        ? {
            calories_kcal: goal.calories_kcal ?? 0,
            protein_g: goal.protein_g ?? 0,
            carbs_g: goal.carbs_g ?? 0,
            fats_g: goal.fats_g ?? 0,
            sodium_mg: goal.sodium_mg ?? 0,
            fiber_g: goal.fiber_g ?? 0,
          }
        : RECOMMENDED_GOALS,
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
    () =>
      toPercentTrend(monthlyTrend, effectiveGoal, (point) => getMonthDaysFromLabel(point.label)),
    [effectiveGoal, monthlyTrend]
  );

  const formatTooltipLabel = (
    label: string | number,
    payload: ReadonlyArray<Payload<ValueType, NameType>>
  ) => {
    const range = payload?.[0]?.payload?.rangeLabel;
    return range ?? label;
  };

  return {
    summaryLoading,
    error,
    dailyData,
    dailyPieData,
    pastSevenNormalized,
    weeklyTrendNormalized,
    monthlyTrendNormalized,
    monthRange,
    setMonthRange,
    goal,
    goalModalOpen,
    setGoalModalOpen,
    goalLoading,
    goalSaving,
    goalError,
    handleOpenGoalModal: () => setGoalModalOpen(true),
    onSubmitGoal,
    fetchNutrientData,
    goalForm,
    formatTooltipLabel,
  };
}
