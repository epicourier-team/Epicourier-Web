"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { InventoryLocation, InventoryItemWithDetails } from "@/types/data";

interface EditInventoryModalProps {
  isOpen: boolean;
  item: InventoryItemWithDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LOCATIONS: { value: InventoryLocation; label: string; emoji: string }[] = [
  { value: "pantry", label: "Pantry", emoji: "🥫" },
  { value: "fridge", label: "Fridge", emoji: "❄️" },
  { value: "freezer", label: "Freezer", emoji: "🧊" },
  { value: "other", label: "Other", emoji: "📍" },
];

/**
 * Modal for editing an existing inventory item
 */
export default function EditInventoryModal({
  isOpen,
  item,
  onClose,
  onSuccess,
}: EditInventoryModalProps) {
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState<InventoryLocation>("fridge");
  const [expirationDate, setExpirationDate] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  // Populate form when item changes
  useEffect(() => {
    if (item) {
      setQuantity(String(item.quantity));
      setUnit(item.unit || "");
      setLocation(item.location);
      setExpirationDate(item.expiration_date || "");
      setMinQuantity(item.min_quantity !== null ? String(item.min_quantity) : "");
      setNotes(item.notes || "");
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "⚠️ Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: qty,
          unit: unit.trim() || null,
          location,
          expiration_date: expirationDate || null,
          min_quantity: minQuantity ? parseFloat(minQuantity) : null,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update item");
      }

      toast({
        title: "✅ Updated",
        description: `${item.ingredient?.name || "Item"} has been updated`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-4 border-black bg-amber-50 p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b-4 border-black bg-blue-300 p-6">
            <DialogTitle className="text-xl font-black uppercase">Edit Item</DialogTitle>
            <DialogDescription className="text-sm font-bold text-gray-800">
              {item.ingredient?.name || `Ingredient #${item.ingredient_id}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Quantity <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="brutalism-input w-full px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="g, ml, pcs..."
                  className="brutalism-input w-full px-3 py-2"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-2 block text-sm font-bold">Storage Location</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LOCATIONS.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLocation(value)}
                    className={`flex items-center justify-center gap-1 rounded-lg border-2 border-black px-3 py-2 text-sm font-semibold transition-all ${
                      location === value
                        ? "bg-black text-white"
                        : "bg-white hover:bg-gray-100"
                    }`}
                    disabled={loading}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="mb-2 block text-sm font-bold">Expiration Date</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="brutalism-input w-full px-3 py-2"
                disabled={loading}
              />
            </div>

            {/* Min Quantity (for low stock alerts) */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Min Quantity (Low Stock Alert)
              </label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                min="0"
                step="0.01"
                placeholder="Alert when below this amount"
                className="brutalism-input w-full px-3 py-2"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-bold">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="brutalism-input w-full px-3 py-2"
                rows={2}
                disabled={loading}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter className="border-t-4 border-black bg-gray-100 p-4">
            <button
              type="button"
              onClick={handleClose}
              className="brutalism-button-neutral px-4 py-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="brutalism-button-primary flex items-center gap-2 px-4 py-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
