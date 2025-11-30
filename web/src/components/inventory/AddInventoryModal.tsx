"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, X } from "lucide-react";
import type { InventoryLocation, Ingredient } from "@/types/data";

interface AddInventoryModalProps {
  isOpen: boolean;
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
 * Modal for adding a new item to inventory
 *
 * Features:
 * - Ingredient search with autocomplete
 * - Quantity and unit input
 * - Location selection (pantry/fridge/freezer)
 * - Expiration date picker
 * - Min quantity threshold
 * - Notes field
 */
export default function AddInventoryModal({ isOpen, onClose, onSuccess }: AddInventoryModalProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Form state
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState<InventoryLocation>("fridge");
  const [expirationDate, setExpirationDate] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  // Debounced search for ingredients
  const searchIngredients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/ingredients?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.ingredients || data || []);
      }
    } catch (error) {
      console.error("Error searching ingredients:", error);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && !selectedIngredient) {
        searchIngredients(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedIngredient, searchIngredients]);

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchQuery(ingredient.name || "");
    setSearchResults([]);
  };

  const handleClearIngredient = () => {
    setSelectedIngredient(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIngredient) {
      toast({
        title: "⚠️ Ingredient Required",
        description: "Please select an ingredient",
        variant: "destructive",
      });
      return;
    }

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
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredient_id: selectedIngredient.id,
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
        throw new Error(error.error || "Failed to add item");
      }

      toast({
        title: "✅ Added to Inventory",
        description: `${selectedIngredient.name} has been added`,
      });

      // Reset form
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedIngredient(null);
    setQuantity("1");
    setUnit("");
    setLocation("fridge");
    setExpirationDate("");
    setMinQuantity("");
    setNotes("");
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-4 border-black bg-amber-50 p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b-4 border-black bg-green-300 p-6">
            <DialogTitle className="text-xl font-black uppercase">Add to Inventory</DialogTitle>
            <DialogDescription className="text-sm font-bold text-gray-800">
              Track ingredients you have at home
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            {/* Ingredient Search */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Ingredient <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedIngredient) {
                      setSelectedIngredient(null);
                    }
                  }}
                  placeholder="Search for an ingredient..."
                  className="brutalism-input w-full py-2 pr-10 pl-10"
                  disabled={loading}
                />
                {selectedIngredient && (
                  <button
                    type="button"
                    onClick={handleClearIngredient}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    <X className="size-4 text-gray-500 hover:text-gray-700" />
                  </button>
                )}
                {searching && (
                  <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-gray-400" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && !selectedIngredient && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border-2 border-black bg-white shadow-lg">
                  {searchResults.map((ingredient) => (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() => handleSelectIngredient(ingredient)}
                      className="w-full px-4 py-2 text-left font-semibold hover:bg-gray-100"
                    >
                      {ingredient.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedIngredient && (
                <p className="mt-1 text-sm font-semibold text-green-600">
                  ✓ Selected: {selectedIngredient.name}
                </p>
              )}
            </div>

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
                      location === value ? "bg-black text-white" : "bg-white hover:bg-gray-100"
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
              <label className="mb-2 block text-sm font-bold">Min Quantity (Low Stock Alert)</label>
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
              <p className="mt-1 text-xs text-gray-500">
                You&apos;ll get a low stock alert when quantity drops below this
              </p>
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
              disabled={loading || !selectedIngredient}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add to Inventory</span>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
