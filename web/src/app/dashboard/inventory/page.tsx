"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Lightbulb,
  Loader2,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Trash2,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  InventoryCard,
  AddInventoryModal,
  EditInventoryModal,
  LowStockBanner,
} from "@/components/inventory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  InventoryItemWithDetails,
  InventorySummary,
  InventoryLocation,
  Ingredient,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
} from "@/types/data";
import { getLowStockSummary } from "@/utils/inventory/lowStock";

type LocationFilter = InventoryLocation | "all";
type SortOption = "updated" | "expiration" | "name" | "quantity";

/**
 * Inventory page - manage user's ingredient inventory
 *
 * Features:
 * - View inventory items with filtering and sorting
 * - Add new inventory items
 * - Edit and delete existing items
 * - Bulk delete operations
 * - Low stock alerts banner
 * - Expiration tracking
 * - "Suggest Recipes" button for AI recommendations
 */
export default function InventoryPage() {
  // Data state
  const [items, setItems] = useState<InventoryItemWithDetails[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [suggesting, setSuggesting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemWithDetails | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItemWithDetails | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated");

  const { toast } = useToast();

  // Fetch inventory data
  const fetchInventory = useCallback(async () => {
    try {
      const response = await fetch("/api/inventory");

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "⚠️ Authentication Required",
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
        title: "❌ Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch ingredients for the add modal
  const fetchIngredients = useCallback(async () => {
    try {
      const response = await fetch("/api/ingredients?limit=500");
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchIngredients();
  }, [fetchInventory, fetchIngredients]);

  // Handle adding new item
  const handleAddItem = async (data: CreateInventoryItemRequest): Promise<boolean> => {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "❌ Error",
          description: error.error || "Failed to add item",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "✅ Item Added",
        description: "Inventory item added successfully",
      });
      fetchInventory();
      return true;
    } catch (error) {
      console.error("Error adding item:", error);
      return false;
    }
  };

  // Handle updating item
  const handleUpdateItem = async (
    id: string,
    data: UpdateInventoryItemRequest
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "❌ Error",
          description: error.error || "Failed to update item",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "✅ Item Updated",
        description: "Inventory item updated successfully",
      });
      fetchInventory();
      return true;
    } catch (error) {
      console.error("Error updating item:", error);
      return false;
    }
  };

  // Open delete confirmation dialog
  const handleDeleteItem = (item: InventoryItemWithDetails) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  // Confirm single item deletion
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/inventory/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "❌ Error",
          description: error.error || "Failed to delete item",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "🗑️ Item Deleted",
        description: `${itemToDelete.ingredient?.name || "Item"} removed from inventory`,
      });
      fetchInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "❌ Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Open bulk delete confirmation dialog
  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  // Confirm bulk deletion
  const confirmBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    setIsDeleting(true);
    setBulkDeleteDialogOpen(false);

    try {
      const deletePromises = Array.from(selectedItems).map((id) =>
        fetch(`/api/inventory/${id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.filter((r) => r.status === "rejected").length;

      if (failCount > 0) {
        toast({
          title: "⚠️ Partial Success",
          description: `Deleted ${successCount} items, ${failCount} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "🗑️ Items Deleted",
          description: `${successCount} item${successCount > 1 ? "s" : ""} removed from inventory`,
        });
      }

      setSelectedItems(new Set());
      setSelectionMode(false);
      fetchInventory();
    } catch (error) {
      console.error("Error bulk deleting items:", error);
      toast({
        title: "❌ Error",
        description: "Failed to delete items",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all filtered items
  const selectAll = () => {
    const allIds = filteredItems.map((item) => item.id);
    setSelectedItems(new Set(allIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  // Handle AI recipe suggestions
  const handleSuggestRecipes = async () => {
    if (items.length === 0) {
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

  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = item.ingredient?.name?.toLowerCase() || "";
        if (!name.includes(query)) return false;
      }

      // Location filter
      if (locationFilter !== "all" && item.location !== locationFilter) {
        return false;
      }

      // Low stock filter
      if (showLowStockOnly && !item.is_low_stock) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "expiration":
          // Use sortByExpiration logic inline
          const daysA = a.days_until_expiration;
          const daysB = b.days_until_expiration;
          if (daysA === null && daysB === null) return 0;
          if (daysA === null) return 1;
          if (daysB === null) return -1;
          return daysA - daysB;
        case "name":
          const nameA = a.ingredient?.name || "";
          const nameB = b.ingredient?.name || "";
          return nameA.localeCompare(nameB);
        case "quantity":
          return a.quantity - b.quantity;
        case "updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  // Calculate low stock summary
  const lowStockSummary = getLowStockSummary(items);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-semibold">Loading inventory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="brutalism-banner mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Package className="size-8" />
            <div>
              <h1 className="brutalism-title text-2xl">Inventory</h1>
              <p className="text-sm font-semibold text-gray-700">
                {items.length} {items.length === 1 ? "item" : "items"}
                {summary && summary.expiring_soon > 0 && (
                  <span className="ml-2 text-orange-600">
                    • {summary.expiring_soon} expiring soon
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Selection Mode Toggle */}
            {items.length > 0 && (
              <button
                onClick={() => {
                  if (selectionMode) {
                    clearSelection();
                  } else {
                    setSelectionMode(true);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 ${
                  selectionMode ? "brutalism-button-inverse" : "brutalism-button-neutral"
                }`}
                data-testid="toggle-selection-button"
              >
                {selectionMode ? (
                  <>
                    <X className="size-4" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="size-4" />
                    <span>Select</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="brutalism-button-secondary flex items-center gap-2 px-4 py-2"
            >
              <Plus className="size-4" />
              <span>Add Item</span>
            </button>
            <button
              onClick={handleSuggestRecipes}
              disabled={suggesting || items.length === 0}
              className="brutalism-button-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
              title="Suggest recipes based on inventory"
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

      {/* Selection Bar - shown when in selection mode */}
      {selectionMode && (
        <div className="brutalism-panel mb-6 flex items-center justify-between bg-sky-100 p-4">
          <div className="flex items-center gap-4">
            <span className="font-bold text-black">
              {selectedItems.size} of {filteredItems.length} selected
            </span>
            <button
              onClick={selectAll}
              className="brutalism-tag px-3 py-1 text-sm"
              disabled={selectedItems.size === filteredItems.length}
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="brutalism-tag px-3 py-1 text-sm"
              disabled={selectedItems.size === 0}
            >
              Clear
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={selectedItems.size === 0 || isDeleting}
            className="brutalism-button-primary flex items-center gap-2 bg-red-400 px-4 py-2 hover:bg-red-500 disabled:opacity-50"
            data-testid="bulk-delete-button"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                <span>Delete ({selectedItems.size})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Low Stock Banner */}
      {lowStockSummary.totalLow > 0 && (
        <LowStockBanner
          lowStockCount={lowStockSummary.lowCount}
          criticalCount={lowStockSummary.criticalCount}
          onViewItems={() => setShowLowStockOnly(!showLowStockOnly)}
          className="mb-6"
        />
      )}

      {/* Filters and Search */}
      <div className="brutalism-panel mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-black" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brutalism-input w-full py-2 pr-4 pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-black" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value as LocationFilter)}
                className="brutalism-input cursor-pointer px-3 py-2"
              >
                <option value="all">All Locations</option>
                <option value="pantry">Pantry</option>
                <option value="fridge">Fridge</option>
                <option value="freezer">Freezer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="brutalism-input cursor-pointer px-3 py-2"
            >
              <option value="updated">Recently Updated</option>
              <option value="expiration">Expiring Soon</option>
              <option value="name">Name (A-Z)</option>
              <option value="quantity">Quantity (Low First)</option>
            </select>

            {/* Low Stock Toggle */}
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-bold transition-all ${
                showLowStockOnly ? "brutalism-tag-active" : "brutalism-tag"
              }`}
            >
              <AlertTriangle className="size-4" />
              Low Stock
            </button>
          </div>
        </div>
      </div>

      {/* Location Summary (optional) */}
      {summary && items.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["pantry", "fridge", "freezer", "other"] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(locationFilter === loc ? "all" : loc)}
              className={`p-3 text-center transition-all ${
                locationFilter === loc ? "brutalism-tag-active" : "brutalism-card"
              }`}
            >
              <div className="text-2xl font-bold text-black">{summary.by_location[loc]}</div>
              <div className="text-sm font-semibold text-gray-700 capitalize">{loc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Inventory Grid or Empty State */}
      {items.length === 0 ? (
        <div className="brutalism-panel flex flex-col items-center justify-center p-12 text-center">
          <Package className="mb-4 size-16 text-gray-400" />
          <h2 className="brutalism-heading mb-2 text-xl">No Inventory Items Yet</h2>
          <p className="mb-6 text-gray-600">
            Add ingredients to your inventory to track what you have at home
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="brutalism-button-primary flex items-center gap-2 px-6 py-3"
          >
            <Plus className="size-5" />
            <span>Add First Item</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="brutalism-panel flex flex-col items-center justify-center p-12 text-center">
          <Search className="mb-4 size-12 text-gray-400" />
          <h2 className="brutalism-heading mb-2 text-lg">No Items Found</h2>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative">
              {/* Selection Checkbox */}
              {selectionMode && (
                <button
                  onClick={() => toggleItemSelection(item.id)}
                  className={`absolute -top-2 -left-2 z-10 flex size-6 items-center justify-center border-2 border-black bg-white transition-all ${
                    selectedItems.has(item.id) ? "bg-emerald-400" : "hover:bg-gray-100"
                  }`}
                  data-testid={`select-item-${item.id}`}
                >
                  {selectedItems.has(item.id) ? (
                    <CheckSquare className="size-4" />
                  ) : (
                    <Square className="size-4" />
                  )}
                </button>
              )}
              <InventoryCard
                item={item}
                onEdit={selectionMode ? undefined : (item) => setEditingItem(item)}
                onDelete={selectionMode ? undefined : handleDeleteItem}
                className={
                  selectionMode && selectedItems.has(item.id)
                    ? "ring-2 ring-emerald-500 ring-offset-2"
                    : ""
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Inventory Modal */}
      <AddInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
        ingredients={ingredients}
      />

      {/* Edit Inventory Modal */}
      <EditInventoryModal
        item={editingItem}
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSubmit={handleUpdateItem}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="brutalism-panel border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="brutalism-heading text-lg">Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              Are you sure you want to delete{" "}
              <span className="font-bold">{itemToDelete?.ingredient?.name || "this item"}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="brutalism-button-neutral">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              className="brutalism-button-primary bg-red-400 hover:bg-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="brutalism-panel border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="brutalism-heading text-lg">
              Delete {selectedItems.size} Item{selectedItems.size > 1 ? "s" : ""}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              Are you sure you want to delete{" "}
              <span className="font-bold">{selectedItems.size}</span> selected item
              {selectedItems.size > 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="brutalism-button-neutral">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="brutalism-button-primary bg-red-400 hover:bg-red-500"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
