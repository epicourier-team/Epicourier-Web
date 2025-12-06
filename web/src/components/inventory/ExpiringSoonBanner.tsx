"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpiringSoonBannerProps {
  expiredCount: number;
  expiringCount: number;
  onViewAll: () => void;
  className?: string;
}

/**
 * Banner showing count of expired and expiring items
 * Displays at top of inventory page as a warning
 */
export default function ExpiringSoonBanner({
  expiredCount,
  expiringCount,
  onViewAll,
  className,
}: ExpiringSoonBannerProps) {
  const totalCount = expiredCount + expiringCount;

  if (totalCount === 0) {
    return null;
  }

  const hasExpired = expiredCount > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        hasExpired ? "bg-red-100" : "bg-yellow-100",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center border-2 border-black",
            hasExpired ? "bg-red-300" : "bg-yellow-300"
          )}
        >
          <AlertTriangle
            className={cn("size-5", hasExpired ? "text-red-800" : "text-yellow-800")}
          />
        </div>
        <div>
          <p className="font-bold text-gray-900">
            {hasExpired ? (
              <>
                {expiredCount} item{expiredCount !== 1 ? "s" : ""} expired
                {expiringCount > 0 && (
                  <span className="font-normal text-gray-600">
                    {" "}
                    + {expiringCount} expiring soon
                  </span>
                )}
              </>
            ) : (
              <>
                {expiringCount} item{expiringCount !== 1 ? "s" : ""} expiring soon
              </>
            )}
          </p>
          <p className="text-sm text-gray-600">
            {hasExpired
              ? "Remove expired items or use them immediately"
              : "Use these items before they expire"}
          </p>
        </div>
      </div>
      <button
        onClick={onViewAll}
        className={cn(
          "brutalism-button flex items-center gap-1 px-4 py-2 transition-colors",
          hasExpired ? "bg-red-300 hover:bg-red-400" : "bg-yellow-300 hover:bg-yellow-400"
        )}
      >
        <span>View All</span>
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
