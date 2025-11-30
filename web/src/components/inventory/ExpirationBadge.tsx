"use client";

import { cn } from "@/lib/utils";
import type { ExpirationStatus } from "@/types/data";

interface ExpirationBadgeProps {
  status: ExpirationStatus;
  daysUntil: number | null;
  className?: string;
  showText?: boolean;
}

/**
 * Color-coded expiration badge for inventory items
 *
 * Colors:
 * - Expired: Red (bg-red-100, text-red-700)
 * - Critical (0-2 days): Orange (bg-orange-100, text-orange-700)
 * - Warning (3-7 days): Yellow (bg-yellow-100, text-yellow-700)
 * - Good (>7 days): Green (bg-green-100, text-green-700)
 * - Unknown: Gray (bg-gray-100, text-gray-600)
 */
export default function ExpirationBadge({
  status,
  daysUntil,
  className,
  showText = true,
}: ExpirationBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "expired":
        return {
          bg: "bg-red-100 border-red-300",
          text: "text-red-700",
          label: "Expired",
          emoji: "🚨",
        };
      case "critical":
        return {
          bg: "bg-orange-100 border-orange-300",
          text: "text-orange-700",
          label: daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`,
          emoji: "⚠️",
        };
      case "warning":
        return {
          bg: "bg-yellow-100 border-yellow-300",
          text: "text-yellow-700",
          label: `${daysUntil} days`,
          emoji: "⏰",
        };
      case "good":
        return {
          bg: "bg-green-100 border-green-300",
          text: "text-green-700",
          label: daysUntil !== null ? `${daysUntil} days` : "Good",
          emoji: "✓",
        };
      default:
        return {
          bg: "bg-gray-100 border-gray-300",
          text: "text-gray-600",
          label: "No date",
          emoji: "–",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold",
        config.bg,
        config.text,
        className
      )}
    >
      <span>{config.emoji}</span>
      {showText && <span>{config.label}</span>}
    </span>
  );
}
