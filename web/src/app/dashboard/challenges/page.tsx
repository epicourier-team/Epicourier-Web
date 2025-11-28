"use client";

import { useEffect, useState, useCallback } from "react";
import ChallengeCard from "@/components/ui/ChallengeCard";
import { Target, Loader2, RefreshCw } from "lucide-react";

import type { ChallengesResponse, ChallengeWithStatus } from "@/types/data";

/**
 * Challenges page - displays user's challenges and participation
 *
 * Features:
 * - Tabbed interface: Active / Joined / Completed
 * - Join challenge functionality
 * - Progress tracking for joined challenges
 * - Days remaining countdown
 * - Neo-brutalism design with bold panels
 * - Loading and error states
 */
export default function ChallengesPage() {
  const [tab, setTab] = useState<"active" | "joined" | "completed">("active");
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
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { key: "active", label: "Available", count: activeChallenges.length },
            { key: "joined", label: "In Progress", count: joinedChallenges.length },
            { key: "completed", label: "Completed", count: completedChallenges.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`brutalism-border whitespace-nowrap px-4 py-2 text-sm font-bold transition-all ${
                tab === key
                  ? "brutalism-shadow -translate-y-0.5 bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Challenge grid */}
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
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={tab === "active" ? () => joinChallenge(challenge.id) : undefined}
                isJoining={joiningId === challenge.id}
              />
            ))}
          </div>
        )}

        {/* Stats summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="brutalism-border brutalism-shadow bg-blue-50 p-4 text-center">
            <p className="brutalism-text-bold text-2xl text-blue-700">{activeChallenges.length}</p>
            <p className="text-sm font-medium text-blue-600">Available</p>
          </div>
          <div className="brutalism-border brutalism-shadow bg-yellow-50 p-4 text-center">
            <p className="brutalism-text-bold text-2xl text-yellow-700">{joinedChallenges.length}</p>
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
