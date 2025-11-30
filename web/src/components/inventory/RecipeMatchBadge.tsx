import { ChefHat, CheckCircle2, AlertCircle } from "lucide-react";
import { getMatchLabel, getMatchColor } from "@/utils/inventory/recipeMatch";

interface RecipeMatchBadgeProps {
  /** Match percentage (0-100) */
  matchPercentage: number;
  /** Number of available ingredients */
  availableCount?: number;
  /** Total number of ingredients */
  totalCount?: number;
  /** Show icon */
  showIcon?: boolean;
  /** Show fraction (e.g., "3/5") */
  showFraction?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const colorStyles = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

/**
 * Badge component to display recipe ingredient match percentage
 */
export function RecipeMatchBadge({
  matchPercentage,
  availableCount,
  totalCount,
  showIcon = true,
  showFraction = false,
  size = "md",
  className = "",
}: RecipeMatchBadgeProps) {
  const color = getMatchColor(matchPercentage);
  const label = getMatchLabel(matchPercentage);

  const Icon =
    matchPercentage === 100 ? CheckCircle2 : matchPercentage >= 50 ? ChefHat : AlertCircle;

  const iconSize = size === "sm" ? "size-3" : size === "lg" ? "size-5" : "size-4";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorStyles[color]} ${sizeStyles[size]} ${className}`}
      title={label}
      data-testid="recipe-match-badge"
      data-percentage={matchPercentage}
    >
      {showIcon && <Icon className={iconSize} />}
      <span>
        {matchPercentage}%
        {showFraction && totalCount !== undefined && availableCount !== undefined && (
          <span className="ml-1 opacity-75">
            ({availableCount}/{totalCount})
          </span>
        )}
      </span>
    </span>
  );
}

export default RecipeMatchBadge;
