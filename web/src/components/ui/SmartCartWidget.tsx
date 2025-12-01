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
import Link from "next/link";
import type { SmartCartWidgetData } from "@/types/data";

/**
 * Skeleton loading state for the SmartCartWidget - Horizontal Neo-Brutalism Style
 */
function WidgetSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="smart-cart-skeleton">
      {/* Active List Section */}
      <div className="brutalism-border space-y-2 bg-gray-50 p-4">
        <div className="h-4 w-24 animate-pulse bg-gray-200" />
        <div className="h-3 w-full animate-pulse bg-gray-200" />
        <div className="h-4 w-32 animate-pulse bg-gray-200" />
      </div>

      {/* Inventory Alerts Section */}
      <div className="brutalism-border space-y-2 bg-gray-50 p-4">
        <div className="h-4 w-28 animate-pulse bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse bg-gray-200" />
          <div className="h-6 w-20 animate-pulse bg-gray-200" />
        </div>
      </div>

      {/* Suggested Action Section */}
      <div className="brutalism-border space-y-2 bg-gray-50 p-4 sm:col-span-2 lg:col-span-1">
        <div className="h-4 w-28 animate-pulse bg-gray-200" />
        <div className="h-12 w-full animate-pulse bg-gray-200" />
      </div>
    </div>
  );
}

