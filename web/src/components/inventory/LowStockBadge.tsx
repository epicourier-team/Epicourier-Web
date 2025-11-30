"use client";

import { cn } from "@/lib/utils";

interface LowStockBadgeProps {
  isLowStock: boolean;
  quantity: number;
  minQuantity: number | null;
  className?: string;
}

/**
 * Low stock indicator badge for inventory items
 */
export default function LowStockBadge({
  isLowStock,
  quantity,
  minQuantity,
  className,
}: LowStockBadgeProps) {
  if (!isLowStock || minQuantity === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-purple-300 bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700",
        className
      )}
    >
      <span>📉</span>
      <span>
        Low ({quantity}/{minQuantity})
      </span>
    </span>
  );
}
