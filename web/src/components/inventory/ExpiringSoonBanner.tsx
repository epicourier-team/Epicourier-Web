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
        "flex items-center justify-between rounded-lg border-2 border-black p-4",
        hasExpired ? "bg-red-50" : "bg-yellow-50",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            hasExpired ? "bg-red-200" : "bg-yellow-200"
          )}
        >
          <AlertTriangle
            className={cn("size-5", hasExpired ? "text-red-700" : "text-yellow-700")}
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
          "flex items-center gap-1 rounded-lg border-2 border-black px-4 py-2 font-semibold transition-colors",
          hasExpired
            ? "bg-red-200 hover:bg-red-300"
            : "bg-yellow-200 hover:bg-yellow-300"
        )}
      >
        <span>View All</span>
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
