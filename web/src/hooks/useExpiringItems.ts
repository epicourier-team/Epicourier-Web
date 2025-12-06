"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { InventoryItemWithDetails } from "@/types/data";
import { getExpiringItems, getExpiredItems, sortByExpiration } from "@/utils/inventory/expiration";

interface UseExpiringItemsOptions {
  /** Number of days to look ahead for expiring items (default: 7) */
  days?: number;
  /** Whether to include expired items */
  includeExpired?: boolean;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseExpiringItemsReturn {
  /** Items expiring within the specified days */
  expiringItems: InventoryItemWithDetails[];
  /** Items that have already expired */
  expiredItems: InventoryItemWithDetails[];
  /** Total count of items needing attention */
  totalCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing expiring inventory items
 */
export function useExpiringItems(options: UseExpiringItemsOptions = {}): UseExpiringItemsReturn {
  const { days = 7, includeExpired = true, autoFetch = true } = options;

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
        setError(err.message || "Failed to fetch expiring items");
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

  // Transform items to have expiration_date property for utility functions
  // Using allItems directly since items already have expiration_date
  const expiringItems = useMemo(() => {
    const expiring = getExpiringItems(allItems, days);
    return sortByExpiration(expiring) as InventoryItemWithDetails[];
  }, [allItems, days]);

  const expiredItems = useMemo(() => {
    const expired = getExpiredItems(allItems);
    return sortByExpiration(expired) as InventoryItemWithDetails[];
  }, [allItems]);

  const totalCount = useMemo(() => {
    return expiringItems.length + (includeExpired ? expiredItems.length : 0);
  }, [expiringItems, expiredItems, includeExpired]);

  return {
    expiringItems,
    expiredItems,
    totalCount,
    isLoading,
    error,
    refresh: fetchItems,
  };
}

export default useExpiringItems;
