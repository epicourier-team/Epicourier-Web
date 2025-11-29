"use client";

import { Calendar, Clock, Trophy, Target, Flame, Leaf, ChefHat } from "lucide-react";
import type { ChallengeWithStatus, ChallengeType } from "@/types/data";

interface ChallengeCardProps {
  challenge: ChallengeWithStatus;
  onJoin?: () => void;
  isJoining?: boolean;
}

/**
 * ChallengeCard component displays a single challenge card
 *
 * Features:
 * - Shows challenge title, description, and type badge
 * - Progress bar for joined challenges
 * - Days remaining countdown
 * - Join button for unjoned challenges
 * - Reward achievement preview
 * - Neo-brutalism design with bold borders
 */
export default function ChallengeCard({ challenge, onJoin, isJoining }: ChallengeCardProps) {
  const { title, description, type, progress, days_remaining, is_joined, reward_achievement } =
    challenge;

  // Type color mapping
  const typeColors: Record<ChallengeType, string> = {
    weekly: "bg-blue-100 text-blue-800 border-blue-300",
    monthly: "bg-purple-100 text-purple-800 border-purple-300",
    special: "bg-orange-100 text-orange-800 border-orange-300",
  };

  // Type icon mapping
  const typeIcons: Record<ChallengeType, React.ReactNode> = {
    weekly: <Calendar className="size-4" />,
    monthly: <Calendar className="size-4" />,
    special: <Trophy className="size-4" />,
  };

  // Metric icon mapping
  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "green_recipes":
        return <Leaf className="size-5 text-green-600" />;
      case "meals_logged":
        return <ChefHat className="size-5 text-orange-600" />;
      case "streak_days":
        return <Flame className="size-5 text-red-500" />;
      case "nutrient_goal_days":
        return <Target className="size-5 text-blue-600" />;
      default:
        return <Target className="size-5 text-gray-600" />;
    }
  };

  const progressPercentage = progress
    ? Math.min(Math.round((progress.current / progress.target) * 100), 100)
    : 0;

  const isCompleted = progress && progress.current >= progress.target;

  return (
    <div
      className={`brutalism-border brutalism-shadow group relative overflow-hidden bg-white transition-all hover:-translate-y-1 ${
        isCompleted ? "ring-2 ring-green-400" : ""
      }`}
    >
      {/* Type badge header */}
      <div className={`flex items-center justify-between px-4 py-2 ${typeColors[type]}`}>
        <div className="flex items-center gap-2">
          {typeIcons[type]}
          <span className="text-xs font-bold uppercase">{type}</span>
        </div>
        {days_remaining !== undefined && days_remaining > 0 && (
          <div className="flex items-center gap-1 text-xs font-semibold">
            <Clock className="size-3" />
            {days_remaining} day{days_remaining !== 1 ? "s" : ""} left
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Icon and title */}
        <div className="mb-3 flex items-start gap-3">
          <div className="brutalism-border flex size-12 shrink-0 items-center justify-center bg-gray-50">
            {getMetricIcon(challenge.criteria.metric)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="brutalism-text-bold truncate text-base text-black">{title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{description}</p>
          </div>
        </div>

        {/* Progress section */}
        {is_joined && progress && (
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-500">Progress</span>
              <span className={isCompleted ? "text-green-600" : "text-gray-700"}>
                {progress.current} / {progress.target}
              </span>
            </div>
            <div className="brutalism-border h-4 w-full overflow-hidden bg-gray-100">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompleted ? "bg-green-400" : "bg-emerald-400"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {isCompleted ? "🎉 Challenge completed!" : `${progressPercentage}% complete`}
            </p>
          </div>
        )}

        {/* Reward preview */}
        {reward_achievement && (
          <div className="mb-4 flex items-center gap-2 rounded border border-dashed border-yellow-400 bg-yellow-50 p-2">
            <Trophy className="size-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-800">
              Reward: {reward_achievement.title}
            </span>
          </div>
        )}

        {/* Action button */}
        {!is_joined && onJoin && (
          <button
            onClick={onJoin}
            disabled={isJoining}
            className="brutalism-button-primary w-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isJoining ? "Joining..." : "Join Challenge"}
          </button>
        )}

        {is_joined && !isCompleted && (
          <div className="brutalism-border bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-700">
            ✓ You&apos;re participating!
          </div>
        )}

        {isCompleted && (
          <div className="brutalism-border bg-green-100 px-4 py-2 text-center text-sm font-bold text-green-700">
            🏆 Completed!
          </div>
        )}
      </div>
    </div>
  );
}
