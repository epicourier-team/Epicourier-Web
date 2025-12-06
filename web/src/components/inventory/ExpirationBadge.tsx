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
          bg: "bg-red-100 border-red-500",
          text: "text-red-700",
          label: "Expired",
          emoji: "🚨",
        };
      case "critical":
        return {
          bg: "bg-orange-100 border-orange-500",
          text: "text-orange-800",
          label: daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`,
          emoji: "⚠️",
        };
      case "warning":
        return {
          bg: "bg-yellow-100 border-yellow-500",
          text: "text-yellow-800",
          label: `${daysUntil} days`,
          emoji: "⏰",
        };
      case "good":
        return {
          bg: "bg-emerald-100 border-emerald-500",
          text: "text-emerald-800",
          label: daysUntil !== null ? `${daysUntil} days` : "Good",
          emoji: "✓",
        };
      default:
        return {
          bg: "bg-gray-100 border-black",
          text: "text-gray-800",
          label: "No date",
          emoji: "–",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-none border-2 px-2 py-1 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        config.bg,
        config.text,
        className
      )}
    >
      <span className="text-sm">{config.emoji}</span>
      {showText && <span>{config.label}</span>}
    </span>
  );
}
