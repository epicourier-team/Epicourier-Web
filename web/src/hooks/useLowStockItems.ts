"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { InventoryItemWithDetails } from "@/types/data";
import {
  getLowStockItems,
  getLowStockSummary,
  sortByStockStatus,
} from "@/utils/inventory/lowStock";

interface UseLowStockItemsReturn {
  /** Items that are low on stock */
  lowStockItems: InventoryItemWithDetails[];
  /** Summary of stock statuses */
  summary: {
    criticalCount: number;
    lowCount: number;
    adequateCount: number;
    unknownCount: number;
    totalLow: number;
  };
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
}

interface UseLowStockItemsOptions {
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

/**
 * Hook for fetching and managing low stock inventory items
 */
export function useLowStockItems(
  options: UseLowStockItemsOptions = {}
): UseLowStockItemsReturn {
  const { autoFetch = true } = options;

  const [allItems, setAllItems] = useState<InventoryItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/inventory");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch inventory");
      }

      const data = await response.json();
      setAllItems(data.items || []);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Failed to fetch low stock items");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchItems();
    }
  }, [autoFetch, fetchItems]);

  // Transform items to have the required properties for utility functions
  const itemsWithStockInfo = useMemo(() => {
    return allItems.map((item) => ({
      ...item,
      quantity: item.quantity,
      min_quantity: item.min_quantity,
    }));
  }, [allItems]);

  const lowStockItems = useMemo(() => {
    const lowItems = getLowStockItems(itemsWithStockInfo);
    return sortByStockStatus(lowItems) as InventoryItemWithDetails[];
  }, [itemsWithStockInfo]);

  const summary = useMemo(() => {
    return getLowStockSummary(itemsWithStockInfo);
  }, [itemsWithStockInfo]);

  return {
    lowStockItems,
    summary,
    isLoading,
    error,
    refresh: fetchItems,
  };
}

export default useLowStockItems;
