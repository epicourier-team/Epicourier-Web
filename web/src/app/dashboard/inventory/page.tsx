"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Lightbulb, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LocationTabs,
  InventorySearchBar,
  ExpiringSoonBanner,
  InventoryItemCard,
  AddInventoryModal,
  EditInventoryModal,
  DeleteInventoryDialog,
} from "@/components/inventory";
import type { InventoryLocation, InventoryItemWithDetails, InventorySummary } from "@/types/data";

// View mode type for clear state management
type ViewMode = "all" | "expiring";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemWithDetails[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [globalSummary, setGlobalSummary] = useState<InventorySummary | null>(null); // Always stores unfiltered counts
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState<InventoryLocation | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemWithDetails | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItemWithDetails | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  const { toast } = useToast();

  // Fetch global summary (unfiltered) for location counts
  const fetchGlobalSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setGlobalSummary(data.summary || null);
      }
    } catch (error) {
      console.error("Error fetching global summary:", error);
    }
  }, []);

  // Fetch on mount to get global counts
  useEffect(() => {
    fetchGlobalSummary();
  }, [fetchGlobalSummary]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeLocation !== "all") {
        params.set("location", activeLocation);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const response = await fetch("/api/inventory?" + params.toString());

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view your inventory",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to fetch inventory");
      }

      const data = await response.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeLocation, searchQuery, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSuggestRecipes = async () => {
    if (items.length === 0) {
      toast({
        title: "Empty Inventory",
        description: "Add some ingredients to your inventory first",
        variant: "destructive",
      });
      return;
    }

    setSuggesting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "AI Recommendations",
        description: "Recipe suggestions coming in Issue #97",
      });
    } catch (error) {
      console.error("Error suggesting recipes:", error);
      toast({
        title: "Error",
        description: "Failed to generate recipe suggestions",
        variant: "destructive",
      });
    } finally {
      setSuggesting(false);
    }
  };

  const handleViewExpiring = () => {
    // Switch to expiring view mode
    // Keep current location filter - show expiring items from current location only
    setViewMode("expiring");
    setSearchQuery("");
  };

  const handleShowAll = () => {
    // Switch back to all items view (keep current location)
    setViewMode("all");
  };

  // Handle location change
  const handleLocationChange = (location: InventoryLocation | "all") => {
    // Exit expiring view when changing location
    if (viewMode === "expiring") {
      setViewMode("all");
    }
    setActiveLocation(location);
  };

  // Filter items based on view mode
  // Note: Location filtering is done by API (fetchInventory)
  // Expiring filtering is done client-side on top of API results
  const displayItems =
    viewMode === "expiring"
      ? items.filter(
          (item) =>
            item.expiration_status === "expired" ||
            item.expiration_status === "critical" ||
            item.expiration_status === "warning"
        )
      : items;

  const isExpiringView = viewMode === "expiring";

  // Use globalSummary for location counts (always unfiltered)
  const locationCounts = globalSummary
    ? {
        all: globalSummary.total_items,
        pantry: globalSummary.by_location.pantry,
        fridge: globalSummary.by_location.fridge,
        freezer: globalSummary.by_location.freezer,
        other: globalSummary.by_location.other,
      }
    : undefined;

  if (loading && items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Loading inventory...</span>
        </div>
      </div>
    );
  }

  const totalItems = summary?.total_items || 0;
  const lowStockCount = summary?.low_stock || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="brutalism-banner mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="size-8" />
            <div>
              <h1 className="brutalism-title text-2xl">Inventory</h1>
              <p className="text-sm font-semibold text-gray-700">
                {totalItems} {totalItems === 1 ? "item" : "items"}
                {lowStockCount > 0 ? " - " + lowStockCount + " low stock" : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="brutalism-button-primary flex items-center gap-2 px-4 py-2"
            >
              <Plus className="size-4" />
              <span>Add Item</span>
            </button>
            <button
              onClick={handleSuggestRecipes}
              disabled={suggesting || items.length === 0}
              className="brutalism-button-secondary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
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
      </div>

      {summary && (summary.expired > 0 || summary.expiring_soon > 0) && !isExpiringView && (
        <ExpiringSoonBanner
          expiredCount={summary.expired}
          expiringCount={summary.expiring_soon}
          onViewAll={handleViewExpiring}
          className="mb-6"
        />
      )}

      {/* Show filter indicator when viewing expiring items */}
      {isExpiringView && (
        <div className="mb-4 flex items-center justify-between rounded-lg border-2 border-orange-400 bg-orange-50 px-4 py-3">
          <span className="font-semibold text-orange-800">
            🔍 Viewing {displayItems.length} expiring/expired item
            {displayItems.length !== 1 ? "s" : ""}
            {activeLocation !== "all" && ` in ${activeLocation}`}
          </span>
          <button
            onClick={handleShowAll}
            className="flex items-center gap-1 rounded-md bg-orange-200 px-3 py-1 text-sm font-semibold text-orange-800 hover:bg-orange-300"
          >
            <X className="size-4" />
            Exit Filter
          </button>
        </div>
      )}

      {/* Location tabs - show current selection but disable switching in expiring view */}
      <LocationTabs
        activeLocation={activeLocation}
        onLocationChange={handleLocationChange}
        counts={locationCounts}
        className="mb-4"
        disabled={isExpiringView}
      />

      {/* Search bar - disabled when in expiring view */}
      {!isExpiringView && (
        <InventorySearchBar value={searchQuery} onChange={setSearchQuery} className="mb-6" />
      )}

      {displayItems.length === 0 ? (
        <div className="brutalism-panel flex flex-col items-center justify-center p-12 text-center">
          <Package className="mb-4 size-16 text-gray-400" />
          <h2 className="brutalism-heading mb-2 text-xl">
            {isExpiringView
              ? "No Expiring Items"
              : searchQuery
                ? "No Results Found"
                : "No Inventory Items Yet"}
          </h2>
          <p className="mb-6 text-gray-600">
            {isExpiringView
              ? "Great! None of your items are expiring soon"
              : searchQuery
                ? "No items match your search"
                : "Add ingredients to your inventory to track what you have at home"}
          </p>
          {!searchQuery && !isExpiringView && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="brutalism-button-primary flex items-center gap-2 px-6 py-3"
            >
              <Plus className="size-5" />
              <span>Add First Item</span>
            </button>
          )}
          {isExpiringView && (
            <button onClick={handleShowAll} className="brutalism-button-secondary px-6 py-3">
              Show All Items
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
            />
          ))}
        </div>
      )}

      <AddInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchInventory();
          fetchGlobalSummary(); // Refresh global counts
        }}
      />

      <EditInventoryModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={() => {
          setEditingItem(null);
          fetchInventory();
          fetchGlobalSummary(); // Refresh global counts
        }}
      />

      <DeleteInventoryDialog
        isOpen={!!deletingItem}
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onSuccess={() => {
          setDeletingItem(null);
          fetchInventory();
          fetchGlobalSummary(); // Refresh global counts
        }}
      />
    </div>
  );
}
