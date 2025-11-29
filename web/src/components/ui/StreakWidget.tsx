"use client";

import React, { useEffect, useState } from "react";
import { Flame, Target, Leaf, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreakData, StreaksResponse, StreakType } from "@/types/data";

/**
 * Icon mapping for streak types
 */
const STREAK_ICONS: Record<StreakType, React.ElementType> = {
  daily_log: Flame,
  nutrient_goal: Target,
  green_recipe: Leaf,
};

/**
 * Color mapping for streak types
 */
const STREAK_COLORS: Record<StreakType, string> = {
  daily_log: "text-orange-500",
  nutrient_goal: "text-blue-500",
  green_recipe: "text-green-500",
};

/**
 * Background color mapping for streak type cards
 */
const STREAK_BG_COLORS: Record<StreakType, string> = {
  daily_log: "bg-orange-50 dark:bg-orange-950/20",
  nutrient_goal: "bg-blue-50 dark:bg-blue-950/20",
  green_recipe: "bg-green-50 dark:bg-green-950/20",
};

/**
 * Get visual intensity class based on streak count
 * Higher streaks = more intense visual effects
 */
function getIntensityClass(current: number): {
  iconSize: string;
  textSize: string;
  glowClass: string;
  animationClass: string;
} {
  if (current >= 30) {
    return {
      iconSize: "w-8 h-8",
      textSize: "text-4xl",
      glowClass: "shadow-lg shadow-orange-500/50",
      animationClass: "animate-flame-intense",
    };
  } else if (current >= 14) {
    return {
      iconSize: "w-7 h-7",
      textSize: "text-3xl",
      glowClass: "shadow-md shadow-orange-500/30",
      animationClass: "animate-flame-medium",
    };
  } else if (current >= 7) {
    return {
      iconSize: "w-6 h-6",
      textSize: "text-2xl",
      glowClass: "shadow-sm shadow-orange-500/20",
      animationClass: "animate-flame-low",
    };
  }
  return {
    iconSize: "w-5 h-5",
    textSize: "text-2xl",
    glowClass: "",
    animationClass: "",
  };
}

/**
 * Check if streak is at risk (not active today and has active streak)
 */
function isStreakAtRisk(streak: StreakData): boolean {
  if (streak.current === 0 || streak.isActiveToday) return false;

  // If last activity was yesterday or earlier, streak is at risk
  if (!streak.lastActivity) return false;

  const lastDate = new Date(streak.lastActivity);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1; // At risk if last activity was yesterday
}

/**
 * Single streak item display
 */
interface StreakItemProps {
  streak: StreakData;
  compact?: boolean;
}

function StreakItem({ streak, compact = false }: StreakItemProps) {
  const Icon = STREAK_ICONS[streak.type];
  const colorClass = STREAK_COLORS[streak.type];
  const bgColorClass = STREAK_BG_COLORS[streak.type];
  const intensity = getIntensityClass(streak.current);
  const atRisk = isStreakAtRisk(streak);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", bgColorClass)}>
        <Icon
          className={cn(
            "w-4 h-4",
            colorClass,
            streak.current >= 7 && streak.type === "daily_log" && "animate-flame-low"
          )}
        />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{streak.label}</span>
          <span className="text-sm font-semibold">
            {streak.current}
            <span className="text-xs font-normal text-muted-foreground ml-1">days</span>
          </span>
        </div>
        {atRisk && (
          <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" aria-label="Streak at risk!" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-all",
        bgColorClass,
        streak.isActiveToday && "ring-2 ring-offset-2",
        streak.isActiveToday && streak.type === "daily_log" && "ring-orange-400",
        streak.isActiveToday && streak.type === "nutrient_goal" && "ring-blue-400",
        streak.isActiveToday && streak.type === "green_recipe" && "ring-green-400",
        atRisk && "border-amber-400 border-2"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-lg bg-white dark:bg-gray-800 transition-all",
            colorClass,
            intensity.glowClass,
            streak.type === "daily_log" && intensity.animationClass
          )}
        >
          <Icon className={cn(intensity.iconSize, "transition-all")} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{streak.label}</h4>
            {atRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                At risk!
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {streak.isActiveToday ? (
              <span className="text-green-600 dark:text-green-400">✓ Active today</span>
            ) : atRisk ? (
              <span className="text-amber-600 dark:text-amber-400">Log today to keep your streak!</span>
            ) : streak.lastActivity ? (
              `Last: ${new Date(streak.lastActivity).toLocaleDateString()}`
            ) : (
              "Not started"
            )}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className={cn(intensity.textSize, "font-bold transition-all", colorClass)}>
          {streak.current}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
          <Award className="w-3 h-3" />
          Best: {streak.longest}
        </div>
      </div>
    </div>
  );
}

/**
 * Props for StreakWidget component
 */
interface StreakWidgetProps {
  /**
   * Display variant: 'full' shows all details, 'compact' shows summary
   */
  variant?: "full" | "compact";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Optional title override
   */
  title?: string;
}

/**
 * StreakWidget - Displays user's streak statistics
 *
 * Shows daily logging, nutrient goal, and green recipe streaks.
 * Updates automatically when component mounts.
 *
 * @example
 * // Full widget for dashboard
 * <StreakWidget variant="full" />
 *
 * // Compact widget for sidebar
 * <StreakWidget variant="compact" />
 */
export function StreakWidget({ variant = "full", className, title = "Your Streaks" }: StreakWidgetProps) {
  const [data, setData] = useState<StreaksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStreaks() {
      try {
        setLoading(true);
        const response = await fetch("/api/streaks");

        if (!response.ok) {
          if (response.status === 401) {
            // User not logged in - show empty state
            setData({
              streaks: [],
              totalCurrentStreak: 0,
            });
            return;
          }
          throw new Error("Failed to fetch streaks");
        }

        const result: StreaksResponse = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching streaks:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchStreaks();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("text-center py-6", className)}>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Empty state (not logged in or no data)
  if (!data || data.streaks.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <Flame className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Log in to track your streaks!</p>
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.streaks.map((streak) => (
            <StreakItem key={streak.type} streak={streak} compact />
          ))}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
          <Flame className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{data.totalCurrentStreak} total</span>
        </div>
      </div>

      {/* Streak items */}
      <div className="space-y-3">
        {data.streaks.map((streak) => (
          <StreakItem key={streak.type} streak={streak} />
        ))}
      </div>

      {/* Motivational message */}
      {data.totalCurrentStreak > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {data.totalCurrentStreak >= 21
            ? "🏆 Amazing dedication! You've built lasting habits!"
            : data.totalCurrentStreak >= 7
              ? "🔥 Great progress! Keep the momentum going!"
              : "💪 Good start! Consistency is key!"}
        </p>
      )}
    </div>
  );
}

export default StreakWidget;
