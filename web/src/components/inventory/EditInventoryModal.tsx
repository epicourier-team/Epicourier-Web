"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import {
  InventoryItemWithDetails,
  UpdateInventoryItemRequest,
  InventoryLocation,
} from "@/types/data";

interface EditInventoryModalProps {
  /** The item being edited */
  item: InventoryItemWithDetails | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when item is successfully updated */
  onSubmit: (id: string, data: UpdateInventoryItemRequest) => Promise<boolean>;
}

const locations: { value: InventoryLocation; label: string }[] = [
  { value: "pantry", label: "Pantry" },
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "other", label: "Other" },
];

/**
 * Modal component for editing existing inventory items
 */
export function EditInventoryModal({ item, isOpen, onClose, onSubmit }: EditInventoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>("");
  const [location, setLocation] = useState<InventoryLocation>("pantry");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [minQuantity, setMinQuantity] = useState<number | "">("");
  const [notes, setNotes] = useState<string>("");

  // Populate form when item changes
  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setUnit(item.unit || "");
      setLocation(item.location);
      setExpirationDate(item.expiration_date || "");
      setMinQuantity(item.min_quantity ?? "");
      setNotes(item.notes || "");
      setError(null);
    }
  }, [item]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!item) return;

    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: UpdateInventoryItemRequest = {
        quantity,
        unit: unit || undefined,
        location,
        expiration_date: expirationDate || null,
        min_quantity: minQuantity !== "" ? (minQuantity as number) : null,
        notes: notes || undefined,
      };

      const success = await onSubmit(item.id, data);

      if (success) {
        handleClose();
      } else {
        setError("Failed to update item. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      data-testid="edit-inventory-modal"
    >
      <div className="brutalism-panel mx-4 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-sky-200 p-4">
          <h2 className="brutalism-heading">Edit Inventory Item</h2>
          <button
            onClick={handleClose}
            className="brutalism-border bg-white p-1 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            data-testid="close-modal-button"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div
              className="mb-4 border-2 border-black bg-red-200 p-3 text-sm font-bold text-black"
              data-testid="form-error"
            >
              {error}
            </div>
          )}

          {/* Ingredient Name (read-only) */}
          <div className="mb-4">
            <label className="brutalism-text-bold mb-1 block text-sm">Ingredient</label>
            <div className="brutalism-border bg-gray-100 p-2 font-medium text-black">
              {item.ingredient?.name || `Item #${item.ingredient_id}`}
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-quantity" className="brutalism-text-bold mb-1 block text-sm">
                Quantity *
              </label>
              <input
                type="number"
                id="edit-quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0.01"
                step="0.01"
                className="brutalism-input w-full p-2"
                data-testid="quantity-input"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-unit" className="brutalism-text-bold mb-1 block text-sm">
                Unit
              </label>
              <input
                type="text"
                id="edit-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, L, pcs"
                className="brutalism-input w-full p-2"
                data-testid="unit-input"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label htmlFor="edit-location" className="brutalism-text-bold mb-1 block text-sm">
              Location
            </label>
            <select
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value as InventoryLocation)}
              className="brutalism-input w-full p-2"
              data-testid="location-select"
            >
              {locations.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expiration Date */}
          <div className="mb-4">
            <label htmlFor="edit-expiration" className="brutalism-text-bold mb-1 block text-sm">
              Expiration Date
            </label>
            <input
              type="date"
              id="edit-expiration"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="brutalism-input w-full p-2"
              data-testid="expiration-input"
            />
          </div>

          {/* Min Quantity */}
          <div className="mb-4">
            <label htmlFor="edit-minQuantity" className="brutalism-text-bold mb-1 block text-sm">
              Minimum Quantity (for low stock alerts)
            </label>
            <input
              type="number"
              id="edit-minQuantity"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value ? Number(e.target.value) : "")}
              min="0"
              step="0.01"
              placeholder="Optional"
              className="brutalism-input w-full p-2"
              data-testid="min-quantity-input"
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label htmlFor="edit-notes" className="brutalism-text-bold mb-1 block text-sm">
              Notes
            </label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="brutalism-input w-full p-2"
              data-testid="notes-input"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="brutalism-button-secondary flex w-full items-center justify-center gap-2 px-4 py-2 disabled:opacity-40"
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditInventoryModal;
