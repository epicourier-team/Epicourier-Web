"use client";

import { useEffect, useState } from "react";
import BadgeCard from "@/components/ui/BadgeCard";
import { Trophy, Loader2, RefreshCw } from "lucide-react";

import type { AchievementsResponse } from "@/types/data";

/**
 * Achievements page - displays user's earned and available achievements
 * 
 * Features:
 * - Tabbed interface: Earned / Available
 * - Real-time progress tracking for locked achievements
 * - Manual achievement check button
 * - Neo-brutalism design with bold panels
 * - Loading and error states
 */
export default function AchievementsPage() {
  const [tab, setTab] = useState<"earned" | "available">("earned");
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/achievements");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch achievements");
      }
      const result: AchievementsResponse = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    setChecking(true);
    setNewAchievements([]);
    try {
      const res = await fetch("/api/achievements/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to check achievements");
      }

      const result = await res.json();
      if (result.newly_earned && result.newly_earned.length > 0) {
        setNewAchievements(result.newly_earned.map((a: any) => a.title));
        // Refresh data to show newly earned achievements
        await fetchAchievements();
      }
    } catch (err) {
      console.error("Error checking achievements:", err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Loading achievements...</span>
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
          <button
            onClick={fetchAchievements}
            className="brutalism-button-primary mt-4 px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const earnedCount = data?.earned.length || 0;
  const availableCount = data?.available.length || 0;
  const totalCount = earnedCount + availableCount;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="brutalism-banner mb-6 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="size-8" />
            <div>
              <h1 className="brutalism-title text-2xl">Achievements</h1>
              <p className="text-sm font-semibold text-gray-700">
                {earnedCount} / {totalCount} unlocked
              </p>
            </div>
          </div>
          <button
            onClick={checkAchievements}
            disabled={checking}
            className="brutalism-button-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                <span>Check Progress</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* New achievements notification */}
      {newAchievements.length > 0 && (
        <div className="brutalism-banner-accent mb-6 p-4">
          <p className="brutalism-text-bold mb-1">🎉 Congratulations!</p>
          <p className="text-sm">
            You earned: <strong>{newAchievements.join(", ")}</strong>
          </p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="brutalism-panel mb-6 overflow-hidden p-0">
        <div className="flex">
          <button
            onClick={() => setTab("earned")}
            className={`brutalism-border brutalism-hover brutalism-active flex-1 border-y-0 border-l-0 px-6 py-3 font-bold transition-colors ${
              tab === "earned" ? "bg-emerald-400" : "bg-white hover:bg-amber-100"
            }`}
          >
            Earned ({earnedCount})
          </button>
          <button
            onClick={() => setTab("available")}
            className={`brutalism-border brutalism-hover brutalism-active flex-1 border-y-0 border-r-0 px-6 py-3 font-bold transition-colors ${
              tab === "available" ? "bg-emerald-400" : "bg-white hover:bg-amber-100"
            }`}
          >
            Available ({availableCount})
          </button>
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tab === "earned" &&
          (earnedCount > 0 ? (
            data?.earned.map((userAchievement) => (
              <BadgeCard
                key={userAchievement.id}
                achievement={userAchievement}
                isLocked={false}
              />
            ))
          ) : (
            <div className="brutalism-panel col-span-full p-8 text-center">
              <p className="text-gray-500">No achievements earned yet. Keep exploring!</p>
            </div>
          ))}

        {tab === "available" &&
          (availableCount > 0 ? (
            data?.available.map((achievement) => (
              <BadgeCard
                key={achievement.id}
                achievement={achievement}
                isLocked={true}
                progress={data.progress[achievement.name]}
              />
            ))
          ) : (
            <div className="brutalism-panel col-span-full p-8 text-center">
              <p className="text-gray-500">
                Amazing! You&apos;ve unlocked all achievements! 🎉
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
