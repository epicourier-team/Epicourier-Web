"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  ChefHat,
  Flame,
  Leaf,
  Trees,
  Trophy,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Image from "next/image";
import { Achievement, BadgeTier } from "@/types/data";

export interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
  duration?: number;
}

// Lucide icon map (same as BadgeCard)
const lucideIconMap: Record<string, ComponentType<{ className?: string }>> = {
  utensils: UtensilsCrossed,
  "chef-hat": ChefHat,
  calendar: Calendar,
  leaf: Leaf,
  activity: Activity,
  chart: BarChart3,
  flame: Flame,
  tree: Trees,
  trophy: Trophy,
};

// Tier color mapping with celebration colors
const tierStyles: Record<
  BadgeTier,
  {
    bg: string;
    border: string;
    accent: string;
    glow: string;
  }
> = {
  bronze: {
    bg: "bg-amber-50",
    border: "border-amber-700",
    accent: "bg-amber-700",
    glow: "shadow-amber-400/50",
  },
  silver: {
    bg: "bg-gray-50",
    border: "border-gray-400",
    accent: "bg-gray-400",
    glow: "shadow-gray-400/50",
  },
  gold: {
    bg: "bg-yellow-50",
    border: "border-yellow-500",
    accent: "bg-yellow-500",
    glow: "shadow-yellow-400/50",
  },
  platinum: {
    bg: "bg-cyan-50",
    border: "border-cyan-400",
    accent: "bg-cyan-400",
    glow: "shadow-cyan-400/50",
  },
};

/**
 * AchievementToast - A celebratory toast notification for earned achievements
 *
 * Features:
 * - Animated entrance with slide-in and scale effect
 * - Tier-based coloring (bronze, silver, gold, platinum)
 * - Confetti/sparkle animation on display
 * - Achievement icon, title, and description
 * - Auto-dismiss with configurable duration
 * - Neo-brutalism design consistent with app styling
 */
export function AchievementToast({ achievement, onClose, duration = 5000 }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const { title, description, icon, tier } = achievement;
  const styles = tierStyles[tier] || tierStyles.bronze;

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const renderIcon = () => {
    // Check if icon is a URL
    if (
      icon &&
      (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/"))
    ) {
      return (
        <Image
          src={icon}
          alt={`${title} badge`}
          width={48}
          height={48}
          unoptimized
          className="size-12 object-contain"
        />
      );
    }

    // Use Lucide icon
    const IconComponent = icon ? lucideIconMap[icon.toLowerCase()] : Trophy;
    if (IconComponent) {
      return <IconComponent className="size-12" />;
    }

    return <Trophy className="size-12" />;
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[200] w-[380px] max-w-[calc(100vw-2rem)] transform transition-all duration-300 ease-out ${isVisible && !isExiting ? "translate-x-0 scale-100 opacity-100" : "translate-x-full scale-95 opacity-0"} `}
      role="alert"
      aria-live="polite"
    >
      {/* Main toast container */}
      <div
        className={`relative overflow-hidden border-2 border-black ${styles.bg} shadow-[6px_6px_0_0_rgba(0,0,0,1)]`}
      >
        {/* Top accent bar with tier color */}
        <div className={`h-2 ${styles.accent}`} />

        {/* Confetti/sparkle decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Sparkles tier={tier} />
        </div>

        {/* Content */}
        <div className="relative p-4">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 rounded-none border-2 border-black bg-white p-1 text-black transition-colors hover:bg-black hover:text-white"
            aria-label="Close notification"
          >
            <X className="size-4" />
          </button>

          {/* Header with celebration text */}
          <div className="mb-3 flex items-center gap-2">
            <span className="animate-bounce text-2xl">🎉</span>
            <span className="text-sm font-bold tracking-wide text-gray-600 uppercase">
              Achievement Unlocked!
            </span>
          </div>

          {/* Achievement info */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`flex size-16 shrink-0 items-center justify-center border-2 border-black ${styles.bg} animate-achievement-pop`}
            >
              {renderIcon()}
            </div>

            {/* Text content */}
            <div className="min-w-0 flex-1 pr-6">
              <h3 className="mb-1 text-lg font-black text-black">{title}</h3>
              <p className="text-sm text-gray-700">{description}</p>

              {/* Tier badge */}
              <div
                className={`mt-2 inline-block border-2 border-black px-2 py-0.5 text-xs font-bold uppercase ${styles.bg} ${styles.border} `}
              >
                {tier}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sparkles component - Animated decorative elements
 */
function Sparkles({ tier }: { tier: BadgeTier }) {
  const sparkleColors: Record<BadgeTier, string> = {
    bronze: "bg-amber-500",
    silver: "bg-gray-300",
    gold: "bg-yellow-400",
    platinum: "bg-cyan-300",
  };

  const color = sparkleColors[tier] || sparkleColors.bronze;

  return (
    <>
      {/* Animated sparkles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`absolute size-2 rounded-full ${color} animate-sparkle opacity-0`}
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </>
  );
}

export default AchievementToast;
