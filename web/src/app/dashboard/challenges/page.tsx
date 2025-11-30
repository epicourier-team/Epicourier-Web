"use client";

import { useEffect, useState, useCallback } from "react";
import ChallengeCard from "@/components/ui/ChallengeCard";
import {
  Target,
  Loader2,
  RefreshCw,
  Calendar,
  CalendarDays,
  Star,
  LayoutGrid,
  Clock,
  Salad,
  Leaf,
  CheckSquare,
  ChefHat,
  Trophy,
} from "lucide-react";

import type { ChallengesResponse, ChallengeWithStatus, ChallengeCategory } from "@/types/data";

/**
 * Challenges page - displays user's challenges and participation
 *
 * Features:
 * - Tabbed interface: Active / Joined / Completed
 * - Dual view: By Time (weekly/monthly/special) or By Category
 * - Join challenge functionality
 * - Progress tracking for joined challenges
 * - Days remaining countdown
 * - Neo-brutalism design with bold panels
 * - Loading and error states
 */
export default function ChallengesPage() {
  const [tab, setTab] = useState<"active" | "joined" | "completed">("active");
  const [viewMode, setViewMode] = useState<"time" | "category">("time");
  const [data, setData] = useState<ChallengesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/challenges");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch challenges");
      }
      const result: ChallengesResponse = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const joinChallenge = async (challengeId: number) => {
    setJoiningId(challengeId);
    try {
      const res = await fetch("/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challengeId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to join challenge");
      }

      // Refresh data to show updated participation
      await fetchChallenges();
      // Switch to joined tab
      setTab("joined");
    } catch (err) {
      console.error("Error joining challenge:", err);
      alert(err instanceof Error ? err.message : "Failed to join challenge");
    } finally {
      setJoiningId(null);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Loading challenges...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="brutalism-panel max-w-md p-6 text-center">
          <p className="brutalism-text-bold mb-2 text-red-600">Error</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={fetchChallenges} className="brutalism-button-primary mt-4 px-4 py-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeChallenges = data?.active ?? [];
  const joinedChallenges = data?.joined ?? [];
  const completedChallenges = data?.completed ?? [];

  const getCurrentChallenges = (): ChallengeWithStatus[] => {
    switch (tab) {
      case "active":
        return activeChallenges;
      case "joined":
        return joinedChallenges;
      case "completed":
        return completedChallenges;
      default:
        return [];
    }
  };

  const currentChallenges = getCurrentChallenges();

  // Group challenges by type
  const groupChallengesByType = (challenges: ChallengeWithStatus[]) => {
    const grouped = {
      weekly: challenges.filter((c) => c.type === "weekly"),
      monthly: challenges.filter((c) => c.type === "monthly"),
      special: challenges.filter((c) => c.type === "special"),
    };
    return grouped;
  };

  const groupedChallenges = groupChallengesByType(currentChallenges);

  // Group challenges by category
  const groupChallengesByCategory = (challenges: ChallengeWithStatus[]) => {
    const grouped: Record<ChallengeCategory, ChallengeWithStatus[]> = {
      nutrition: challenges.filter((c) => c.category === "nutrition"),
      sustainability: challenges.filter((c) => c.category === "sustainability"),
      habits: challenges.filter((c) => c.category === "habits"),
      recipes: challenges.filter((c) => c.category === "recipes"),
      milestones: challenges.filter((c) => c.category === "milestones"),
    };
    return grouped;
  };

  const groupedByCategory = groupChallengesByCategory(currentChallenges);

  const typeConfig = {
    weekly: {
      title: "Weekly Challenges",
      icon: Calendar,
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    monthly: {
      title: "Monthly Challenges",
      icon: CalendarDays,
      color: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      borderColor: "border-purple-200",
    },
    special: {
      title: "Special Challenges",
      icon: Star,
      color: "amber",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
    },
  };

  const categoryConfig: Record<
    ChallengeCategory,
    { title: string; icon: typeof Salad; bgColor: string; textColor: string; borderColor: string }
  > = {
    nutrition: {
      title: "Nutrition Goals",
      icon: Salad,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    sustainability: {
      title: "Sustainability",
      icon: Leaf,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
    },
    habits: {
      title: "Healthy Habits",
      icon: CheckSquare,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    recipes: {
      title: "Recipe Exploration",
      icon: ChefHat,
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
    },
    milestones: {
      title: "Milestones",
      icon: Trophy,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="brutalism-border brutalism-shadow flex size-14 items-center justify-center bg-purple-100">
              <Target className="size-8 text-purple-600" />
            </div>
            <div>
              <h1 className="brutalism-text-bold text-2xl md:text-3xl">Challenges</h1>
              <p className="text-sm text-gray-600">Complete challenges to earn achievements!</p>
            </div>
          </div>

          <button
            onClick={fetchChallenges}
            disabled={loading}
            className="brutalism-button-secondary flex items-center gap-2 px-4 py-2"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tab navigation */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {[
            { key: "active", label: "Available", count: activeChallenges.length },
            { key: "joined", label: "In Progress", count: joinedChallenges.length },
            { key: "completed", label: "Completed", count: completedChallenges.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`brutalism-border px-4 py-2 text-sm font-bold whitespace-nowrap transition-all ${
                tab === key
                  ? "brutalism-shadow -translate-y-0.5 bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Group by:</span>
          <div className="flex rounded-lg border-2 border-black bg-white">
            <button
              onClick={() => setViewMode("time")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold transition-all ${
                viewMode === "time" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Clock className="size-4" />
              Time
            </button>
            <button
              onClick={() => setViewMode("category")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold transition-all ${
                viewMode === "category" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LayoutGrid className="size-4" />
              Category
            </button>
          </div>
        </div>

        {/* Challenge sections */}
        {currentChallenges.length === 0 ? (
          <div className="brutalism-panel p-8 text-center">
            <Target className="mx-auto mb-4 size-12 text-gray-400" />
            <p className="brutalism-text-bold text-gray-500">
              {tab === "active" && "No available challenges right now."}
              {tab === "joined" && "You haven't joined any challenges yet."}
              {tab === "completed" && "No completed challenges yet. Keep going!"}
            </p>
            {tab !== "active" && (
              <button
                onClick={() => setTab("active")}
                className="brutalism-button-primary mt-4 px-4 py-2"
              >
                Browse Challenges
              </button>
            )}
          </div>
        ) : viewMode === "time" ? (
          /* Group by Time (Weekly/Monthly/Special) */
          <div className="space-y-8">
            {(["weekly", "monthly", "special"] as const).map((type) => {
              const challenges = groupedChallenges[type];
              if (challenges.length === 0) return null;

              const config = typeConfig[type];
              const IconComponent = config.icon;

              return (
                <section key={type}>
                  {/* Section Header */}
                  <div className={`mb-4 flex items-center gap-3 rounded-lg ${config.bgColor} p-3`}>
                    <div className={`rounded-lg bg-white p-2 ${config.borderColor} border-2`}>
                      <IconComponent className={`size-5 ${config.textColor}`} />
                    </div>
                    <div>
                      <h2 className={`font-bold ${config.textColor}`}>{config.title}</h2>
                      <p className="text-sm text-gray-600">
                        {challenges.length} challenge{challenges.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Challenge Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {challenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onJoin={tab === "active" ? () => joinChallenge(challenge.id) : undefined}
                        isJoining={joiningId === challenge.id}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Group by Category (Nutrition/Sustainability/Habits/Recipes/Milestones) */
          <div className="space-y-8">
            {(["nutrition", "sustainability", "habits", "recipes", "milestones"] as const).map(
              (category) => {
                const challenges = groupedByCategory[category];
                if (challenges.length === 0) return null;

                const config = categoryConfig[category];
                const IconComponent = config.icon;

                return (
                  <section key={category}>
                    {/* Section Header */}
                    <div
                      className={`mb-4 flex items-center gap-3 rounded-lg ${config.bgColor} p-3`}
                    >
                      <div className={`rounded-lg bg-white p-2 ${config.borderColor} border-2`}>
                        <IconComponent className={`size-5 ${config.textColor}`} />
                      </div>
                      <div>
                        <h2 className={`font-bold ${config.textColor}`}>{config.title}</h2>
                        <p className="text-sm text-gray-600">
                          {challenges.length} challenge{challenges.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Challenge Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {challenges.map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          onJoin={tab === "active" ? () => joinChallenge(challenge.id) : undefined}
                          isJoining={joiningId === challenge.id}
                        />
                      ))}
                    </div>
                  </section>
                );
              }
            )}
          </div>
        )}

        {/* Stats summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="brutalism-border brutalism-shadow bg-blue-50 p-4 text-center">
            <p className="brutalism-text-bold text-2xl text-blue-700">{activeChallenges.length}</p>
            <p className="text-sm font-medium text-blue-600">Available</p>
          </div>
          <div className="brutalism-border brutalism-shadow bg-yellow-50 p-4 text-center">
            <p className="brutalism-text-bold text-2xl text-yellow-700">
              {joinedChallenges.length}
            </p>
            <p className="text-sm font-medium text-yellow-600">In Progress</p>
          </div>
          <div className="brutalism-border brutalism-shadow bg-green-50 p-4 text-center">
            <p className="brutalism-text-bold text-2xl text-green-700">
              {completedChallenges.length}
            </p>
            <p className="text-sm font-medium text-green-600">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