/**
 * Active shopping list summary component - Neo-Brutalism Style
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
    <div className="brutalism-border bg-teal-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="brutalism-border bg-teal-300 p-1">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold uppercase">{name}</span>
        </div>
        {isComplete && (
          <span className="brutalism-border flex items-center gap-1 bg-emerald-300 px-2 py-0.5 text-xs font-bold">
            <CheckCircle className="h-3 w-3" />
            Done
          </span>
        )}
      </div>

      {/* Progress bar - Brutalism style */}
      <div className="mb-2 space-y-1">
        <div className="brutalism-border h-4 overflow-hidden bg-white">
          <div
            className={cn(
              "h-full transition-all duration-300",
              isComplete ? "bg-emerald-400" : "bg-teal-400"
            )}
            style={{ width: `${Math.round(progress)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="flex justify-between text-xs font-bold">
          <span>
            {checkedCount}/{itemCount} items
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Next items */}
      {nextItems.length > 0 && !isComplete && (
        <p className="mb-2 text-xs text-gray-600">
          <span className="font-bold">Next:</span> {nextItems.join(", ")}
        </p>
      )}

      <Link
        href={`/dashboard/shopping/${id}`}
        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 underline hover:text-teal-900"
      >
        Open List <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/**
 * Inventory alerts badges component - Neo-Brutalism Style
 */
interface InventoryAlertsProps {
  expiringSoon: number;
  expired: number;
  lowStock: number;
}

function InventoryAlerts({ expiringSoon, expired, lowStock }: InventoryAlertsProps) {
  const hasAlerts = expiringSoon > 0 || expired > 0 || lowStock > 0;

  return (
    <div className="brutalism-border bg-cyan-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="brutalism-border bg-cyan-300 p-1">
          <Package className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold uppercase">Inventory</span>
      </div>

      {!hasAlerts ? (
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>All good!</span>
        </div>
      ) : (
        <div className="mb-2 flex flex-wrap gap-2">
          {expired > 0 && (
            <span className="brutalism-border inline-flex items-center gap-1 bg-red-300 px-2 py-0.5 text-xs font-bold">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {expired} expired
            </span>
          )}
          {expiringSoon > 0 && (
            <span className="brutalism-border inline-flex items-center gap-1 bg-amber-300 px-2 py-0.5 text-xs font-bold">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {expiringSoon} expiring
            </span>
          )}
          {lowStock > 0 && (
            <span className="brutalism-border inline-flex items-center gap-1 bg-blue-300 px-2 py-0.5 text-xs font-bold">
              <Package className="h-3 w-3" aria-hidden="true" />
              {lowStock} low stock
            </span>
          )}
        </div>
      )}

      <Link
        href="/dashboard/inventory"
        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 underline hover:text-cyan-900"
      >
        View Inventory <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * Suggested action card component - Neo-Brutalism Style
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
        return { bg: "bg-amber-50", icon: "bg-amber-300", text: "text-amber-700" };
      case "complete_shopping":
        return { bg: "bg-emerald-50", icon: "bg-emerald-300", text: "text-emerald-700" };
      case "restock":
        return { bg: "bg-blue-50", icon: "bg-blue-300", text: "text-blue-700" };
      default:
        return { bg: "bg-gray-50", icon: "bg-gray-300", text: "text-gray-700" };
    }
  };

  const getIcon = () => {
    switch (type) {
      case "use_expiring":
        return <Lightbulb className="h-4 w-4" aria-hidden="true" />;
      case "complete_shopping":
        return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
      case "restock":
        return <ShoppingCart className="h-4 w-4" aria-hidden="true" />;
      default:
        return <Lightbulb className="h-4 w-4" aria-hidden="true" />;
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={cn("brutalism-border p-4", styles.bg)}>
      <div className="mb-2 flex items-center gap-2">
        <div className={cn("brutalism-border p-1", styles.icon)}>{getIcon()}</div>
        <span className="text-sm font-bold uppercase">Suggestion</span>
      </div>
      <p className="mb-1 truncate text-sm font-bold">{title}</p>
      <p className="mb-2 text-xs text-gray-600">{description}</p>
      <Link
        href={actionHref}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-bold underline hover:opacity-80",
          styles.text
        )}
      >
        {actionLabel} <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
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
 * Now with horizontal Neo-Brutalism layout
 *
 * Features:
 * - Active shopping list summary with progress bar
 * - Inventory alerts (expiring, low stock counts)
 * - Suggested action card (e.g., "Use chicken today")
 * - Quick links to shopping list and inventory
 * - Skeleton loading state
 * - Responsive horizontal layout
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
      <div className={cn("w-full", className)}>
        <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="brutalism-border bg-teal-300 p-1.5">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <h3 className="font-black uppercase">{title}</h3>
          </div>
        </div>
        <WidgetSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("w-full", className)}>
        <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="brutalism-border bg-teal-300 p-1.5">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <h3 className="font-black uppercase">{title}</h3>
          </div>
        </div>
        <div className="brutalism-border bg-red-50 py-6 text-center">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Empty/not logged in state
  if (!data) {
    return (
      <div className={cn("w-full", className)}>
        <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="brutalism-border bg-teal-300 p-1.5">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <h3 className="font-black uppercase">{title}</h3>
          </div>
        </div>
        <div className="brutalism-border bg-gray-50 py-6 text-center">
          <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm font-bold">Log in to see your Smart Cart!</p>
        </div>
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
      <div className={cn("w-full", className)}>
        <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="brutalism-border bg-teal-300 p-1.5">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <h3 className="font-black uppercase">{title}</h3>
          </div>
        </div>
        <div className="brutalism-border bg-gray-50 py-6 text-center">
          <Lightbulb className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="mb-2 text-sm font-bold">Nothing to show yet</p>
          <div className="flex flex-col gap-1">
            <Link href="/dashboard/shopping" className="text-xs font-bold text-teal-600 underline">
              Create a shopping list
            </Link>
            <Link href="/dashboard/inventory" className="text-xs font-bold text-cyan-600 underline">
              Add inventory items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate grid columns based on content
  const contentCount = [hasActiveList, true, hasSuggestion].filter(Boolean).length;

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <div className="brutalism-border bg-teal-300 p-1.5">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <h3 className="font-black uppercase">{title}</h3>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/shopping"
            className="brutalism-border bg-teal-200 px-3 py-1 text-xs font-bold hover:bg-teal-300"
          >
            Shopping
          </Link>
          <Link
            href="/dashboard/inventory"
            className="brutalism-border bg-cyan-200 px-3 py-1 text-xs font-bold hover:bg-cyan-300"
          >
            Inventory
          </Link>
        </div>
      </div>

      {/* Horizontal Grid Layout */}
      <div
        className={cn(
          "grid gap-4",
          contentCount === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"
        )}
      >
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
    </div>
  );
}

export default SmartCartWidget;
