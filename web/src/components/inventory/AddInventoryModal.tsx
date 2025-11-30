"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { CreateInventoryItemRequest, InventoryLocation, Ingredient } from "@/types/data";

interface AddInventoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when item is submitted */
  onSubmit: (data: CreateInventoryItemRequest) => Promise<boolean>;
  /** Available ingredients to select from */
  ingredients?: Ingredient[];
}

const locations: { value: InventoryLocation; label: string }[] = [
  { value: "pantry", label: "Pantry" },
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "other", label: "Other" },
];

/**
 * Modal component for adding new inventory items
 */
export function AddInventoryModal({
  isOpen,
  onClose,
  onSubmit,
  ingredients = [],
}: AddInventoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [ingredientId, setIngredientId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>("");
  const [location, setLocation] = useState<InventoryLocation>("pantry");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [minQuantity, setMinQuantity] = useState<number | "">("");
  const [notes, setNotes] = useState<string>("");

  const resetForm = () => {
    setIngredientId("");
    setQuantity(1);
    setUnit("");
    setLocation("pantry");
    setExpirationDate("");
    setMinQuantity("");
    setNotes("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (ingredientId === "") {
      setError("Please select an ingredient");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateInventoryItemRequest = {
        ingredient_id: ingredientId as number,
        quantity,
        unit: unit || undefined,
        location,
        expiration_date: expirationDate || undefined,
        min_quantity: minQuantity !== "" ? (minQuantity as number) : undefined,
        notes: notes || undefined,
      };

      const success = await onSubmit(data);

      if (success) {
        handleClose();
      } else {
        setError("Failed to add item. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="add-inventory-modal">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Add Inventory Item</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 hover:bg-gray-100"
            data-testid="close-modal-button"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600" data-testid="form-error">
              {error}
            </div>
          )}

          {/* Ingredient Select */}
          <div className="mb-4">
            <label htmlFor="ingredient" className="mb-1 block text-sm font-medium text-gray-700">
              Ingredient *
            </label>
            <select
              id="ingredient"
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid="ingredient-select"
              required
            >
              <option value="">Select an ingredient</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Unit */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0.01"
                step="0.01"
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="quantity-input"
                required
              />
            </div>
            <div>
              <label htmlFor="unit" className="mb-1 block text-sm font-medium text-gray-700">
                Unit
              </label>
              <input
                type="text"
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, L, pcs"
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="unit-input"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
              Location
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value as InventoryLocation)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <label htmlFor="expiration" className="mb-1 block text-sm font-medium text-gray-700">
              Expiration Date
            </label>
            <input
              type="date"
              id="expiration"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid="expiration-input"
            />
          </div>

          {/* Min Quantity */}
          <div className="mb-4">
            <label htmlFor="minQuantity" className="mb-1 block text-sm font-medium text-gray-700">
              Minimum Quantity (for low stock alerts)
            </label>
            <input
              type="number"
              id="minQuantity"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value ? Number(e.target.value) : "")}
              min="0"
              step="0.01"
              placeholder="Optional"
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid="min-quantity-input"
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid="notes-input"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Add Item
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddInventoryModal;
