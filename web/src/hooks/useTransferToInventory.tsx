"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [isTransferring, setIsTransferring] = useState(false);
  const [lastTransferredItems, setLastTransferredItems] = useState<TransferToInventoryRequest[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef<string | null>(null);

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
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    if (toastIdRef.current) {
      dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, [dismiss]);

  const undo = useCallback(async (): Promise<boolean> => {
    if (!canUndo || lastTransferredItems.length === 0) {
      return false;
    }

    try {
      const response = await fetch("/api/inventory/transfer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lastTransferredItems }),
      });

      if (!response.ok) {
        throw new Error("Failed to undo transfer");
      }

      toast({
        title: "↩️ Transfer Undone",
        description: `${lastTransferredItems.length} item(s) removed from inventory`,
      });

      clearUndoState();
      return true;
    } catch (error) {
      toast({
        title: "❌ Undo Failed",
        description: "Could not undo the transfer. Please try manually.",
        variant: "destructive",
      });
      return false;
    }
  }, [canUndo, lastTransferredItems, toast, clearUndoState]);

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

        // Store transferred items for potential undo
        setLastTransferredItems(result.transferred_items || items);
        setCanUndo(true);

        // Show success toast with undo action
        const { id } = toast({
          title: "✅ Added to Inventory",
          description: `${result.transferred_count || items.length} item(s) transferred`,
          action: (
            <ToastAction altText="Undo transfer" onClick={undo}>
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
    [toast, clearUndoState, undo]
  );

  return {
    transfer,
    undo,
    isTransferring,
    canUndo,
    lastTransferredItems,
  };
}
