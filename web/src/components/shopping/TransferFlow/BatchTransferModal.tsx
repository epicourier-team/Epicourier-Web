"use client";

import { useState, useMemo, useEffect } from "react";
import { ShoppingBag, Loader2, CheckCircle, Package } from "lucide-react";
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

  // Initialize items when modal opens or items change
  useEffect(() => {
    if (isOpen && items.length > 0) {
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
  }, [isOpen, items]);

  // Initialize items when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
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
    const selectedItems = transferItems.filter(
      (item): item is BatchTransferItem & { ingredient_id: number } =>
        item.selected && item.ingredient_id !== null
    );

    if (selectedItems.length === 0) {
      return;
    }

    setIsTransferring(true);
    try {
      await onTransfer(
        selectedItems.map((item) => ({
          shopping_item_id: item.id,
          ingredient_id: item.ingredient_id,
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
      <DialogContent className="brutalism-panel max-h-[80vh] overflow-y-auto border-2 border-black p-0 sm:max-w-lg">
        <DialogHeader className="border-b-2 border-black bg-amber-100 p-6">
          <DialogTitle className="brutalism-title flex items-center gap-2 text-xl">
            <ShoppingBag className="size-6" />
            Complete Shopping
          </DialogTitle>
          <DialogDescription className="font-medium text-black">
            Transfer checked items to your inventory with expiration dates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* Select All */}
          {transferItems.length > 1 && (
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
                <Checkbox
                  checked={selectedCount === transferItems.length}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  className="size-5 border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                />
                SELECT ALL ({selectedCount}/{transferItems.length})
              </label>
            </div>
          )}

          {/* Items List */}
          <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-2">
            {transferItems.map((item) => (
              <div
                key={item.id}
                className={`brutalism-border transition-all ${
                  item.selected
                    ? "bg-emerald-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white opacity-60 hover:opacity-100"
                } p-4`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-1 size-5 border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold">{item.item_name}</p>
                      <button
                        type="button"
                        className="text-xs font-bold underline decoration-2 underline-offset-2 hover:text-emerald-600"
                        onClick={() =>
                          setExpandedItemId(expandedItemId === item.id ? null : item.id)
                        }
                        disabled={!item.selected}
                      >
                        {expandedItemId === item.id ? "HIDE DETAILS" : "EDIT DETAILS"}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      {item.quantity} {item.unit || "unit"}
                      {item.quantity > 1 ? "s" : ""} • {item.category}
                    </p>

                    {/* Expanded settings */}
                    {item.selected && expandedItemId === item.id && (
                      <div className="mt-4 space-y-4 border-t-2 border-black pt-4">
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
            <div className="brutalism-border bg-yellow-100 p-4 text-sm font-medium">
              <p className="mb-2 font-bold text-black">
                ⚠️ {itemsWithoutIngredient.length} ITEM(S) CANNOT BE TRANSFERRED
              </p>
              <p className="text-gray-800">
                Items without linked ingredients will be skipped. Try re-adding these items to match
                them with known ingredients.
              </p>
              <ul className="mt-2 list-inside list-disc font-bold text-gray-800">
                {itemsWithoutIngredient.slice(0, 5).map((item) => (
                  <li key={item.id}>{item.item_name}</li>
                ))}
                {itemsWithoutIngredient.length > 5 && (
                  <li>...and {itemsWithoutIngredient.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Empty state */}
          {transferItems.length === 0 && (
            <div className="brutalism-border flex flex-col items-center justify-center bg-gray-100 p-8 text-center">
              <Package className="mb-4 size-12 text-gray-400" />
              <p className="font-bold text-gray-600">NO ITEMS AVAILABLE FOR TRANSFER</p>
              {items.length > 0 && (
                <p className="mt-2 text-xs font-medium text-gray-500">
                  {items.length} checked item(s) don&apos;t have linked ingredients.
                  <br />
                  Items need to match known ingredients to be added to inventory.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t-2 border-black bg-gray-50 p-6 sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isTransferring}
            className="brutalism-button-neutral px-6 py-3 text-sm uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={isTransferring || selectedCount === 0}
            className="brutalism-button-primary flex items-center gap-2 px-6 py-3 text-sm uppercase disabled:opacity-50"
          >
            {isTransferring ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <CheckCircle className="size-4" />
                Add {selectedCount} to Inventory
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
