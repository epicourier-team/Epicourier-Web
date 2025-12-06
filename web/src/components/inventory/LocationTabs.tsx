"use client";

import { cn } from "@/lib/utils";
import type { InventoryLocation } from "@/types/data";

interface LocationTabsProps {
  activeLocation: InventoryLocation | "all";
  onLocationChange: (location: InventoryLocation | "all") => void;
  counts?: {
    all: number;
    pantry: number;
    fridge: number;
    freezer: number;
    other: number;
  };
  className?: string;
  disabled?: boolean;
}

const LOCATIONS: { value: InventoryLocation | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "📦" },
  { value: "pantry", label: "Pantry", emoji: "🥫" },
  { value: "fridge", label: "Fridge", emoji: "❄️" },
  { value: "freezer", label: "Freezer", emoji: "🧊" },
  { value: "other", label: "Other", emoji: "📍" },
];

/**
 * Location filter tabs for inventory page
 * Allows filtering items by storage location
 */
export default function LocationTabs({
  activeLocation,
  onLocationChange,
  counts,
  className,
  disabled = false,
}: LocationTabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", disabled && "opacity-50", className)}>
      {LOCATIONS.map(({ value, label, emoji }) => {
        const isActive = activeLocation === value;
        const count = counts?.[value] ?? 0;

        return (
          <button
            key={value}
            onClick={() => !disabled && onLocationChange(value)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 border-2 border-black px-3 py-1.5 text-sm font-bold transition-all",
              isActive
                ? "bg-emerald-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
              disabled &&
                "cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            )}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            {counts && (
              <span
                className={cn(
                  "ml-1 border border-black px-1.5 py-0.5 text-xs font-bold",
                  isActive ? "bg-white text-black" : "bg-gray-100 text-gray-800"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
