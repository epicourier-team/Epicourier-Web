import { Achievement, UserAchievement, BadgeTier } from "@/types/data";

interface BadgeCardProps {
  achievement: Achievement | UserAchievement;
  isLocked: boolean;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

/**
 * BadgeCard component displays a single achievement/badge card
 * 
 * Features:
 * - Shows badge icon, title, description, and tier
 * - Locked state with grayscale filter and progress bar
 * - Unlocked state with colored border based on tier
 * - Earned date display for unlocked achievements
 * - Neo-brutalism design with bold borders and shadows
 */
export default function BadgeCard({ achievement, isLocked, progress }: BadgeCardProps) {
  // Extract achievement data (handle both Achievement and UserAchievement types)
  const achievementData = "achievement" in achievement ? achievement.achievement : achievement;
  
  if (!achievementData) {
    return null;
  }

  const { title, description, icon, tier } = achievementData;
  const earnedAt = !isLocked && "earned_at" in achievement ? achievement.earned_at : null;

  // Tier color mapping
  const tierColors: Record<BadgeTier, string> = {
    bronze: "border-amber-700 bg-amber-50",
    silver: "border-gray-400 bg-gray-50",
    gold: "border-yellow-500 bg-yellow-50",
    platinum: "border-cyan-400 bg-cyan-50",
  };

  const tierBorderColor = tierColors[tier] || "border-gray-300 bg-gray-50";

  return (
    <div
      className={`brutalism-border brutalism-shadow group relative overflow-hidden bg-white transition-all ${
        isLocked ? "opacity-75" : ""
      }`}
    >
      {/* Tier accent border on top */}
      <div className={`h-2 ${tierBorderColor.split(" ")[1]}`} />

      <div className="p-4">
        {/* Icon and tier badge */}
        <div className="mb-3 flex items-start justify-between">
          <div
            className={`brutalism-border flex size-16 items-center justify-center text-4xl ${
              isLocked ? "grayscale" : tierBorderColor
            }`}
          >
            {icon}
          </div>
          <div
            className={`brutalism-border brutalism-shadow-sm px-2 py-1 text-xs font-bold uppercase ${
              isLocked ? "bg-gray-200 text-gray-500" : tierBorderColor
            }`}
          >
            {tier}
          </div>
        </div>

        {/* Title and description */}
        <h3
          className={`brutalism-text-bold mb-1 text-base ${
            isLocked ? "text-gray-500" : "text-black"
          }`}
        >
          {title}
        </h3>
        <p className={`text-sm ${isLocked ? "text-gray-400" : "text-gray-600"}`}>
          {description}
        </p>

        {/* Progress bar (only for locked achievements) */}
        {isLocked && progress && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-500">Progress</span>
              <span className="text-gray-700">
                {progress.current} / {progress.target}
              </span>
            </div>
            <div className="brutalism-border h-3 w-full overflow-hidden bg-gray-100">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{progress.percentage}% complete</p>
          </div>
        )}

        {/* Earned date (only for unlocked achievements) */}
        {!isLocked && earnedAt && (
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <span>✓</span>
            <span>
              Earned on {new Date(earnedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Locked overlay */}
        {isLocked && (
          <div className="brutalism-border absolute right-4 top-16 bg-gray-200 px-2 py-1 text-xs font-bold uppercase text-gray-600">
            🔒 Locked
          </div>
        )}
      </div>
    </div>
  );
}
