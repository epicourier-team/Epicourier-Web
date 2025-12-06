"use client";

import { useState, useEffect, useCallback } from "react";
import {
  InventoryItemWithDetails,
  InventorySummary,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  InventoryLocation,
} from "@/types/data";

interface UseInventoryOptions {
  /** Initial location filter */
  location?: InventoryLocation | "all";
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseInventoryReturn {
  /** List of inventory items with details */
  items: InventoryItemWithDetails[];
  /** Summary statistics */
  summary: InventorySummary | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh inventory data */
  refresh: () => Promise<void>;
  /** Add a new item */
  addItem: (data: CreateInventoryItemRequest) => Promise<boolean>;
  /** Update an existing item */
  updateItem: (id: string, data: UpdateInventoryItemRequest) => Promise<boolean>;
  /** Delete an item */
  deleteItem: (id: string) => Promise<boolean>;
  /** Filter by location */
  setLocationFilter: (location: InventoryLocation | "all") => void;
  /** Current location filter */
  locationFilter: InventoryLocation | "all";
}

/**
 * Hook for managing inventory items
 */
export function useInventory(options: UseInventoryOptions = {}): UseInventoryReturn {
  const { location = "all", autoFetch = true } = options;

  const [items, setItems] = useState<InventoryItemWithDetails[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<InventoryLocation | "all">(location);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (locationFilter !== "all") {
        params.append("location", locationFilter);
      }

      const response = await fetch(`/api/inventory?${params.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch inventory");
      }

      const data = await response.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Failed to fetch inventory");
      }
    } finally {
      setIsLoading(false);
    }
  }, [locationFilter]);

  const addItem = useCallback(
    async (data: CreateInventoryItemRequest): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to add item");
        }

        await fetchInventory();
        return true;
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
        return false;
      }
    },
    [fetchInventory]
  );

  const updateItem = useCallback(
    async (id: string, data: UpdateInventoryItemRequest): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch(`/api/inventory/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to update item");
        }

        await fetchInventory();
        return true;
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
        return false;
      }
    },
    [fetchInventory]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch(`/api/inventory/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to delete item");
        }

        await fetchInventory();
        return true;
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
        return false;
      }
    },
    [fetchInventory]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchInventory();
    }
  }, [autoFetch, fetchInventory]);

  return {
    items,
    summary,
    isLoading,
    error,
    refresh: fetchInventory,
    addItem,
    updateItem,
    deleteItem,
    setLocationFilter,
    locationFilter,
  };
}

export default useInventory;
