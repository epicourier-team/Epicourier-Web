"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Lightbulb, Loader2, Plus, X, CheckSquare, Square, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LocationTabs,
  InventorySearchBar,
  ExpiringSoonBanner,
  InventoryItemCard,
  AddInventoryModal,
  EditInventoryModal,
  DeleteInventoryDialog,
  BatchDeleteDialog,
  RecipeRecommendationModal,
} from "@/components/inventory";
import type {
  InventoryLocation,
  InventoryItemWithDetails,
  InventorySummary,
  InventoryRecommendResponse,
  InventoryItemForRecommendation,
} from "@/types/data";

// View mode type for clear state management
type ViewMode = "all" | "expiring";

// Python backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:8000";

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

  // Recipe recommendation state
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<InventoryRecommendResponse | null>(null);

  // Batch selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);

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
    setIsRecommendModalOpen(true);
    setRecommendations(null);

    try {
      // Convert inventory items to API format
      const inventoryPayload: InventoryItemForRecommendation[] = items.map((item) => ({
        ingredient_id: item.ingredient_id || 0,
        name: item.ingredient?.name || "Unknown",
        quantity: item.quantity,
        unit: item.unit,
        expiration_date: item.expiration_date,
      }));

      const response = await fetch(`${BACKEND_URL}/inventory-recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventory: inventoryPayload,
          num_recipes: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: InventoryRecommendResponse = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error("Error suggesting recipes:", error);
      toast({
        title: "Error",
        description: "Failed to generate recipe suggestions. Make sure the backend is running.",
        variant: "destructive",
      });
      setIsRecommendModalOpen(false);
    } finally {
      setSuggesting(false);
    }
  };

  const handleAddMissingToShoppingList = (missingIngredients: string[]) => {
    // TODO: Implement adding missing ingredients to shopping list
    toast({
      title: "Coming Soon",
      description: `Will add ${missingIngredients.length} items to your shopping list`,
    });
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
    // Exit select mode when changing location
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedItems(new Set());
    }
    setActiveLocation(location);
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    if (isSelectMode) {
      // Exit select mode
      setIsSelectMode(false);
      setSelectedItems(new Set());
    } else {
      // Enter select mode
      setIsSelectMode(true);
    }
  };

  // Toggle item selection
  const handleToggleSelect = (item: InventoryItemWithDetails) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  // Select all displayed items
  const handleSelectAll = () => {
    if (selectedItems.size === displayItems.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all displayed items
      setSelectedItems(new Set(displayItems.map((item) => item.id)));
    }
  };

  // Get selected items for batch delete
  const getSelectedItemsForDelete = (): InventoryItemWithDetails[] => {
    return displayItems.filter((item) => selectedItems.has(item.id));
  };

  // Handle successful batch delete
  const handleBatchDeleteSuccess = () => {
    setIsBatchDeleteOpen(false);
    setIsSelectMode(false);
    setSelectedItems(new Set());
    fetchInventory();
    fetchGlobalSummary();
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
            {/* Select Mode Toggle */}
            {items.length > 0 && (
              <button
                onClick={toggleSelectMode}
                className={`brutalism-button-neutral flex items-center gap-2 px-4 py-2 ${isSelectMode ? "bg-blue-100" : ""}`}
              >
                {isSelectMode ? <X className="size-4" /> : <CheckSquare className="size-4" />}
                <span className="hidden sm:inline">{isSelectMode ? "Cancel" : "Select"}</span>
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="brutalism-button-primary flex items-center gap-2 px-4 py-2"
              disabled={isSelectMode}
            >
              <Plus className="size-4" />
              <span>Add Item</span>
            </button>
            <button
              onClick={handleSuggestRecipes}
              disabled={suggesting || items.length === 0 || isSelectMode}
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
        <div className="brutalism-panel mb-4 flex items-center justify-between border-orange-500 bg-orange-100 px-4 py-3">
          <span className="font-bold text-orange-900">
            🔍 Viewing {displayItems.length} expiring/expired item
            {displayItems.length !== 1 ? "s" : ""}
            {activeLocation !== "all" && ` in ${activeLocation}`}
          </span>
          <button
            onClick={handleShowAll}
            className="brutalism-button flex items-center gap-1 border-orange-600 bg-orange-300 px-3 py-1 text-sm text-orange-900 hover:bg-orange-400"
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

      {/* Selection mode action bar */}
      {isSelectMode && (
        <div className="brutalism-panel mb-4 flex items-center justify-between border-sky-500 bg-sky-100 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sky-900">
              {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="brutalism-button flex items-center gap-1 border-sky-600 bg-sky-200 px-3 py-1 text-sm text-sky-900 hover:bg-sky-300"
            >
              {selectedItems.size === displayItems.length ? (
                <>
                  <Square className="size-4" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="size-4" />
                  Select All ({displayItems.length})
                </>
              )}
            </button>
          </div>
          <button
            onClick={() => setIsBatchDeleteOpen(true)}
            disabled={selectedItems.size === 0}
            className="brutalism-button flex items-center gap-2 bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Delete Selected
          </button>
        </div>
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
              isSelectMode={isSelectMode}
              isSelected={selectedItems.has(item.id)}
              onToggleSelect={handleToggleSelect}
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

      <BatchDeleteDialog
        isOpen={isBatchDeleteOpen}
        items={getSelectedItemsForDelete()}
        onClose={() => setIsBatchDeleteOpen(false)}
        onSuccess={handleBatchDeleteSuccess}
      />

      <RecipeRecommendationModal
        isOpen={isRecommendModalOpen}
        onClose={() => setIsRecommendModalOpen(false)}
        recommendations={recommendations}
        isLoading={suggesting}
        onAddToShoppingList={handleAddMissingToShoppingList}
      />
    </div>
  );
}
