"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import type { TransferToInventoryRequest } from "@/types/data";

const UNDO_TIMEOUT_MS = 10000; // 10 seconds for undo

interface UseTransferToInventoryResult {
  transfer: (items: TransferToInventoryRequest[]) => Promise<boolean>;
  undo: () => Promise<boolean>;
  isTransferring: boolean;
  canUndo: boolean;
  lastTransferredItems: TransferToInventoryRequest[];
}

/**
 * Hook for transferring shopping items to inventory
 * Includes undo functionality with 10-second window
 */
export function useTransferToInventory(): UseTransferToInventoryResult {
  const { toast, dismiss } = useToast();
  const [isTransferring, setIsTransferring] = useState(false);
  const [lastTransferredItems, setLastTransferredItems] = useState<TransferToInventoryRequest[]>(
    []
  );
  const [canUndo, setCanUndo] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef<string | null>(null);
  // Use refs to store current state for undo callback to avoid stale closure
  const lastTransferredItemsRef = useRef<TransferToInventoryRequest[]>([]);
  const canUndoRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    lastTransferredItemsRef.current = lastTransferredItems;
    canUndoRef.current = canUndo;
  }, [lastTransferredItems, canUndo]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const clearUndoState = useCallback(() => {
    setCanUndo(false);
    setLastTransferredItems([]);
    canUndoRef.current = false;
    lastTransferredItemsRef.current = [];
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    if (toastIdRef.current) {
      dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, [dismiss]);

  // Use ref-based undo for toast action to avoid stale closure
  const handleUndoClick = useCallback(async (): Promise<boolean> => {
    if (!canUndoRef.current || lastTransferredItemsRef.current.length === 0) {
      return false;
    }

    const itemsToUndo = lastTransferredItemsRef.current;

    try {
      const response = await fetch("/api/inventory/transfer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToUndo }),
      });

      if (!response.ok) {
        throw new Error("Failed to undo transfer");
      }

      toast({
        title: "↩️ Transfer Undone",
        description: `${itemsToUndo.length} item(s) removed from inventory`,
      });

      clearUndoState();
      return true;
    } catch {
      toast({
        title: "❌ Undo Failed",
        description: "Could not undo the transfer. Please try manually.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, clearUndoState]);

  const undo = useCallback(async (): Promise<boolean> => {
    return handleUndoClick();
  }, [handleUndoClick]);

  const transfer = useCallback(
    async (items: TransferToInventoryRequest[]): Promise<boolean> => {
      if (items.length === 0) {
        return false;
      }

      // Clear any previous undo state
      clearUndoState();

      setIsTransferring(true);
      try {
        const response = await fetch("/api/inventory/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to transfer items");
        }

        const result = await response.json();

        // Store transferred items for potential undo (both state and ref)
        const transferredItems = result.transferred_items || items;
        setLastTransferredItems(transferredItems);
        lastTransferredItemsRef.current = transferredItems;
        setCanUndo(true);
        canUndoRef.current = true;

        // Show success toast with undo action and inventory link
        const { id } = toast({
          title: "✅ Added to Inventory",
          description: (
            <span>
              {result.transferred_count || items.length} item(s) transferred.{" "}
              <Link href="/dashboard/inventory" className="underline hover:no-underline">
                View Inventory
              </Link>
            </span>
          ),
          action: (
            <ToastAction altText="Undo transfer" onClick={handleUndoClick}>
              Undo
            </ToastAction>
          ),
        });
        toastIdRef.current = id;

        // Set timeout to clear undo ability
        undoTimeoutRef.current = setTimeout(() => {
          clearUndoState();
        }, UNDO_TIMEOUT_MS);

        return true;
      } catch (error) {
        toast({
          title: "❌ Transfer Failed",
          description: error instanceof Error ? error.message : "Could not transfer items",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsTransferring(false);
      }
    },
    [toast, clearUndoState, handleUndoClick]
  );

  return {
    transfer,
    undo,
    isTransferring,
    canUndo,
    lastTransferredItems,
  };
}
