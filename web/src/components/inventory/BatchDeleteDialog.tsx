"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItemWithDetails } from "@/types/data";

interface BatchDeleteDialogProps {
  isOpen: boolean;
  items: InventoryItemWithDetails[];
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Dialog for confirming batch deletion of inventory items
 */
export default function BatchDeleteDialog({
  isOpen,
  items,
  onClose,
  onSuccess,
}: BatchDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (items.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/inventory/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((item) => item.id) }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete items");
      }

      const result = await response.json();

      toast({
        title: "Items Deleted",
        description: `Successfully deleted ${result.deleted_count || items.length} item${items.length !== 1 ? "s" : ""} from inventory`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error batch deleting items:", error);
      toast({
        title: "Error",
        description: "Failed to delete items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get a summary of what will be deleted
  const expiredItems = items.filter((i) => i.expiration_status === "expired").length;
  const expiringItems = items.filter(
    (i) => i.expiration_status === "critical" || i.expiration_status === "warning"
  ).length;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            Delete {items.length} Item{items.length !== 1 ? "s" : ""}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This action cannot be undone. The following items will be permanently deleted from
                your inventory:
              </p>

              {/* Item preview list */}
              <div className="max-h-48 overflow-y-auto rounded-lg border bg-gray-50 p-2">
                <ul className="space-y-1 text-sm">
                  {items.slice(0, 10).map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-1">
                      <span className="font-medium text-gray-900">
                        {item.ingredient?.name || `Item #${item.id}`}
                      </span>
                      <span className="text-gray-500">
                        {item.quantity} {item.unit || "units"}
                      </span>
                    </li>
                  ))}
                  {items.length > 10 && (
                    <li className="pt-1 text-gray-500 italic">
                      ...and {items.length - 10} more items
                    </li>
                  )}
                </ul>
              </div>

              {/* Status summary */}
              {(expiredItems > 0 || expiringItems > 0) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {expiredItems > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                      {expiredItems} expired
                    </span>
                  )}
                  {expiringItems > 0 && (
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">
                      {expiringItems} expiring soon
                    </span>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 size-4" />
                Delete {items.length} Item{items.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
