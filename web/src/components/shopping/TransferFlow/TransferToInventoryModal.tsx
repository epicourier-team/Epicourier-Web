"use client";

import { useState } from "react";
import { Package, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ShoppingItemForTransfer {
  id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  category: string;
  ingredient_id: number | null;
}

interface TransferToInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShoppingItemForTransfer;
  onTransfer: (items: TransferToInventoryRequest[]) => Promise<void>;
}

/**
 * TransferToInventoryModal - Modal for transferring a single shopping item to inventory
 * Prompts for expiration date and storage location
 */
export default function TransferToInventoryModal({
  isOpen,
  onClose,
  item,
  onTransfer,
}: TransferToInventoryModalProps) {
  const [expirationDate, setExpirationDate] = useState(getDefaultExpiration(item.category));
  const [location, setLocation] = useState<InventoryLocation>("pantry");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!item.ingredient_id) {
      return;
    }

    setIsTransferring(true);
    try {
      await onTransfer([
        {
          shopping_item_id: item.id,
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
          unit: item.unit || undefined,
          location,
          expiration_date: expirationDate || undefined,
        },
      ]);
      onClose();
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSkipExpiration = async () => {
    if (!item.ingredient_id) {
      return;
    }

    setIsTransferring(true);
    try {
      await onTransfer([
        {
          shopping_item_id: item.id,
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
          unit: item.unit || undefined,
          location,
        },
      ]);
      onClose();
    } finally {
      setIsTransferring(false);
    }
  };

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    } else {
      setExpirationDate(getDefaultExpiration(item.category));
      setLocation("pantry");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Add to Inventory
          </DialogTitle>
          <DialogDescription>
            Transfer &quot;{item.item_name}&quot; to your inventory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Summary */}
          <div className="bg-muted rounded-lg p-3">
            <p className="font-medium">{item.item_name}</p>
            <p className="text-muted-foreground text-sm">
              {item.quantity} {item.unit || "unit"}
              {item.quantity > 1 ? "s" : ""} • {item.category}
            </p>
          </div>

          {/* Location Selector */}
          <LocationSelector value={location} onChange={setLocation} />

          {/* Expiration Date */}
          <ExpirationInput
            value={expirationDate}
            onChange={setExpirationDate}
            category={item.category}
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkipExpiration}
            disabled={isTransferring}
          >
            Skip Expiration
          </Button>
          <Button
            type="button"
            onClick={handleTransfer}
            disabled={isTransferring || !item.ingredient_id}
          >
            {isTransferring ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 size-4" />
                Add to Inventory
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ShoppingItemForTransfer };
