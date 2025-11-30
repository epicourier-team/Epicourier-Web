"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { InventoryItemWithDetails } from "@/types/data";

interface DeleteInventoryDialogProps {
  isOpen: boolean;
  item: InventoryItemWithDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Confirmation dialog for deleting an inventory item
 */
export default function DeleteInventoryDialog({
  isOpen,
  item,
  onClose,
  onSuccess,
}: DeleteInventoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!item) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
      }

      toast({
        title: "🗑️ Deleted",
        description: `${item.ingredient?.name || "Item"} removed from inventory`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="border-4 border-black bg-amber-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black">Remove from Inventory?</AlertDialogTitle>
          <AlertDialogDescription className="text-base font-semibold text-gray-700">
            Are you sure you want to remove{" "}
            <span className="font-bold text-black">
              {item.ingredient?.name || `Ingredient #${item.ingredient_id}`}
            </span>{" "}
            from your inventory? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="brutalism-button-neutral"
            disabled={loading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="brutalism-button-danger flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
