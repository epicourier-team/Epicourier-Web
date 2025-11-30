"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Plus, Loader2, Search } from "lucide-react";
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

  // Autocomplete state
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>("");
  const [location, setLocation] = useState<InventoryLocation>("pantry");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [minQuantity, setMinQuantity] = useState<number | "">("");
  const [notes, setNotes] = useState<string>("");

  // Filter ingredients based on search
  const filteredIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return ingredients.slice(0, 10);
    const query = ingredientSearch.toLowerCase();
    return ingredients
      .filter((ing) => ing.name && ing.name.toLowerCase().includes(query))
      .slice(0, 10);
  }, [ingredients, ingredientSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setSelectedIngredient(null);
    setIngredientSearch("");
    setQuantity(1);
    setUnit("");
    setLocation("pantry");
    setExpirationDate("");
    setMinQuantity("");
    setNotes("");
    setError(null);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIngredientSearch(ingredient.name || "");
    setUnit(ingredient.unit || "");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredIngredients.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredIngredients[highlightedIndex]) {
          handleSelectIngredient(filteredIngredients[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedIngredient) {
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
        ingredient_id: selectedIngredient.id,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      data-testid="add-inventory-modal"
    >
      <div className="brutalism-panel mx-4 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-emerald-200 p-4">
          <h2 className="brutalism-heading">Add Inventory Item</h2>
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

          {/* Ingredient Autocomplete */}
          <div className="relative mb-4" ref={suggestionsRef}>
            <label htmlFor="ingredient" className="brutalism-text-bold mb-1 block text-sm">
              Ingredient *
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                id="ingredient"
                value={ingredientSearch}
                onChange={(e) => {
                  setIngredientSearch(e.target.value);
                  setShowSuggestions(true);
                  setSelectedIngredient(null);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search ingredients..."
                className="brutalism-input w-full py-2 pr-4 pl-10"
                data-testid="ingredient-input"
                autoComplete="off"
              />
            </div>
            {/* Suggestions Dropdown */}
            {showSuggestions && filteredIngredients.length > 0 && (
              <div
                className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                data-testid="ingredient-suggestions"
              >
                {filteredIngredients.map((ing, index) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handleSelectIngredient(ing)}
                    className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                      index === highlightedIndex
                        ? "bg-emerald-100"
                        : selectedIngredient?.id === ing.id
                          ? "bg-emerald-50"
                          : "hover:bg-gray-100"
                    }`}
                    data-testid={`suggestion-${ing.id}`}
                  >
                    {ing.name}
                    {ing.unit && <span className="ml-2 text-xs text-gray-500">({ing.unit})</span>}
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && ingredientSearch && filteredIngredients.length === 0 && (
              <div className="absolute z-20 mt-1 w-full border-2 border-black bg-white p-3 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                No ingredients found
              </div>
            )}
            {selectedIngredient && (
              <div className="mt-2 inline-block border-2 border-black bg-emerald-100 px-2 py-1 text-sm font-bold">
                ✓ {selectedIngredient.name}
              </div>
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quantity" className="brutalism-text-bold mb-1 block text-sm">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
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
              <label htmlFor="unit" className="brutalism-text-bold mb-1 block text-sm">
                Unit
              </label>
              <input
                type="text"
                id="unit"
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
            <label htmlFor="location" className="brutalism-text-bold mb-1 block text-sm">
              Location
            </label>
            <select
              id="location"
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
            <label htmlFor="expiration" className="brutalism-text-bold mb-1 block text-sm">
              Expiration Date
            </label>
            <input
              type="date"
              id="expiration"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="brutalism-input w-full p-2"
              data-testid="expiration-input"
            />
          </div>

          {/* Min Quantity */}
          <div className="mb-4">
            <label htmlFor="minQuantity" className="brutalism-text-bold mb-1 block text-sm">
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
              className="brutalism-input w-full p-2"
              data-testid="min-quantity-input"
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label htmlFor="notes" className="brutalism-text-bold mb-1 block text-sm">
              Notes
            </label>
            <textarea
              id="notes"
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
            className="brutalism-button-primary flex w-full items-center justify-center gap-2 px-4 py-2 disabled:opacity-40"
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
