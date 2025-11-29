"use client";

import { useState } from "react";
import { Package, Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Inventory page - manage user's ingredient inventory
 * 
 * Features:
 * - "Suggest Recipes" button (Issue #96)
 * - Inventory list view (coming in Issue #88)
 * - Expiration tracking (coming in Issue #89)
 * - Low stock alerts (coming in Issue #90)
 */
export default function InventoryPage() {
  const [suggesting, setSuggesting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSuggestRecipes = async () => {
    if (inventoryItems.length === 0) {
      toast({
        title: "⚠️ Empty Inventory",
        description: "Add some ingredients to your inventory first",
        variant: "destructive",
      });
      return;
    }

    setSuggesting(true);

    try {
      // TODO: Call AI recommendation API (Issue #94, #97)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "🤖 AI Recommendations",
        description: "Recipe suggestions coming in Issue #97",
      });
    } catch (error) {
      console.error("Error suggesting recipes:", error);
      toast({
        title: "❌ Error",
        description: "Failed to generate recipe suggestions",
        variant: "destructive",
      });
    } finally {
      setSuggesting(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + R
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "r") {
      e.preventDefault();
      handleSuggestRecipes();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="brutalism-banner mb-6 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="size-8" />
            <div>
              <h1 className="brutalism-title text-2xl">Inventory</h1>
              <p className="text-sm font-semibold text-gray-700">
                {inventoryItems.length} {inventoryItems.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSuggestRecipes}
            disabled={suggesting || inventoryItems.length === 0}
            className="brutalism-button-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
            title="Suggest recipes based on inventory (Cmd/Ctrl + R)"
          >
            {suggesting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Suggesting...</span>
              </>
            ) : (
              <>
                <Lightbulb className="size-4" />
                <span>Suggest Recipes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="brutalism-panel flex flex-col items-center justify-center p-12 text-center">
        <Package className="mb-4 size-16 text-gray-400" />
        <h2 className="brutalism-heading mb-2 text-xl">No Inventory Items Yet</h2>
        <p className="mb-6 text-gray-600">
          Add ingredients to your inventory to track what you have at home
        </p>
        <p className="text-sm font-semibold text-gray-500">
          Inventory management coming in Issue #88
        </p>
      </div>
    </div>
  );
}
