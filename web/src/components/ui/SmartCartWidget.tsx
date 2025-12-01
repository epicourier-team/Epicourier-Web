"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { SmartCartWidgetData } from "@/types/data";

/**
 * Skeleton loading state for the SmartCartWidget
 */
function WidgetSkeleton() {
  return (
    <div className="space-y-4" data-testid="smart-cart-skeleton">
      {/* Active List Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Inventory Alerts Section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      {/* Suggested Action Section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Active shopping list summary component
 */
interface ActiveListSummaryProps {
  id: string;
  name: string;
  itemCount: number;
  checkedCount: number;
  nextItems: string[];
}

function ActiveListSummary({
  id,
  name,
  itemCount,
  checkedCount,
  nextItems,
}: ActiveListSummaryProps) {
  const progress = itemCount > 0 ? (checkedCount / itemCount) * 100 : 0;
  const isComplete = itemCount > 0 && checkedCount === itemCount;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium">{name}</span>
        </div>
        {isComplete && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Complete
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="bg-muted h-2.5 overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isComplete ? "bg-emerald-500" : "bg-blue-500"
            )}
            style={{ width: `${Math.round(progress)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>
            {checkedCount}/{itemCount} items
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Next items */}
      {nextItems.length > 0 && !isComplete && (
        <p className="text-muted-foreground text-xs">Next: {nextItems.join(", ")}</p>
      )}

      <Link
        href={`/dashboard/shopping/${id}`}
        className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
      >
        Open List <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/**
 * Inventory alerts badges component
 */
interface InventoryAlertsProps {
  expiringSoon: number;
  expired: number;
  lowStock: number;
}

function InventoryAlerts({ expiringSoon, expired, lowStock }: InventoryAlertsProps) {
  const hasAlerts = expiringSoon > 0 || expired > 0 || lowStock > 0;

  if (!hasAlerts) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Package className="h-4 w-4" />
        <span>Inventory looking good!</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {expired > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            <span>{expired} expired</span>
          </span>
        )}
        {expiringSoon > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            <span>{expiringSoon} expiring</span>
          </span>
        )}
        {lowStock > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Package className="h-3 w-3" aria-hidden="true" />
            <span>{lowStock} low stock</span>
          </span>
        )}
      </div>
      <Link
        href="/dashboard/inventory"
        className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
      >
        View Inventory <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * Suggested action card component
 */
interface SuggestedActionProps {
  type: "use_expiring" | "complete_shopping" | "restock" | "none";
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

function SuggestedAction({
  type,
  title,
  description,
  actionLabel,
  actionHref,
}: SuggestedActionProps) {
  const getTypeStyles = () => {
    switch (type) {
      case "use_expiring":
        return "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800";
      case "complete_shopping":
        return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800";
      case "restock":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "use_expiring":
        return (
          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        );
      case "complete_shopping":
        return (
          <CheckCircle
            className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
        );
      case "restock":
        return (
          <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        );
      default:
        return (
          <Lightbulb className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
        );
    }
  };

  return (
    <div className={cn("rounded-lg border p-3", getTypeStyles())}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex-shrink-0">{getIcon()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
          <Link
            href={actionHref}
            className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
          >
            {actionLabel} <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for SmartCartWidget component
 */
interface SmartCartWidgetProps {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Optional title override
   */
  title?: string;
}

/**
 * SmartCartWidget - Dashboard widget showing shopping list status, inventory alerts, and suggested actions
 *
 * Features:
 * - Active shopping list summary with progress bar
 * - Inventory alerts (expiring, low stock counts)
 * - Suggested action card (e.g., "Use chicken today")
 * - Quick links to shopping list and inventory
 * - Skeleton loading state
 * - Responsive layout
 *
 * @example
 * // Full widget for dashboard
 * <SmartCartWidget />
 *
 * // With custom title
 * <SmartCartWidget title="My Smart Cart" />
 */
export function SmartCartWidget({ className, title = "Smart Cart" }: SmartCartWidgetProps) {
  const [data, setData] = useState<SmartCartWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWidgetData() {
      try {
        setLoading(true);
        const response = await fetch("/api/smart-cart-widget");

        if (!response.ok) {
          if (response.status === 401) {
            // User not logged in - show empty state
            setData(null);
            return;
          }
          throw new Error("Failed to fetch widget data");
        }

        const result: SmartCartWidgetData = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching smart cart widget data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchWidgetData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary h-5 w-5" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <WidgetSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("py-6 text-center", className)}>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  // Empty/not logged in state
  if (!data) {
    return (
      <div className={cn("py-6 text-center", className)}>
        <ShoppingCart className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
        <p className="text-muted-foreground text-sm">Log in to see your Smart Cart!</p>
      </div>
    );
  }

  // No data state (logged in but no lists/inventory)
  const hasActiveList = data.active_list !== null;
  const hasAlerts =
    data.inventory_alerts.expiring_soon > 0 ||
    data.inventory_alerts.expired > 0 ||
    data.inventory_alerts.low_stock > 0;
  const hasSuggestion = data.suggested_action !== null;

  if (!hasActiveList && !hasAlerts && !hasSuggestion) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary h-5 w-5" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="py-4 text-center">
          <Lightbulb className="text-muted-foreground mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="text-muted-foreground mb-2 text-sm">Nothing to show yet</p>
          <div className="flex flex-col gap-1">
            <Link href="/dashboard/shopping" className="text-primary text-xs hover:underline">
              Create a shopping list
            </Link>
            <Link href="/dashboard/inventory" className="text-primary text-xs hover:underline">
              Add inventory items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShoppingCart className="text-primary h-5 w-5" />
        <h3 className="font-semibold">{title}</h3>
      </div>

      {/* Active Shopping List */}
      {hasActiveList && data.active_list && (
        <ActiveListSummary
          id={data.active_list.id}
          name={data.active_list.name}
          itemCount={data.active_list.item_count}
          checkedCount={data.active_list.checked_count}
          nextItems={data.active_list.next_items}
        />
      )}

      {/* Inventory Alerts */}
      <InventoryAlerts
        expiringSoon={data.inventory_alerts.expiring_soon}
        expired={data.inventory_alerts.expired}
        lowStock={data.inventory_alerts.low_stock}
      />

      {/* Suggested Action */}
      {hasSuggestion && data.suggested_action && (
        <SuggestedAction
          type={data.suggested_action.type}
          title={data.suggested_action.title}
          description={data.suggested_action.description}
          actionLabel={data.suggested_action.action_label}
          actionHref={data.suggested_action.action_href}
        />
      )}
    </div>
  );
}

export default SmartCartWidget;
