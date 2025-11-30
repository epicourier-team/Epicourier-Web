"use client";

import { useState, useMemo } from "react";
import { ShoppingBag, Loader2, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpirationInput, LocationSelector, getDefaultExpiration } from "./ExpirationInput";
import type { InventoryLocation, TransferToInventoryRequest } from "@/types/data";
import type { ShoppingItemForTransfer } from "./TransferToInventoryModal";

interface BatchTransferItem extends ShoppingItemForTransfer {
  selected: boolean;
  expiration_date: string;
  location: InventoryLocation;
}

interface BatchTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItemForTransfer[];
  onTransfer: (items: TransferToInventoryRequest[]) => Promise<void>;
}

/**
 * BatchTransferModal - Modal for transferring multiple shopping items to inventory
 * Allows setting expiration dates and locations per item
 */
export default function BatchTransferModal({
  isOpen,
  onClose,
  items,
  onTransfer,
}: BatchTransferModalProps) {
  const [transferItems, setTransferItems] = useState<BatchTransferItem[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Initialize items when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    } else {
      setTransferItems(
        items
          .filter((item) => item.ingredient_id !== null)
          .map((item) => ({
            ...item,
            selected: true,
            expiration_date: getDefaultExpiration(item.category),
            location: "pantry" as InventoryLocation,
          }))
      );
      setExpandedItemId(null);
    }
  };

  const selectedCount = useMemo(
    () => transferItems.filter((item) => item.selected).length,
    [transferItems]
  );

  const toggleItem = (id: string) => {
    setTransferItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleAll = (selected: boolean) => {
    setTransferItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const updateItemExpiration = (id: string, expiration_date: string) => {
    setTransferItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, expiration_date } : item))
    );
  };

  const updateItemLocation = (id: string, location: InventoryLocation) => {
    setTransferItems((prev) => prev.map((item) => (item.id === id ? { ...item, location } : item)));
  };

  const handleTransfer = async () => {
    const selectedItems = transferItems.filter((item) => item.selected && item.ingredient_id);

    if (selectedItems.length === 0) {
      return;
    }

    setIsTransferring(true);
    try {
      await onTransfer(
        selectedItems.map((item) => ({
          shopping_item_id: item.id,
          ingredient_id: item.ingredient_id!,
          quantity: item.quantity,
          unit: item.unit || undefined,
          location: item.location,
          expiration_date: item.expiration_date || undefined,
        }))
      );
      onClose();
    } finally {
      setIsTransferring(false);
    }
  };

  const itemsWithoutIngredient = items.filter((item) => item.ingredient_id === null);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Complete Shopping
          </DialogTitle>
          <DialogDescription>
            Transfer checked items to your inventory with expiration dates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select All */}
          {transferItems.length > 1 && (
            <div className="flex items-center justify-between border-b pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={selectedCount === transferItems.length}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                />
                Select All ({selectedCount}/{transferItems.length})
              </label>
            </div>
          )}

          {/* Items List */}
          <div className="max-h-[40vh] space-y-2 overflow-y-auto">
            {transferItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-3 transition-colors ${
                  item.selected ? "border-emerald-500 bg-emerald-50" : "bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{item.item_name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          setExpandedItemId(expandedItemId === item.id ? null : item.id)
                        }
                        disabled={!item.selected}
                      >
                        {expandedItemId === item.id ? "Hide" : "Edit"}
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {item.quantity} {item.unit || "unit"}
                      {item.quantity > 1 ? "s" : ""} • {item.category}
                    </p>

                    {/* Expanded settings */}
                    {item.selected && expandedItemId === item.id && (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        <LocationSelector
                          value={item.location}
                          onChange={(loc) => updateItemLocation(item.id, loc)}
                        />
                        <ExpirationInput
                          value={item.expiration_date}
                          onChange={(date) => updateItemExpiration(item.id, date)}
                          category={item.category}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Warning for items without ingredient_id */}
          {itemsWithoutIngredient.length > 0 && (
            <div className="text-muted-foreground rounded-lg bg-yellow-50 p-3 text-sm">
              <p className="font-medium text-yellow-800">
                {itemsWithoutIngredient.length} item(s) cannot be transferred
              </p>
              <p className="text-yellow-700">
                Items without linked ingredients will be skipped.
              </p>
            </div>
          )}

          {/* Empty state */}
          {transferItems.length === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Package className="text-muted-foreground mb-2 size-8" />
              <p className="text-muted-foreground text-sm">No items available for transfer</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isTransferring}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleTransfer}
            disabled={isTransferring || selectedCount === 0}
          >
            {isTransferring ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 size-4" />
                Add {selectedCount} to Inventory
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
